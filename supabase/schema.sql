-- Vibe Class 커뮤니티 기능: 조회수 / 좋아요 / 댓글 / 신고
-- Supabase SQL Editor에서 그대로 실행하세요. (재실행해도 안전하도록 idempotent하게 작성)

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.programs (
  id text primary key,
  views integer not null default 0,
  likes integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id bigint generated always as identity primary key,
  program_id text not null references public.programs (id) on delete cascade,
  nickname text,
  content text not null,
  created_at timestamptz not null default now(),
  report_count integer not null default 0,
  hidden boolean not null default false,
  constraint comments_content_len check (char_length(content) between 1 and 500),
  constraint comments_nickname_len check (
    nickname is null or char_length(nickname) <= 30
  )
);

create index if not exists comments_program_id_created_at_idx
  on public.comments (program_id, created_at desc);

create index if not exists comments_program_id_visible_idx
  on public.comments (program_id)
  where hidden = false;

-- ---------------------------------------------------------------------------
-- Views: 목록 페이지에서 N+1 쿼리 없이 프로그램별 통계를 한 번에 조회
-- ---------------------------------------------------------------------------

create or replace view public.program_comment_counts
with (security_invoker = true) as
select program_id, count(*)::int as comment_count
from public.comments
where hidden = false
group by program_id;

create or replace view public.program_stats
with (security_invoker = true) as
select
  p.id as program_id,
  p.views,
  p.likes,
  coalesce(c.comment_count, 0) as comment_count
from public.programs p
left join public.program_comment_counts c on c.program_id = p.id;

grant select on public.programs to anon, authenticated;
grant select on public.comments to anon, authenticated;
grant select on public.program_comment_counts to anon, authenticated;
grant select on public.program_stats to anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS: anon/authenticated는 SELECT만 가능. 모든 쓰기는 아래 SECURITY DEFINER
-- RPC를 통해서만 수행되어, 클라이언트가 REST로 카운터를 직접 조작할 수 없다.
-- ---------------------------------------------------------------------------

alter table public.programs enable row level security;
alter table public.comments enable row level security;

drop policy if exists "programs_public_read" on public.programs;
create policy "programs_public_read" on public.programs
  for select using (true);

drop policy if exists "comments_public_read_visible" on public.comments;
create policy "comments_public_read_visible" on public.comments
  for select using (hidden = false);

-- ---------------------------------------------------------------------------
-- RPC functions
-- ---------------------------------------------------------------------------

create or replace function public.increment_view(p_program_id text)
returns table (views integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.programs (id, views) values (p_program_id, 1)
  on conflict (id) do update set views = public.programs.views + 1
  returning public.programs.views into views;
  return next;
end;
$$;

create or replace function public.increment_like(p_program_id text)
returns table (likes integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.programs (id, likes) values (p_program_id, 1)
  on conflict (id) do update set likes = public.programs.likes + 1
  returning public.programs.likes into likes;
  return next;
end;
$$;

-- 댓글 작성도 RPC로만 허용 — trim/길이 검증과 빈 닉네임 처리(NULL 저장,
-- 표시 시점에 "익명 선생님"으로 대체)를 한 곳에서 강제한다.
create or replace function public.add_comment(
  p_program_id text,
  p_nickname text,
  p_content text
)
returns public.comments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nickname text;
  v_content text;
  v_row public.comments;
begin
  v_content := trim(p_content);
  if char_length(v_content) < 1 or char_length(v_content) > 500 then
    raise exception 'invalid_content';
  end if;

  v_nickname := nullif(trim(coalesce(p_nickname, '')), '');
  if v_nickname is not null and char_length(v_nickname) > 30 then
    v_nickname := left(v_nickname, 30);
  end if;

  insert into public.programs (id) values (p_program_id)
  on conflict (id) do nothing;

  insert into public.comments (program_id, nickname, content)
  values (p_program_id, v_nickname, v_content)
  returning * into v_row;

  return v_row;
end;
$$;

-- 신고 누적 시 자동 숨김. 임계값은 클라이언트가 조작할 수 없도록 함수
-- 내부 상수로 고정한다.
create or replace function public.report_comment(p_comment_id bigint)
returns table (hidden boolean, report_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_threshold constant integer := 5;
begin
  update public.comments c
  set report_count = c.report_count + 1,
      hidden = (c.report_count + 1) >= v_threshold
  where c.id = p_comment_id
  returning c.hidden, c.report_count into hidden, report_count;

  if not found then
    raise exception 'comment_not_found';
  end if;
  return next;
end;
$$;

revoke all on function public.increment_view(text) from public;
revoke all on function public.increment_like(text) from public;
revoke all on function public.add_comment(text, text, text) from public;
revoke all on function public.report_comment(bigint) from public;

grant execute on function public.increment_view(text) to anon, authenticated;
grant execute on function public.increment_like(text) to anon, authenticated;
grant execute on function public.add_comment(text, text, text) to anon, authenticated;
grant execute on function public.report_comment(bigint) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Site Visitor Tracking: 오늘/누적 방문자 수
-- ---------------------------------------------------------------------------

create table if not exists public.site_visits (
  date date primary key default current_date,
  count integer not null default 0
);

alter table public.site_visits enable row level security;

drop policy if exists "site_visits_public_read" on public.site_visits;
create policy "site_visits_public_read" on public.site_visits
  for select using (true);

grant select on public.site_visits to anon, authenticated;

-- 방문 기록 (날짜는 한국 시간 기준): 오늘 날짜 카운트를 +1 하고 오늘/누적 집계를 반환
create or replace function public.record_site_visit()
returns table (today_count integer, total_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today integer;
  v_total integer;
begin
  insert into public.site_visits (date, count) values ((now() at time zone 'Asia/Seoul')::date, 1)
  on conflict (date) do update set count = site_visits.count + 1
  returning site_visits.count into v_today;

  select coalesce(sum(count), 0)::integer into v_total from public.site_visits;

  today_count := v_today;
  total_count := v_total;
  return next;
end;
$$;

-- 방문 기록 없이 현재 집계만 조회
create or replace function public.get_site_visitor_stats()
returns table (today_count integer, total_count integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    coalesce((select count from public.site_visits where date = (now() at time zone 'Asia/Seoul')::date), 0)::integer,
    coalesce((select sum(count)::integer from public.site_visits), 0);
end;
$$;

revoke all on function public.record_site_visit() from public;
revoke all on function public.get_site_visitor_stats() from public;
grant execute on function public.record_site_visit() to anon, authenticated;
grant execute on function public.get_site_visitor_stats() to anon, authenticated;
