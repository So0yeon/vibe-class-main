-- Vibe Class 콘텐츠 저장소: 게임 목록 / 소개 섹션 / 파일 저장소
-- Supabase SQL Editor에서 그대로 실행하세요. (재실행해도 안전하도록 idempotent하게 작성)
--
-- 쓰기는 모두 서버(관리자 페이지)에서 service_role 키로만 수행한다.
-- anon/authenticated는 공개된 게임과 소개 섹션을 읽기만 할 수 있다.

-- ---------------------------------------------------------------------------
-- games: Notion DB를 대체하는 게임/프로그램 목록
-- id는 text — Notion에서 옮겨온 항목은 기존 Notion 페이지 id를 그대로 유지해서
-- 조회수/좋아요/댓글(programs.id)과 /program/[id] 주소가 이어지도록 한다.
-- ---------------------------------------------------------------------------

create table if not exists public.games (
  id text primary key default gen_random_uuid()::text,
  title text not null default '',
  description text not null default '',
  thumbnail_url text,
  url text,
  tags text[] not null default '{}',
  date date,
  published boolean not null default false,
  priority integer not null default 0,
  worksheets jsonb not null default '[]'::jsonb,
  grades text[] not null default '{전학년}',
  unit text not null default '',
  play_time text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists games_published_priority_idx
  on public.games (priority desc)
  where published = true;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists games_touch_updated_at on public.games;
create trigger games_touch_updated_at
  before update on public.games
  for each row execute function public.touch_updated_at();

alter table public.games enable row level security;

drop policy if exists "games_public_read_published" on public.games;
create policy "games_public_read_published" on public.games
  for select using (published = true);

grant select on public.games to anon, authenticated;

-- ---------------------------------------------------------------------------
-- site_about: 소개 섹션 (항상 id = 1 한 줄만 사용)
-- ---------------------------------------------------------------------------

create table if not exists public.site_about (
  id integer primary key default 1,
  title text not null default '',
  paragraphs text[] not null default '{}',
  profile_image text,
  banner_image text,
  updated_at timestamptz not null default now(),
  constraint site_about_single_row check (id = 1)
);

drop trigger if exists site_about_touch_updated_at on public.site_about;
create trigger site_about_touch_updated_at
  before update on public.site_about
  for each row execute function public.touch_updated_at();

alter table public.site_about enable row level security;

drop policy if exists "site_about_public_read" on public.site_about;
create policy "site_about_public_read" on public.site_about
  for select using (true);

grant select on public.site_about to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: 썸네일·활동지·소개 이미지용 공개 버킷
-- 공개 버킷의 파일 주소는 만료되지 않는다. 업로드는 관리자 페이지가 서버에서
-- 발급한 1회용 업로드 주소로만 가능하다.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;
