import { z } from "zod";
import { optionalNumber } from "./common";

const MAX_MARKDOWN = 20000;

/** "콩, 식물성 단백질 ,아침" → ["콩", "식물성 단백질", "아침"] (중복·빈칸 제거) */
export function parseTags(input: string): string[] {
  return [...new Set(input.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean))];
}

const tagsSchema = z
  .string()
  .transform(parseTags)
  .pipe(
    z
      .array(z.string().max(20, "태그는 20자까지 쓸 수 있어요."))
      .max(10, "태그는 10개까지 달 수 있어요."),
  );

const markdown = z.string().max(MAX_MARKDOWN, "글이 너무 길어요.");
const imagePath = z
  .string()
  .regex(/^(ingredients|recipes|articles)\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/)
  .nullable();

export const ingredientSchema = z.object({
  name: z.string().trim().min(1, "이름을 적어 주세요.").max(40),
  category: z.string().trim().min(1, "분류를 적어 주세요.").max(20),
  tags: tagsSchema,
  summary: z.string().trim().max(200, "한 줄 소개는 200자까지 쓸 수 있어요."),
  benefits: markdown,
  howToUse: markdown,
  caution: markdown,
  imagePath,
  isPublished: z.boolean(),
});

export const recipeIngredientSchema = z.object({
  name: z.string().trim().min(1, "재료 이름을 적어 주세요.").max(40),
  // "약간"처럼 양을 숫자로 적기 어려운 재료는 비워 둔다
  amount: optionalNumber(z.number("숫자로 적어 주세요.").positive("0보다 큰 숫자로 적어 주세요.").max(100000)),
  unit: z.string().trim().max(10),
});

export const recipeSchema = z.object({
  title: z.string().trim().min(1, "제목을 적어 주세요.").max(60),
  summary: z.string().trim().max(200, "한 줄 소개는 200자까지 쓸 수 있어요."),
  servings: z.coerce.number<unknown>("숫자로 적어 주세요.").int().min(1, "1인분 이상으로 적어 주세요.").max(20),
  cookMinutes: optionalNumber(z.number("숫자로 적어 주세요.").int().min(0).max(600)),
  ingredients: z.array(recipeIngredientSchema).max(50),
  steps: z
    .array(z.object({ text: z.string().trim().min(1, "내용을 적어 주세요.").max(1000) }))
    .max(30),
  tags: tagsSchema,
  nutritionNote: markdown,
  imagePath,
  isPublished: z.boolean(),
  ingredientIds: z.array(z.uuid()).max(50),
});

export const articleSchema = z.object({
  title: z.string().trim().min(1, "제목을 적어 주세요.").max(80),
  category: z.string().trim().min(1, "분류를 적어 주세요.").max(20),
  body: markdown,
  sortOrder: z.coerce.number<unknown>("숫자로 적어 주세요.").int().min(0).max(9999),
  isPublished: z.boolean(),
});

export const coachCommentSchema = z.object({
  dailyLogId: z.uuid(),
  body: z.string().trim().min(1, "코멘트를 적어 주세요.").max(1000, "1000자까지 쓸 수 있어요."),
});

export type IngredientFormInput = z.input<typeof ingredientSchema>;
export type IngredientFormOutput = z.output<typeof ingredientSchema>;
export type RecipeFormInput = z.input<typeof recipeSchema>;
export type RecipeFormOutput = z.output<typeof recipeSchema>;
export type ArticleFormInput = z.input<typeof articleSchema>;
export type ArticleFormOutput = z.output<typeof articleSchema>;
