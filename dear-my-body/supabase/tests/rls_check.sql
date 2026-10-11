-- RLS 검증 스크립트
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 실행한다.
-- 모든 작업은 마지막에 rollback 되므로 실제 데이터는 남지 않는다.
-- 하나라도 실패하면 'RLS 검증 실패: ...' 오류가 나고 멈춘다.
-- 끝까지 통과하면 마지막 결과에 'RLS 검증 통과' 가 보인다.

begin;

-- 테스트 사용자: A, B(고객, 동의함), C(고객, 미동의), D(코치)
insert into auth.users (id, email) values
  ('00000000-0000-4000-a000-00000000000a', 'rls-a@example.com'),
  ('00000000-0000-4000-a000-00000000000b', 'rls-b@example.com'),
  ('00000000-0000-4000-a000-00000000000c', 'rls-c@example.com'),
  ('00000000-0000-4000-a000-00000000000d', 'rls-d@example.com');

update public.profiles set sensitive_consent_at = now(), sensitive_consent_version = 'test'
where id in (
  '00000000-0000-4000-a000-00000000000a',
  '00000000-0000-4000-a000-00000000000b',
  '00000000-0000-4000-a000-00000000000d'
);
update public.profiles set role = 'coach' where id = '00000000-0000-4000-a000-00000000000d';

-------------------------------------------------------------------------------
-- 고객 A 로 기록 작성
-------------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-00000000000a","role":"authenticated"}', true);
set local role authenticated;

insert into public.goals (id, user_id, start_date, end_date, motivation)
values ('10000000-0000-4000-a000-00000000000a', '00000000-0000-4000-a000-00000000000a', '2026-10-01', '2026-12-31', 'A의 동기');

insert into public.behavior_goals (id, goal_id, title, kind)
values ('20000000-0000-4000-a000-00000000000a', '10000000-0000-4000-a000-00000000000a', '아침 먹기', 'check');

insert into public.daily_logs (id, user_id, log_date, weight, note)
values ('30000000-0000-4000-a000-00000000000a', '00000000-0000-4000-a000-00000000000a', '2026-10-01', 60, 'A의 기록');

insert into public.meals (daily_log_id, meal_type, description, photo_path)
values ('30000000-0000-4000-a000-00000000000a', 'lunch', 'A의 점심', '00000000-0000-4000-a000-00000000000a/2026-10-01/lunch.jpg');

insert into public.behavior_checks (daily_log_id, behavior_goal_id, value)
values ('30000000-0000-4000-a000-00000000000a', '20000000-0000-4000-a000-00000000000a', 1);

insert into storage.objects (bucket_id, name)
values ('meal-photos', '00000000-0000-4000-a000-00000000000a/2026-10-01/lunch.jpg');

-- A 는 자기 기록을 볼 수 있어야 한다
do $$
begin
  if (select count(*) from public.daily_logs) <> 1 then
    raise exception 'RLS 검증 실패: A가 자기 기록을 못 봄';
  end if;
end $$;

-- A 는 자기 role 을 coach 로 바꿀 수 없어야 한다
do $$
begin
  update public.profiles set role = 'coach' where id = '00000000-0000-4000-a000-00000000000a';
  raise exception 'RLS 검증 실패: 고객이 자기 role 을 바꿈';
exception when insufficient_privilege then null;
end $$;

reset role;

-------------------------------------------------------------------------------
-- 고객 B 는 A 의 어떤 기록도 보거나 바꿀 수 없어야 한다
-------------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-00000000000b","role":"authenticated"}', true);
set local role authenticated;

do $$
declare
  n integer;
begin
  if (select count(*) from public.daily_logs) <> 0 then
    raise exception 'RLS 검증 실패: B가 A의 daily_logs 를 봄';
  end if;
  if (select count(*) from public.meals) <> 0 then
    raise exception 'RLS 검증 실패: B가 A의 meals 를 봄';
  end if;
  if (select count(*) from public.behavior_checks) <> 0 then
    raise exception 'RLS 검증 실패: B가 A의 behavior_checks 를 봄';
  end if;
  if (select count(*) from public.goals) <> 0 then
    raise exception 'RLS 검증 실패: B가 A의 goals 를 봄';
  end if;
  if (select count(*) from public.behavior_goals) <> 0 then
    raise exception 'RLS 검증 실패: B가 A의 behavior_goals 를 봄';
  end if;
  if (select count(*) from public.profiles where role = 'client') <> 1 then
    raise exception 'RLS 검증 실패: B가 다른 고객 프로필을 봄';
  end if;
  if (select count(*) from storage.objects where bucket_id = 'meal-photos') <> 0 then
    raise exception 'RLS 검증 실패: B가 A의 식사 사진을 봄';
  end if;

  update public.daily_logs set note = 'B가 수정' where user_id = '00000000-0000-4000-a000-00000000000a';
  get diagnostics n = row_count;
  if n <> 0 then
    raise exception 'RLS 검증 실패: B가 A의 기록을 수정함';
  end if;

  delete from public.daily_logs where user_id = '00000000-0000-4000-a000-00000000000a';
  get diagnostics n = row_count;
  if n <> 0 then
    raise exception 'RLS 검증 실패: B가 A의 기록을 삭제함';
  end if;
end $$;

-- B 가 A 명의로 기록을 만들 수 없어야 한다
do $$
begin
  insert into public.daily_logs (user_id, log_date)
  values ('00000000-0000-4000-a000-00000000000a', '2026-10-02');
  raise exception 'RLS 검증 실패: B가 A 명의로 기록을 만듦';
exception when insufficient_privilege then null;
end $$;

-- B 가 A 의 daily_log 에 식사를 붙일 수 없어야 한다
do $$
begin
  insert into public.meals (daily_log_id, meal_type, description)
  values ('30000000-0000-4000-a000-00000000000a', 'dinner', 'B가 끼워넣음');
  raise exception 'RLS 검증 실패: B가 A의 기록에 식사를 추가함';
exception when insufficient_privilege then null;
end $$;

-- B 가 자기 기록에 A 의 행동 목표 체크를 붙일 수 없어야 한다
insert into public.daily_logs (id, user_id, log_date)
values ('30000000-0000-4000-a000-00000000000b', '00000000-0000-4000-a000-00000000000b', '2026-10-01');
do $$
begin
  insert into public.behavior_checks (daily_log_id, behavior_goal_id, value)
  values ('30000000-0000-4000-a000-00000000000b', '20000000-0000-4000-a000-00000000000a', 1);
  raise exception 'RLS 검증 실패: B가 A의 행동 목표를 체크함';
exception when insufficient_privilege then null;
end $$;

-- B 가 A 의 사진 폴더에 업로드할 수 없어야 한다
do $$
begin
  insert into storage.objects (bucket_id, name)
  values ('meal-photos', '00000000-0000-4000-a000-00000000000a/2026-10-02/hack.jpg');
  raise exception 'RLS 검증 실패: B가 A의 사진 폴더에 업로드함';
exception when insufficient_privilege then null;
end $$;

-- B 는 공개되지 않은 콘텐츠를 만들 수 없어야 한다
do $$
begin
  insert into public.articles (title, category, body) values ('B의 글', '기초', '');
  raise exception 'RLS 검증 실패: 고객이 콘텐츠를 만듦';
exception when insufficient_privilege then null;
end $$;

reset role;

-------------------------------------------------------------------------------
-- 미동의 고객 C 는 기록을 만들 수 없어야 한다
-------------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-00000000000c","role":"authenticated"}', true);
set local role authenticated;

do $$
begin
  insert into public.daily_logs (user_id, log_date)
  values ('00000000-0000-4000-a000-00000000000c', '2026-10-01');
  raise exception 'RLS 검증 실패: 미동의 사용자가 기록을 만듦';
exception when insufficient_privilege then null;
end $$;

do $$
begin
  insert into storage.objects (bucket_id, name)
  values ('meal-photos', '00000000-0000-4000-a000-00000000000c/2026-10-01/lunch.jpg');
  raise exception 'RLS 검증 실패: 미동의 사용자가 사진을 올림';
exception when insufficient_privilege then null;
end $$;

reset role;

-------------------------------------------------------------------------------
-- 코치 D 는 모든 고객 기록을 볼 수 있지만 수정할 수는 없어야 한다
-------------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-00000000000d","role":"authenticated"}', true);
set local role authenticated;

do $$
declare
  n integer;
begin
  if (select count(*) from public.daily_logs) <> 2 then
    raise exception 'RLS 검증 실패: 코치가 고객 기록을 못 봄';
  end if;
  if (select count(*) from public.meals) <> 1 then
    raise exception 'RLS 검증 실패: 코치가 고객 식사를 못 봄';
  end if;
  if (select count(*) from storage.objects where bucket_id = 'meal-photos') <> 1 then
    raise exception 'RLS 검증 실패: 코치가 고객 사진을 못 봄';
  end if;

  update public.daily_logs set note = '코치가 수정' where user_id = '00000000-0000-4000-a000-00000000000a';
  get diagnostics n = row_count;
  if n <> 0 then
    raise exception 'RLS 검증 실패: 코치가 고객 기록을 수정함';
  end if;
end $$;

-- 코치는 자기 이름으로 코멘트를 남길 수 있다
insert into public.coach_comments (daily_log_id, coach_id, body)
values ('30000000-0000-4000-a000-00000000000a', '00000000-0000-4000-a000-00000000000d', '잘하고 계세요');

-- 다른 사람 이름으로는 코멘트를 쓸 수 없다
do $$
begin
  insert into public.coach_comments (daily_log_id, coach_id, body)
  values ('30000000-0000-4000-a000-00000000000a', '00000000-0000-4000-a000-00000000000a', '사칭');
  raise exception 'RLS 검증 실패: 코치가 다른 사람 이름으로 코멘트를 씀';
exception when insufficient_privilege then null;
end $$;

-- 코치는 콘텐츠 이미지를 올릴 수 있다
insert into storage.objects (bucket_id, name) values ('content-images', 'ingredients/sample.jpg');

reset role;

-------------------------------------------------------------------------------
-- 코멘트: 기록의 주인 A 는 볼 수 있고, B 는 볼 수 없고, 고객은 쓸 수 없어야 한다
-------------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-00000000000a","role":"authenticated"}', true);
set local role authenticated;

do $$
begin
  if (select count(*) from public.coach_comments) <> 1 then
    raise exception 'RLS 검증 실패: A가 자기 기록의 코멘트를 못 봄';
  end if;
  if (select count(*) from public.profiles where role = 'coach') <> 1 then
    raise exception 'RLS 검증 실패: 고객이 코치 이름을 못 봄';
  end if;
end $$;

do $$
begin
  insert into public.coach_comments (daily_log_id, coach_id, body)
  values ('30000000-0000-4000-a000-00000000000a', '00000000-0000-4000-a000-00000000000a', '셀프 코멘트');
  raise exception 'RLS 검증 실패: 고객이 코멘트를 씀';
exception when insufficient_privilege then null;
end $$;

do $$
begin
  insert into storage.objects (bucket_id, name) values ('content-images', 'ingredients/hack.jpg');
  raise exception 'RLS 검증 실패: 고객이 콘텐츠 이미지를 올림';
exception when insufficient_privilege then null;
end $$;

reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-00000000000b","role":"authenticated"}', true);
set local role authenticated;

do $$
begin
  if (select count(*) from public.coach_comments) <> 0 then
    raise exception 'RLS 검증 실패: B가 A의 코멘트를 봄';
  end if;
end $$;

reset role;

-------------------------------------------------------------------------------
-- 로그인하지 않은 사용자(anon)는 아무것도 볼 수 없어야 한다
-------------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

do $$
begin
  perform 1 from public.daily_logs;
  raise exception 'RLS 검증 실패: anon 이 daily_logs 에 접근함';
exception when insufficient_privilege then null;
end $$;

reset role;

-- anon 은 계정 삭제 함수를 부를 수 없어야 한다
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
do $$
begin
  perform public.delete_my_account();
  raise exception 'RLS 검증 실패: anon 이 계정 삭제 함수를 부름';
exception when insufficient_privilege then null;
end $$;
reset role;

-------------------------------------------------------------------------------
-- 계정 삭제: A 가 자기 계정을 지우면 A 의 데이터만 사라져야 한다
-------------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-00000000000a","role":"authenticated"}', true);
set local role authenticated;
select public.delete_my_account();
reset role;

do $$
begin
  if exists (select 1 from auth.users where id = '00000000-0000-4000-a000-00000000000a') then
    raise exception 'RLS 검증 실패: 계정이 지워지지 않음';
  end if;
  if exists (select 1 from public.daily_logs where user_id = '00000000-0000-4000-a000-00000000000a') then
    raise exception 'RLS 검증 실패: 지운 계정의 기록이 남음';
  end if;
  if not exists (select 1 from public.daily_logs where user_id = '00000000-0000-4000-a000-00000000000b') then
    raise exception 'RLS 검증 실패: 다른 사람 기록까지 지워짐';
  end if;
end $$;

select 'RLS 검증 통과' as result;

rollback;
