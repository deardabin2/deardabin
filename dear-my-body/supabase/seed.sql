-- 샘플 콘텐츠: 식재료 5개, 레시피 3개, 글 3개
-- 제목과 구조만 채운 샘플입니다. 본문은 모두 영양사 검수 후 교체해 주세요.
-- 실행: Supabase 대시보드 > SQL Editor 에 붙여넣고 Run (여러 번 실행하면 중복으로 들어갑니다)

with ing as (
  insert into public.ingredients (name, category, tags, summary, benefits, how_to_use, caution, is_published)
  values
    ('두부', '단백질', array['콩', '식물성 단백질'],
      '[영양사 검수 필요] 샘플 텍스트', '[영양사 검수 필요] 샘플 텍스트', '[영양사 검수 필요] 샘플 텍스트', '[영양사 검수 필요] 샘플 텍스트', true),
    ('귀리', '곡류', array['통곡물', '아침'],
      '[영양사 검수 필요] 샘플 텍스트', '[영양사 검수 필요] 샘플 텍스트', '[영양사 검수 필요] 샘플 텍스트', '[영양사 검수 필요] 샘플 텍스트', true),
    ('브로콜리', '채소', array['초록 채소'],
      '[영양사 검수 필요] 샘플 텍스트', '[영양사 검수 필요] 샘플 텍스트', '[영양사 검수 필요] 샘플 텍스트', '[영양사 검수 필요] 샘플 텍스트', true),
    ('고등어', '생선', array['등푸른 생선', '동물성 단백질'],
      '[영양사 검수 필요] 샘플 텍스트', '[영양사 검수 필요] 샘플 텍스트', '[영양사 검수 필요] 샘플 텍스트', '[영양사 검수 필요] 샘플 텍스트', true),
    ('그릭요거트', '유제품', array['아침', '간식'],
      '[영양사 검수 필요] 샘플 텍스트', '[영양사 검수 필요] 샘플 텍스트', '[영양사 검수 필요] 샘플 텍스트', '[영양사 검수 필요] 샘플 텍스트', true)
  returning id, name
),
rec as (
  insert into public.recipes (title, summary, servings, cook_minutes, ingredients, steps, tags, nutrition_note, is_published)
  values
    ('두부 브로콜리 볶음', '[영양사 검수 필요] 샘플 텍스트', 2, 15,
      '[{"name":"두부","amount":300,"unit":"g"},{"name":"브로콜리","amount":1,"unit":"송이"},{"name":"간장","amount":1,"unit":"큰술"}]',
      '[{"order":1,"text":"[영양사 검수 필요] 샘플 단계"},{"order":2,"text":"[영양사 검수 필요] 샘플 단계"},{"order":3,"text":"[영양사 검수 필요] 샘플 단계"}]',
      array['저녁', '간단'], '[영양사 검수 필요] 샘플 텍스트', true),
    ('귀리 요거트 볼', '[영양사 검수 필요] 샘플 텍스트', 1, 5,
      '[{"name":"그릭요거트","amount":150,"unit":"g"},{"name":"귀리","amount":30,"unit":"g"}]',
      '[{"order":1,"text":"[영양사 검수 필요] 샘플 단계"},{"order":2,"text":"[영양사 검수 필요] 샘플 단계"}]',
      array['아침', '간단'], '[영양사 검수 필요] 샘플 텍스트', true),
    ('고등어 구이 한 접시', '[영양사 검수 필요] 샘플 텍스트', 2, 25,
      '[{"name":"고등어","amount":1,"unit":"마리"},{"name":"브로콜리","amount":0.5,"unit":"송이"}]',
      '[{"order":1,"text":"[영양사 검수 필요] 샘플 단계"},{"order":2,"text":"[영양사 검수 필요] 샘플 단계"},{"order":3,"text":"[영양사 검수 필요] 샘플 단계"}]',
      array['저녁'], '[영양사 검수 필요] 샘플 텍스트', true)
  returning id, title
)
insert into public.recipe_ingredients (recipe_id, ingredient_id)
select rec.id, ing.id
from rec
join ing on (rec.title, ing.name) in (
  ('두부 브로콜리 볶음', '두부'), ('두부 브로콜리 볶음', '브로콜리'),
  ('귀리 요거트 볼', '귀리'), ('귀리 요거트 볼', '그릭요거트'),
  ('고등어 구이 한 접시', '고등어'), ('고등어 구이 한 접시', '브로콜리')
);

insert into public.articles (title, category, body, is_published, sort_order)
values
  ('기록을 시작하는 법', '시작하기', E'## [영양사 검수 필요]\n\n샘플 텍스트', true, 1),
  ('체중이 매일 달라지는 이유', '체중 이해하기', E'## [영양사 검수 필요]\n\n샘플 텍스트', true, 1),
  ('한 끼 구성의 기초', '식사 기초', E'## [영양사 검수 필요]\n\n샘플 텍스트', true, 1);
