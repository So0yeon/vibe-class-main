-- 방문자 수 "오늘" 기준을 한국 시간(Asia/Seoul)으로 바꾼다.
-- Supabase DB는 UTC라 current_date를 쓰면 오늘 방문자가 오전 9시(KST)에 초기화된다.
-- Supabase SQL Editor에서 그대로 실행하세요. (재실행해도 안전)

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
