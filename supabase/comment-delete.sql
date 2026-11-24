-- 댓글 삭제 기능: 작성자는 비밀번호로, 관리자는 관리자 페이지에서 삭제
-- Supabase SQL Editor에서 그대로 실행하세요. (schema.sql 실행 후, 재실행해도 안전)

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- 댓글 비밀번호는 comments와 분리된 표에 bcrypt 해시로만 저장한다.
-- comments는 anon이 SELECT할 수 있으므로 같은 표에 두면 해시가 노출된다.
-- 이 표에는 anon/authenticated 권한을 주지 않는다 (RLS on + 정책 없음).
-- ---------------------------------------------------------------------------

create table if not exists public.comment_secrets (
  comment_id bigint primary key references public.comments (id) on delete cascade,
  password_hash text not null,
  failed_attempts integer not null default 0
);

alter table public.comment_secrets enable row level security;
revoke all on public.comment_secrets from anon, authenticated;

-- 비밀번호를 받는 댓글 작성 RPC (기존 3인자 add_comment는 그대로 둔다)
create or replace function public.add_comment(
  p_program_id text,
  p_nickname text,
  p_content text,
  p_password text
)
returns public.comments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.comments;
  v_password text;
begin
  v_row := public.add_comment(p_program_id, p_nickname, p_content);

  v_password := nullif(p_password, '');
  if v_password is not null then
    if char_length(v_password) < 4 or char_length(v_password) > 50 then
      raise exception 'invalid_password';
    end if;
    insert into public.comment_secrets (comment_id, password_hash)
    values (v_row.id, extensions.crypt(v_password, extensions.gen_salt('bf', 8)));
  end if;

  return v_row;
end;
$$;

-- 작성자 삭제. 결과: 'deleted' | 'wrong_password' | 'no_password' | 'locked' | 'not_found'
-- 무작위 대입을 막기 위해 10번 틀리면 그 댓글은 관리자만 지울 수 있다.
create or replace function public.delete_comment_with_password(
  p_comment_id bigint,
  p_password text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret public.comment_secrets;
  v_max_attempts constant integer := 10;
begin
  if not exists (select 1 from public.comments where id = p_comment_id) then
    return 'not_found';
  end if;

  select * into v_secret
  from public.comment_secrets
  where comment_id = p_comment_id
  for update;

  if not found then
    return 'no_password';
  end if;
  if v_secret.failed_attempts >= v_max_attempts then
    return 'locked';
  end if;

  if v_secret.password_hash = extensions.crypt(coalesce(p_password, ''), v_secret.password_hash) then
    delete from public.comments where id = p_comment_id;
    return 'deleted';
  end if;

  update public.comment_secrets
  set failed_attempts = failed_attempts + 1
  where comment_id = p_comment_id;
  return 'wrong_password';
end;
$$;

revoke all on function public.add_comment(text, text, text, text) from public;
revoke all on function public.delete_comment_with_password(bigint, text) from public;
grant execute on function public.add_comment(text, text, text, text) to anon, authenticated;
grant execute on function public.delete_comment_with_password(bigint, text) to anon, authenticated;
