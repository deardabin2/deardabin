-- 디어마이바디 Phase 1 스키마
-- 권한은 모두 RLS 정책으로 강제한다. 프론트엔드 조건문은 UX 용도일 뿐이다.

-------------------------------------------------------------------------------
-- 공통: updated_at 자동 갱신
-------------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-------------------------------------------------------------------------------
-- profiles
-------------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'client' check (role in ('client', 'coach')),
  display_name text not null default '' check (char_length(display_name) <= 30),
  -- 건강정보(민감정보) 수집·이용 동의 시각. null 이면 미동의(또는 철회)
  sensitive_consent_at timestamptz,
  -- 동의 문구가 바뀌었을 때 재동의를 받기 위한 버전
  sensitive_consent_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 가입 시 프로필 자동 생성. role 은 항상 client 로 시작한다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 30)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-------------------------------------------------------------------------------
-- 권한 헬퍼 (RLS 정책 안에서 profiles 를 재귀 조회하지 않도록 security definer)
-------------------------------------------------------------------------------
create or replace function public.is_coach()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'coach'
  );
$$;

create or replace function public.has_health_consent()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and sensitive_consent_at is not null
  );
$$;

-------------------------------------------------------------------------------
-- goals
-------------------------------------------------------------------------------
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  -- 체중 입력은 항상 선택 사항
  start_weight numeric(5, 2) check (start_weight between 20 and 300),
  target_weight numeric(5, 2) check (target_weight between 20 and 300),
  motivation text not null default '' check (char_length(motivation) <= 100),
  status text not null default 'active' check (status in ('active', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index goals_user_id_idx on public.goals (user_id);
-- 진행 중인 목표는 한 사람당 하나
create unique index goals_one_active_per_user
  on public.goals (user_id) where status = 'active';

create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-------------------------------------------------------------------------------
-- behavior_goals
-------------------------------------------------------------------------------
create table public.behavior_goals (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 40),
  kind text not null check (kind in ('check', 'number')),
  target_value numeric(8, 2) check (target_value > 0),
  unit text check (char_length(unit) <= 10),
  sort_order smallint not null default 0,
  -- 지난 체크 기록을 지우지 않으려고, 목록에서 뺀 행동 목표는 삭제 대신 보관한다
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind = 'check' or target_value is not null)
);

create index behavior_goals_goal_id_idx on public.behavior_goals (goal_id);

create trigger behavior_goals_set_updated_at
  before update on public.behavior_goals
  for each row execute function public.set_updated_at();

-- 목표 하나에 진행 중인 행동 목표는 최대 5개
create or replace function public.enforce_behavior_goal_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.archived_at is null and (
    select count(*) from public.behavior_goals
    where goal_id = new.goal_id
      and archived_at is null
      and id <> new.id
  ) >= 5 then
    raise exception 'behavior goal limit exceeded' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger behavior_goals_limit
  before insert or update of archived_at, goal_id on public.behavior_goals
  for each row execute function public.enforce_behavior_goal_limit();

-------------------------------------------------------------------------------
-- daily_logs
-------------------------------------------------------------------------------
create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- Asia/Seoul 기준 날짜
  log_date date not null,
  weight numeric(5, 2) check (weight between 20 and 300),
  water_ml integer check (water_ml between 0 and 10000),
  sleep_hours numeric(3, 1) check (sleep_hours between 0 and 24),
  steps integer check (steps between 0 and 100000),
  exercise_note text check (char_length(exercise_note) <= 500),
  hunger smallint check (hunger between 1 and 5),
  energy smallint check (energy between 1 and 5),
  mood smallint check (mood between 1 and 5),
  digestion smallint check (digestion between 1 and 5),
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create trigger daily_logs_set_updated_at
  before update on public.daily_logs
  for each row execute function public.set_updated_at();

-------------------------------------------------------------------------------
-- meals
-- 영양 정보는 나중에 meal_nutrition 같은 별도 테이블(meal_id 1:1) 또는 컬럼 추가로 확장한다.
-------------------------------------------------------------------------------
create table public.meals (
  id uuid primary key default gen_random_uuid(),
  daily_log_id uuid not null references public.daily_logs (id) on delete cascade,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  description text not null default '' check (char_length(description) <= 500),
  -- meal-photos 버킷 안의 경로: {user_id}/{log_date}/{meal_type}-{uuid}.jpg
  photo_path text,
  eaten_at time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (daily_log_id, meal_type)
);

create trigger meals_set_updated_at
  before update on public.meals
  for each row execute function public.set_updated_at();

-------------------------------------------------------------------------------
-- behavior_checks
-------------------------------------------------------------------------------
create table public.behavior_checks (
  id uuid primary key default gen_random_uuid(),
  daily_log_id uuid not null references public.daily_logs (id) on delete cascade,
  behavior_goal_id uuid not null references public.behavior_goals (id) on delete cascade,
  -- check 형: 1(했어요) / 0, number 형: 실제 수치
  value numeric(8, 2) not null check (value >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (daily_log_id, behavior_goal_id)
);

create index behavior_checks_behavior_goal_id_idx on public.behavior_checks (behavior_goal_id);

create trigger behavior_checks_set_updated_at
  before update on public.behavior_checks
  for each row execute function public.set_updated_at();

-------------------------------------------------------------------------------
-- 콘텐츠: ingredients / recipes / recipe_ingredients / articles
-------------------------------------------------------------------------------
create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  tags text[] not null default '{}',
  summary text not null default '',
  benefits text not null default '',
  how_to_use text not null default '',
  caution text not null default '',
  image_path text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ingredients_tags_idx on public.ingredients using gin (tags);

create trigger ingredients_set_updated_at
  before update on public.ingredients
  for each row execute function public.set_updated_at();

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  servings smallint not null default 1 check (servings > 0),
  cook_minutes smallint check (cook_minutes >= 0),
  -- [{ "name": "두부", "amount": 150, "unit": "g" }, ...]
  ingredients jsonb not null default '[]' check (jsonb_typeof(ingredients) = 'array'),
  -- [{ "order": 1, "text": "..." }, ...]
  steps jsonb not null default '[]' check (jsonb_typeof(steps) = 'array'),
  tags text[] not null default '{}',
  nutrition_note text not null default '',
  image_path text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recipes_tags_idx on public.recipes using gin (tags);

create trigger recipes_set_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

create table public.recipe_ingredients (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (recipe_id, ingredient_id)
);

create index recipe_ingredients_ingredient_id_idx on public.recipe_ingredients (ingredient_id);

create trigger recipe_ingredients_set_updated_at
  before update on public.recipe_ingredients
  for each row execute function public.set_updated_at();

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  body text not null default '',
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger articles_set_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

-------------------------------------------------------------------------------
-- 테이블 권한: anon 은 아무것도 못 하고, authenticated 도 RLS 를 통과해야 한다
-------------------------------------------------------------------------------
revoke all on
  public.profiles, public.goals, public.behavior_goals, public.daily_logs,
  public.meals, public.behavior_checks, public.ingredients, public.recipes,
  public.recipe_ingredients, public.articles
from anon, authenticated;

grant select, insert, update, delete on
  public.goals, public.behavior_goals, public.daily_logs, public.meals,
  public.behavior_checks, public.ingredients, public.recipes,
  public.recipe_ingredients, public.articles
to authenticated;

-- profiles: 행 생성/삭제는 트리거와 계정 삭제로만, role 은 SQL 로만 바꾼다
grant select on public.profiles to authenticated;
grant update (display_name, sensitive_consent_at, sensitive_consent_version)
  on public.profiles to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-------------------------------------------------------------------------------
-- RLS
-------------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.behavior_goals enable row level security;
alter table public.daily_logs enable row level security;
alter table public.meals enable row level security;
alter table public.behavior_checks enable row level security;
alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.articles enable row level security;

-- profiles
create policy "본인 또는 코치는 프로필을 볼 수 있다"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_coach()));

create policy "본인 프로필만 수정할 수 있다"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- goals
create policy "본인 또는 코치는 목표를 볼 수 있다"
  on public.goals for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_coach()));

create policy "동의한 본인만 목표를 만들 수 있다"
  on public.goals for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.has_health_consent()));

create policy "동의한 본인만 목표를 수정할 수 있다"
  on public.goals for update to authenticated
  using (user_id = (select auth.uid()) and (select public.has_health_consent()))
  with check (user_id = (select auth.uid()));

create policy "본인만 목표를 삭제할 수 있다"
  on public.goals for delete to authenticated
  using (user_id = (select auth.uid()));

-- behavior_goals (부모 goal 의 소유자 기준)
create policy "본인 또는 코치는 행동 목표를 볼 수 있다"
  on public.behavior_goals for select to authenticated
  using (
    (select public.is_coach())
    or exists (
      select 1 from public.goals g
      where g.id = goal_id and g.user_id = (select auth.uid())
    )
  );

create policy "동의한 본인만 행동 목표를 만들 수 있다"
  on public.behavior_goals for insert to authenticated
  with check (
    (select public.has_health_consent())
    and exists (
      select 1 from public.goals g
      where g.id = goal_id and g.user_id = (select auth.uid())
    )
  );

create policy "동의한 본인만 행동 목표를 수정할 수 있다"
  on public.behavior_goals for update to authenticated
  using (
    (select public.has_health_consent())
    and exists (
      select 1 from public.goals g
      where g.id = goal_id and g.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.goals g
      where g.id = goal_id and g.user_id = (select auth.uid())
    )
  );

create policy "본인만 행동 목표를 삭제할 수 있다"
  on public.behavior_goals for delete to authenticated
  using (
    exists (
      select 1 from public.goals g
      where g.id = goal_id and g.user_id = (select auth.uid())
    )
  );

-- daily_logs
create policy "본인 또는 코치는 일일 기록을 볼 수 있다"
  on public.daily_logs for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_coach()));

create policy "동의한 본인만 일일 기록을 만들 수 있다"
  on public.daily_logs for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.has_health_consent()));

create policy "동의한 본인만 일일 기록을 수정할 수 있다"
  on public.daily_logs for update to authenticated
  using (user_id = (select auth.uid()) and (select public.has_health_consent()))
  with check (user_id = (select auth.uid()));

create policy "본인만 일일 기록을 삭제할 수 있다"
  on public.daily_logs for delete to authenticated
  using (user_id = (select auth.uid()));

-- meals (부모 daily_log 의 소유자 기준)
create policy "본인 또는 코치는 식사 기록을 볼 수 있다"
  on public.meals for select to authenticated
  using (
    (select public.is_coach())
    or exists (
      select 1 from public.daily_logs d
      where d.id = daily_log_id and d.user_id = (select auth.uid())
    )
  );

create policy "동의한 본인만 식사 기록을 만들 수 있다"
  on public.meals for insert to authenticated
  with check (
    (select public.has_health_consent())
    and exists (
      select 1 from public.daily_logs d
      where d.id = daily_log_id and d.user_id = (select auth.uid())
    )
  );

create policy "동의한 본인만 식사 기록을 수정할 수 있다"
  on public.meals for update to authenticated
  using (
    (select public.has_health_consent())
    and exists (
      select 1 from public.daily_logs d
      where d.id = daily_log_id and d.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.daily_logs d
      where d.id = daily_log_id and d.user_id = (select auth.uid())
    )
  );

create policy "본인만 식사 기록을 삭제할 수 있다"
  on public.meals for delete to authenticated
  using (
    exists (
      select 1 from public.daily_logs d
      where d.id = daily_log_id and d.user_id = (select auth.uid())
    )
  );

-- behavior_checks (daily_log 와 behavior_goal 이 모두 본인 것이어야 한다)
create policy "본인 또는 코치는 행동 체크를 볼 수 있다"
  on public.behavior_checks for select to authenticated
  using (
    (select public.is_coach())
    or exists (
      select 1 from public.daily_logs d
      where d.id = daily_log_id and d.user_id = (select auth.uid())
    )
  );

create policy "동의한 본인만 행동 체크를 만들 수 있다"
  on public.behavior_checks for insert to authenticated
  with check (
    (select public.has_health_consent())
    and exists (
      select 1 from public.daily_logs d
      where d.id = daily_log_id and d.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.behavior_goals bg
      join public.goals g on g.id = bg.goal_id
      where bg.id = behavior_goal_id and g.user_id = (select auth.uid())
    )
  );

create policy "동의한 본인만 행동 체크를 수정할 수 있다"
  on public.behavior_checks for update to authenticated
  using (
    (select public.has_health_consent())
    and exists (
      select 1 from public.daily_logs d
      where d.id = daily_log_id and d.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.daily_logs d
      where d.id = daily_log_id and d.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.behavior_goals bg
      join public.goals g on g.id = bg.goal_id
      where bg.id = behavior_goal_id and g.user_id = (select auth.uid())
    )
  );

create policy "본인만 행동 체크를 삭제할 수 있다"
  on public.behavior_checks for delete to authenticated
  using (
    exists (
      select 1 from public.daily_logs d
      where d.id = daily_log_id and d.user_id = (select auth.uid())
    )
  );

-- 콘텐츠: 공개된 것은 로그인한 누구나, 코치는 전부 보고 관리
create policy "공개 식재료는 누구나, 코치는 전부 볼 수 있다"
  on public.ingredients for select to authenticated
  using (is_published or (select public.is_coach()));
create policy "코치만 식재료를 추가할 수 있다"
  on public.ingredients for insert to authenticated
  with check ((select public.is_coach()));
create policy "코치만 식재료를 수정할 수 있다"
  on public.ingredients for update to authenticated
  using ((select public.is_coach())) with check ((select public.is_coach()));
create policy "코치만 식재료를 삭제할 수 있다"
  on public.ingredients for delete to authenticated
  using ((select public.is_coach()));

create policy "공개 레시피는 누구나, 코치는 전부 볼 수 있다"
  on public.recipes for select to authenticated
  using (is_published or (select public.is_coach()));
create policy "코치만 레시피를 추가할 수 있다"
  on public.recipes for insert to authenticated
  with check ((select public.is_coach()));
create policy "코치만 레시피를 수정할 수 있다"
  on public.recipes for update to authenticated
  using ((select public.is_coach())) with check ((select public.is_coach()));
create policy "코치만 레시피를 삭제할 수 있다"
  on public.recipes for delete to authenticated
  using ((select public.is_coach()));

create policy "공개된 레시피·식재료 연결은 누구나, 코치는 전부 볼 수 있다"
  on public.recipe_ingredients for select to authenticated
  using (
    (select public.is_coach())
    or (
      exists (select 1 from public.recipes r where r.id = recipe_id and r.is_published)
      and exists (select 1 from public.ingredients i where i.id = ingredient_id and i.is_published)
    )
  );
create policy "코치만 레시피·식재료 연결을 추가할 수 있다"
  on public.recipe_ingredients for insert to authenticated
  with check ((select public.is_coach()));
create policy "코치만 레시피·식재료 연결을 수정할 수 있다"
  on public.recipe_ingredients for update to authenticated
  using ((select public.is_coach())) with check ((select public.is_coach()));
create policy "코치만 레시피·식재료 연결을 삭제할 수 있다"
  on public.recipe_ingredients for delete to authenticated
  using ((select public.is_coach()));

create policy "공개 글은 누구나, 코치는 전부 볼 수 있다"
  on public.articles for select to authenticated
  using (is_published or (select public.is_coach()));
create policy "코치만 글을 추가할 수 있다"
  on public.articles for insert to authenticated
  with check ((select public.is_coach()));
create policy "코치만 글을 수정할 수 있다"
  on public.articles for update to authenticated
  using ((select public.is_coach())) with check ((select public.is_coach()));
create policy "코치만 글을 삭제할 수 있다"
  on public.articles for delete to authenticated
  using ((select public.is_coach()));

-------------------------------------------------------------------------------
-- Storage: 식사 사진 비공개 버킷
-------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meal-photos', 'meal-photos', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- 경로 첫 폴더가 본인 user_id 인 파일만 다룰 수 있다
create policy "본인 식사 사진 또는 코치는 볼 수 있다"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'meal-photos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.is_coach())
    )
  );

create policy "동의한 본인만 식사 사진을 올릴 수 있다"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.has_health_consent())
  );

create policy "본인만 식사 사진을 바꿀 수 있다"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "본인만 식사 사진을 지울 수 있다"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
