import { z } from "zod";
import { dateStringSchema, optionalNumber, weightSchema } from "./common";

export const MAX_BEHAVIOR_GOALS = 5;

export const behaviorGoalSchema = z
  .object({
    id: z.uuid().optional(),
    title: z
      .string()
      .trim()
      .min(1, "행동 목표를 적어 주세요.")
      .max(40, "40자까지 쓸 수 있어요."),
    kind: z.enum(["check", "number"]),
    targetValue: optionalNumber(
      z.number("숫자로 입력해 주세요.").positive("0보다 큰 숫자로 적어 주세요.").max(100000),
    ),
    unit: z
      .string()
      .trim()
      .max(10, "단위는 10자까지 쓸 수 있어요.")
      .transform((v) => (v === "" ? null : v))
      .nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "number" && value.targetValue == null) {
      ctx.addIssue({
        code: "custom",
        path: ["targetValue"],
        message: "숫자형 목표는 하루 목표치를 적어 주세요.",
      });
    }
  })
  .transform((value) =>
    value.kind === "check" ? { ...value, targetValue: null, unit: null } : value,
  );

export const goalSchema = z
  .object({
    startDate: dateStringSchema,
    endDate: dateStringSchema,
    startWeight: optionalNumber(weightSchema),
    targetWeight: optionalNumber(weightSchema),
    motivation: z.string().trim().max(100, "동기는 100자까지 쓸 수 있어요."),
    behaviorGoals: z
      .array(behaviorGoalSchema)
      .max(MAX_BEHAVIOR_GOALS, `행동 목표는 ${MAX_BEHAVIOR_GOALS}개까지 정할 수 있어요.`),
  })
  .refine((v) => v.endDate >= v.startDate, {
    path: ["endDate"],
    message: "마치는 날은 시작하는 날 이후로 골라 주세요.",
  });

export type GoalFormInput = z.input<typeof goalSchema>;
export type GoalFormOutput = z.output<typeof goalSchema>;
