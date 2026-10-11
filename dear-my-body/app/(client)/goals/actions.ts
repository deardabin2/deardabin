"use server";

import { revalidatePath } from "next/cache";
import { requireConsentedProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { goalSchema, type GoalFormInput } from "@/lib/validations/goal";
import type { ActionResult } from "@/types";

export async function saveGoal(input: GoalFormInput): Promise<ActionResult> {
  const parsed = goalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "입력한 내용을 다시 확인해 주세요." };
  const value = parsed.data;

  const profile = await requireConsentedProfile();
  const supabase = await createClient();

  const goalFields = {
    start_date: value.startDate,
    end_date: value.endDate,
    start_weight: value.startWeight,
    target_weight: value.targetWeight,
    motivation: value.motivation,
  };

  const { data: active } = await supabase
    .from("goals")
    .select("id")
    .eq("user_id", profile.id)
    .eq("status", "active")
    .maybeSingle();

  let goalId: string;
  if (active) {
    const { error } = await supabase.from("goals").update(goalFields).eq("id", active.id);
    if (error) return failed();
    goalId = active.id;
  } else {
    const { data, error } = await supabase
      .from("goals")
      .insert({ ...goalFields, user_id: profile.id })
      .select("id")
      .single();
    if (error || !data) return failed();
    goalId = data.id;
  }

  const { data: existing, error: existingError } = await supabase
    .from("behavior_goals")
    .select("id, behavior_checks(count)")
    .eq("goal_id", goalId)
    .is("archived_at", null);
  if (existingError) return failed();

  const keepIds = new Set(value.behaviorGoals.flatMap((b) => (b.id ? [b.id] : [])));
  const removed = (existing ?? []).filter((b) => !keepIds.has(b.id));

  // 체크 기록이 있는 행동 목표는 지난 기록을 지키려고 보관만 하고, 없으면 지운다
  const toArchive = removed.filter((b) => (b.behavior_checks[0]?.count ?? 0) > 0).map((b) => b.id);
  const toDelete = removed.filter((b) => (b.behavior_checks[0]?.count ?? 0) === 0).map((b) => b.id);

  if (toArchive.length) {
    const { error } = await supabase
      .from("behavior_goals")
      .update({ archived_at: new Date().toISOString() })
      .in("id", toArchive);
    if (error) return failed();
  }
  if (toDelete.length) {
    const { error } = await supabase.from("behavior_goals").delete().in("id", toDelete);
    if (error) return failed();
  }

  const existingIds = new Set((existing ?? []).map((b) => b.id));
  for (const [index, b] of value.behaviorGoals.entries()) {
    const fields = {
      title: b.title,
      kind: b.kind,
      target_value: b.targetValue,
      unit: b.unit,
      sort_order: index,
    };
    const { error } =
      b.id && existingIds.has(b.id)
        ? await supabase.from("behavior_goals").update(fields).eq("id", b.id).eq("goal_id", goalId)
        : await supabase.from("behavior_goals").insert({ ...fields, goal_id: goalId });
    if (error) return failed();
  }

  revalidatePath("/goals");
  revalidatePath("/today");
  return { ok: true, data: undefined };
}

export async function finishGoal(): Promise<ActionResult> {
  const profile = await requireConsentedProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("goals")
    .update({ status: "done" })
    .eq("user_id", profile.id)
    .eq("status", "active");
  if (error) return failed();
  revalidatePath("/goals");
  revalidatePath("/today");
  return { ok: true, data: undefined };
}

function failed(): ActionResult {
  return { ok: false, message: "저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
}
