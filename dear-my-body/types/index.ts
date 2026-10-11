import type { Tables } from "./database.types";

export type Profile = Tables<"profiles">;
export type Goal = Tables<"goals">;
export type BehaviorGoal = Tables<"behavior_goals">;
export type DailyLog = Tables<"daily_logs">;
export type Meal = Tables<"meals">;
export type BehaviorCheck = Tables<"behavior_checks">;

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string };
