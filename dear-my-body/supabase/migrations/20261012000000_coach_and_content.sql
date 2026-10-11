-- Phase 3: 코치 코멘트, 콘텐츠 이미지 버킷

-------------------------------------------------------------------------------
-- coach_comments
-------------------------------------------------------------------------------
create table public.coach_comments (
  id uuid primary key default gen_random_uuid(),
  daily_log_id uuid not null references public.daily_logs (id) on delete cascade,
  -- 코치 계정이 지워져도 고객이 받은 코멘트는 남긴다
  coach_id uuid references public.profiles (id) on delete set null,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index coach_comments_daily_log_id_idx on public.coach_comments (daily_log_id);
create index coach_comments_coach_id_idx on public.coach_comments (coach_id);

create trigger coach_comments_set_updated_at
  before update on public.coach_comments
  for each row execute function public.set_updated_at();

revoke all on public.coach_comments from anon, authenticated;
grant select, insert, update, delete on public.coach_comments to authenticated;

alter table public.coach_comments enable row level security;

create policy "코치 또는 기록의 주인은 코멘트를 볼 수 있다"
  on public.coach_comments for select to authenticated
  using (
    (select public.is_coach())
    or exists (
      select 1 from public.daily_logs d
      where d.id = daily_log_id and d.user_id = (select auth.uid())
    )
  );

create policy "코치만 자기 이름으로 코멘트를 쓸 수 있다"
  on public.coach_comments for insert to authenticated
  with check ((select public.is_coach()) and coach_id = (select auth.uid()));

create policy "코치는 자기 코멘트만 고칠 수 있다"
  on public.coach_comments for update to authenticated
  using ((select public.is_coach()) and coach_id = (select auth.uid()))
  with check ((select public.is_coach()) and coach_id = (select auth.uid()));

create policy "코치는 자기 코멘트만 지울 수 있다"
  on public.coach_comments for delete to authenticated
  using ((select public.is_coach()) and coach_id = (select auth.uid()));

-------------------------------------------------------------------------------
-- 고객 화면에 코멘트 작성자(코치) 이름을 보여 주기 위해 코치 프로필은 누구나 볼 수 있게 한다
-------------------------------------------------------------------------------
create policy "로그인한 사용자는 코치 프로필을 볼 수 있다"
  on public.profiles for select to authenticated
  using (role = 'coach');

-------------------------------------------------------------------------------
-- 콘텐츠 이미지: 공개 버킷 (읽기는 공개 URL, 쓰기는 코치만)
-------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('content-images', 'content-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "로그인한 사용자는 콘텐츠 이미지 목록을 볼 수 있다"
  on storage.objects for select to authenticated
  using (bucket_id = 'content-images');

create policy "코치만 콘텐츠 이미지를 올릴 수 있다"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'content-images' and (select public.is_coach()));

create policy "코치만 콘텐츠 이미지를 바꿀 수 있다"
  on storage.objects for update to authenticated
  using (bucket_id = 'content-images' and (select public.is_coach()))
  with check (bucket_id = 'content-images' and (select public.is_coach()));

create policy "코치만 콘텐츠 이미지를 지울 수 있다"
  on storage.objects for delete to authenticated
  using (bucket_id = 'content-images' and (select public.is_coach()));
