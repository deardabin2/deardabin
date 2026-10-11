"use server";

import { requireConsentedProfile } from "@/lib/auth";
import { todayInSeoul } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import {
  isOwnMealPhotoPath,
  saveBehaviorCheckSchema,
  saveDailyLogSchema,
  saveMealSchema,
  type DailyLogPatch,
  type SaveBehaviorCheckInput,
  type SaveMealInput,
} from "@/lib/validations/daily-log";
import type { ActionResult } from "@/types";

const FAILED = "저장하지 못했어요. 잠시 후 다시 시도해 주세요.";
const MEAL_PHOTO_BUCKET = "meal-photos";

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function ensureDailyLog(supabase: Supabase, userId: string, logDate: string) {
  const { data, error } = await supabase
    .from("daily_logs")
    .upsert({ user_id: userId, log_date: logDate }, { onConflict: "user_id,log_date" })
    .select("id")
    .single();
  if (error || !data) return null;
  return data.id;
}

function isFutureDate(logDate: string) {
  return logDate > todayInSeoul();
}

export async function saveDailyLog(input: {
  logDate: string;
  patch: DailyLogPatch;
}): Promise<ActionResult> {
  const parsed = saveDailyLogSchema.safeParse(input);
  if (!parsed.success || isFutureDate(parsed.data.logDate)) {
    return { ok: false, message: "입력한 값을 다시 확인해 주세요." };
  }
  const profile = await requireConsentedProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("daily_logs")
    .upsert(
      { user_id: profile.id, log_date: parsed.data.logDate, ...parsed.data.patch },
      { onConflict: "user_id,log_date" },
    );
  if (error) return { ok: false, message: FAILED };
  return { ok: true, data: undefined };
}

export async function saveMeal(input: SaveMealInput): Promise<ActionResult> {
  const parsed = saveMealSchema.safeParse(input);
  if (!parsed.success || isFutureDate(parsed.data.logDate)) {
    return { ok: false, message: "입력한 값을 다시 확인해 주세요." };
  }
  const { logDate, mealType, description, eatenAt, photoPath } = parsed.data;
  const profile = await requireConsentedProfile();

  if (photoPath && !isOwnMealPhotoPath(photoPath, profile.id, logDate, mealType)) {
    return { ok: false, message: "사진을 저장하지 못했어요. 다시 올려 주세요." };
  }

  const supabase = await createClient();
  const dailyLogId = await ensureDailyLog(supabase, profile.id, logDate);
  if (!dailyLogId) return { ok: false, message: FAILED };

  const { data: previous } = await supabase
    .from("meals")
    .select("photo_path")
    .eq("daily_log_id", dailyLogId)
    .eq("meal_type", mealType)
    .maybeSingle();

  const { error } = await supabase.from("meals").upsert(
    {
      daily_log_id: dailyLogId,
      meal_type: mealType,
      description,
      eaten_at: eatenAt,
      photo_path: photoPath,
    },
    { onConflict: "daily_log_id,meal_type" },
  );
  if (error) return { ok: false, message: FAILED };

  // 사진을 바꾸거나 지웠다면 예전 파일도 정리한다 (끼니당 1장 유지)
  if (previous?.photo_path && previous.photo_path !== photoPath) {
    await supabase.storage.from(MEAL_PHOTO_BUCKET).remove([previous.photo_path]);
  }
  return { ok: true, data: undefined };
}

export async function saveBehaviorCheck(input: SaveBehaviorCheckInput): Promise<ActionResult> {
  const parsed = saveBehaviorCheckSchema.safeParse(input);
  if (!parsed.success || isFutureDate(parsed.data.logDate)) {
    return { ok: false, message: "입력한 값을 다시 확인해 주세요." };
  }
  const { logDate, behaviorGoalId, value } = parsed.data;
  const profile = await requireConsentedProfile();
  const supabase = await createClient();

  const dailyLogId = await ensureDailyLog(supabase, profile.id, logDate);
  if (!dailyLogId) return { ok: false, message: FAILED };

  const { error } =
    value === null || value === 0
      ? await supabase
          .from("behavior_checks")
          .delete()
          .eq("daily_log_id", dailyLogId)
          .eq("behavior_goal_id", behaviorGoalId)
      : await supabase
          .from("behavior_checks")
          .upsert(
            { daily_log_id: dailyLogId, behavior_goal_id: behaviorGoalId, value },
            { onConflict: "daily_log_id,behavior_goal_id" },
          );
  if (error) return { ok: false, message: FAILED };
  return { ok: true, data: undefined };
}
