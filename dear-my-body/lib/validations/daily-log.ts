import { z } from "zod";
import { dateStringSchema, weightSchema } from "./common";

const scale = z.number().int().min(1).max(5).nullable();

export const dailyLogPatchSchema = z
  .object({
    weight: weightSchema.nullable(),
    water_ml: z.number().int().min(0).max(10000).nullable(),
    sleep_hours: z.number().min(0).max(24).multipleOf(0.5).nullable(),
    steps: z.number().int().min(0).max(100000).nullable(),
    exercise_note: z.string().max(500, "500자까지 쓸 수 있어요.").nullable(),
    hunger: scale,
    energy: scale,
    mood: scale,
    digestion: scale,
    note: z.string().max(1000, "1000자까지 쓸 수 있어요.").nullable(),
  })
  .partial()
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, "바뀐 내용이 없어요.");

export const saveDailyLogSchema = z.object({
  logDate: dateStringSchema,
  patch: dailyLogPatchSchema,
});

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const saveMealSchema = z.object({
  logDate: dateStringSchema,
  mealType: z.enum(MEAL_TYPES),
  description: z.string().max(500, "500자까지 쓸 수 있어요."),
  eatenAt: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "시간 형식이 올바르지 않아요.")
    .nullable(),
  photoPath: z.string().max(300).nullable(),
});

export const saveBehaviorCheckSchema = z.object({
  logDate: dateStringSchema,
  behaviorGoalId: z.uuid(),
  // null 이면 체크 해제(기록 삭제)
  value: z.number().min(0).max(100000).nullable(),
});

export type DailyLogPatch = z.infer<typeof dailyLogPatchSchema>;
export type SaveMealInput = z.infer<typeof saveMealSchema>;
export type SaveBehaviorCheckInput = z.infer<typeof saveBehaviorCheckSchema>;

/** 사진 경로는 반드시 본인 폴더 아래여야 한다: {userId}/{logDate}/{mealType}-{id}.{ext} */
export function isOwnMealPhotoPath(path: string, userId: string, logDate: string, mealType: MealType) {
  const pattern = new RegExp(
    `^${userId}/${logDate}/${mealType}-[0-9a-f-]{36}\\.(jpg|jpeg|png|webp)$`,
  );
  return pattern.test(path);
}
