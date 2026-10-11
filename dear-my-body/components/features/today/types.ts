import type { MealType } from "@/lib/validations/daily-log";

export type MealState = {
  description: string;
  eatenAt: string | null;
  photoPath: string | null;
  /** 서명된 URL 또는 방금 올린 사진의 미리보기 URL */
  photoUrl: string | null;
};

export type LogFields = {
  weight: number | null;
  water_ml: number | null;
  sleep_hours: number | null;
  steps: number | null;
  exercise_note: string | null;
  hunger: number | null;
  energy: number | null;
  mood: number | null;
  digestion: number | null;
  note: string | null;
};

export type BehaviorGoalItem = {
  id: string;
  title: string;
  kind: "check" | "number";
  targetValue: number | null;
  unit: string | null;
};

export type TodayData = {
  userId: string;
  logDate: string;
  today: string;
  log: LogFields;
  meals: Record<MealType, MealState>;
  behaviorGoals: BehaviorGoalItem[];
  checks: Record<string, number>;
  hasActiveGoal: boolean;
};

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
};
