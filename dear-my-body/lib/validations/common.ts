import { z } from "zod";
import { isDateString } from "@/lib/date";

export const dateStringSchema = z
  .string()
  .refine(isDateString, "날짜 형식이 올바르지 않아요.");

/** 폼에서 빈칸("")·NaN 은 null 로, 나머지는 숫자로 바꾼다 */
export function optionalNumber(schema: z.ZodNumber) {
  return z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return null;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isNaN(n) ? value : n;
  }, schema.nullable());
}

export const weightSchema = z
  .number("숫자로 입력해 주세요.")
  .min(20, "체중을 다시 확인해 주세요.")
  .max(300, "체중을 다시 확인해 주세요.");
