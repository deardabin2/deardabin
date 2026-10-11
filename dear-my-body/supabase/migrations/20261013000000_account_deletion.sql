-- Phase 4: 계정 삭제
-- service role 키 없이, 로그인한 본인만 자기 계정을 지울 수 있게 한다.
-- auth.users 행을 지우면 profiles → goals·daily_logs → meals·behavior_checks·coach_comments 가 연쇄 삭제된다.
-- Storage 의 식사 사진은 앱(서버 액션)이 이 함수를 부르기 전에 먼저 지운다.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = 'insufficient_privilege';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
