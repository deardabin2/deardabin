# 디어마이바디 (Dear My Body)

다이어트 코칭 고객이 매일 식단과 습관을 기록하고 변화를 확인하는 모바일 우선 웹앱입니다.
코치(영양사)는 고객 기록을 조회하고 콘텐츠를 관리합니다.

- Next.js 16 (App Router) + TypeScript strict
- Supabase (Postgres, Auth, Storage, RLS)
- Tailwind CSS v4 + shadcn/ui 스타일 컴포넌트 (Radix UI)
- react-hook-form + zod, date-fns (Asia/Seoul 기준)
- Vitest

> 이 저장소 루트에는 기존 제휴 문의 페이지(`index.html`)가 있고, 앱은 `dear-my-body/` 폴더에 있습니다.
> 아래 명령은 모두 `dear-my-body/` 폴더에서 실행합니다.

---

## 1. 설치

Node.js 20.9 이상(권장 22 이상)이 필요합니다.

```bash
cd dear-my-body
npm install
cp .env.example .env.local   # 값 채우기 (3번 참고)
npm run dev                  # http://localhost:3000
```

## 2. Supabase 설정

### 2-1. 프로젝트 만들기
1. https://supabase.com 에서 새 프로젝트를 만듭니다. (리전은 Northeast Asia (Seoul) 권장)

### 2-2. 스키마(마이그레이션) 적용 — 둘 중 하나

**방법 A. 대시보드에서 (가장 쉬움)**
1. 대시보드 > SQL Editor > New query
2. `supabase/migrations/20261011000000_init_schema.sql` 내용을 통째로 붙여넣고 Run

**방법 B. CLI로**
```bash
npx supabase login
npx supabase link --project-ref <프로젝트 ref>
npm run db:push
```

### 2-3. Auth 설정
대시보드 > Authentication 에서:

1. **URL Configuration**
   - Site URL: 배포 주소 (예: `https://dear-my-body.vercel.app`). 로컬에서만 쓸 땐 `http://localhost:3000`
   - Redirect URLs 에 추가: `http://localhost:3000/**`, `https://<배포 주소>/**`
2. **Sign In / Providers > Email**: Email 로그인이 켜져 있는지 확인합니다.
   가입 확인 메일(Confirm email)은 켜 두는 것을 권장합니다.
3. **Emails > Templates > Confirm signup** (권장)
   메일을 휴대폰에서 열고 PC 브라우저로 가입한 경우에도 동작하도록 링크를 아래처럼 바꿉니다.
   ```html
   <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/onboarding/consent">가입 확인하기</a></p>
   ```
   바꾸지 않아도 같은 브라우저에서 링크를 열면 동작합니다.

> 기본 Supabase 메일 발송은 시간당 발송 수 제한이 있습니다. 실제 고객을 받기 전에는
> Authentication > Emails > SMTP Settings 에서 자체 SMTP를 연결하세요.

### 2-4. Storage
마이그레이션이 `meal-photos` **비공개** 버킷과 접근 정책을 만듭니다. 따로 할 일은 없습니다.
(대시보드 > Storage 에 `meal-photos` 가 Private 으로 보이면 정상)

## 3. 환경변수

`.env.local` (로컬) 과 Vercel 프로젝트 설정 (배포) 에 넣습니다.

| 이름 | 값 | 어디서 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | 대시보드 > Project Settings > API (또는 상단 Connect) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` (예전 프로젝트는 anon public key) | 같은 곳 |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` / 배포 주소 (끝에 `/` 없이) | 직접 입력 |

**service role 키(secret key)는 이 앱에 필요 없습니다. 어디에도 넣지 마세요.**
모든 권한은 로그인한 사용자 세션 + RLS 정책으로 처리합니다.

## 4. 코치 계정 지정

코치가 될 사람이 먼저 앱에서 회원가입을 한 뒤, SQL Editor 에서 한 줄 실행합니다.

```sql
update public.profiles set role = 'coach' where id = (select id from auth.users where email = 'coach@example.com');
```

고객은 자기 role 을 바꿀 수 없습니다 (DB 컬럼 권한으로 막혀 있음).

## 5. RLS 검증

`supabase/tests/rls_check.sql` 을 SQL Editor 에 붙여넣고 실행하면, 테스트용 사용자 4명을 만들어
"고객 A의 기록을 고객 B가 조회·수정·삭제할 수 없는지" 등을 확인하고 **마지막에 모두 rollback** 합니다.
끝에 `RLS 검증 통과` 가 보이면 정상이고, 문제가 있으면 `RLS 검증 실패: ...` 오류로 멈춥니다.

검증 항목: 다른 고객 기록/식사/행동 체크/목표/사진 조회·수정·삭제 차단, 남의 명의로 기록 생성 차단,
남의 행동 목표 체크 차단, 고객의 role 변경 차단, 미동의 사용자의 기록·사진 업로드 차단,
코치의 전체 조회 허용(수정은 차단), 비로그인(anon) 접근 차단, 고객의 콘텐츠 작성 차단.

## 6. 테스트·검사

```bash
npm test           # Vitest 단위 테스트 (zod 스키마, 날짜·달력, 기록 판정)
npm run typecheck  # 타입 검사
npm run lint
```

## 7. Supabase 타입 다시 만들기

스키마를 바꾼 뒤에는 CLI로 타입을 다시 생성합니다 (`types/database.types.ts`).

```bash
npx supabase link --project-ref <프로젝트 ref>   # 처음 한 번
npm run db:types
```

## 8. 배포 (Vercel)

1. Vercel 에서 이 GitHub 저장소를 Import
2. **Root Directory 를 `dear-my-body` 로 지정** (중요)
3. Framework Preset: Next.js (자동 인식)
4. Environment Variables 에 3번의 세 값을 입력 (`NEXT_PUBLIC_SITE_URL` 은 배포 주소)
5. Deploy → 배포 주소를 Supabase Auth 의 Site URL / Redirect URLs 에 추가

---

## 폴더 구조

```
app/
  (auth)/login, signup        로그인·회원가입 (+ actions.ts)
  (client)/today              오늘 기록 (자동 저장)
  (client)/history            기록 달력
  (client)/goals              목표 설정
  (client)/trends, library    Phase 2·3 에서 구현 (지금은 준비 중 화면)
  auth/confirm                가입 확인 메일 링크 처리
  onboarding/consent          건강정보(민감정보) 별도 동의
components/ui                 버튼·입력 등 기본 컴포넌트 (shadcn/ui 형식)
components/features           화면별 기능 컴포넌트
lib/supabase                  브라우저·서버·proxy 용 Supabase 클라이언트
lib/validations               zod 스키마
supabase/migrations           DB 스키마 + RLS + Storage 정책
supabase/tests/rls_check.sql  RLS 검증 스크립트
types/database.types.ts       Supabase CLI 로 생성한 타입
proxy.ts                      세션 갱신 + 비로그인 접근 시 로그인 화면으로
```

## 데이터 설계 메모

- **체중은 언제나 선택**: `daily_logs.weight`, `goals.start_weight/target_weight` 모두 비워 둘 수 있습니다.
  체중 없이 다른 항목만 남겨도 "기록한 날"로 칩니다 (`lib/records.ts`).
- **동의 강제**: 건강정보 동의(`profiles.sensitive_consent_at`)가 없으면 기록 테이블과 사진 버킷에 쓰기가 RLS 에서 거부됩니다.
  화면에서는 동의 문구 버전(`HEALTH_CONSENT_VERSION`)이 바뀌면 다시 동의 화면으로 보냅니다.
- **행동 목표 보관**: 목표에서 뺀 행동 목표에 체크 기록이 있으면 지우지 않고 `archived_at` 으로 보관해 지난 기록을 지킵니다. 진행 중인 행동 목표는 DB 트리거로도 최대 5개로 제한됩니다.
- **진행 중인 목표는 1개**: `goals` 에 부분 유니크 인덱스.
- **끼니별 1건**: `meals` 는 `(daily_log_id, meal_type)` 유니크, 사진은 끼니당 1장 (바꾸면 예전 파일 삭제).
- **영양 정보 확장**: 칼로리/영양소 계산은 만들지 않았습니다. 나중에 붙일 때는 `meals` 에 컬럼을 추가하거나,
  `meal_nutrition (meal_id 1:1)` 같은 별도 테이블을 두는 방식으로 확장할 수 있습니다.
- **사진 경로**: `meal-photos/{user_id}/{날짜}/{끼니}-{uuid}.jpg`. 첫 폴더가 본인 id 인 파일만 다룰 수 있고, 화면에는 1시간짜리 서명 URL 로만 보여 줍니다.
