"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCoach } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { coachCommentSchema } from "@/lib/validations/content";
import type { ActionResult } from "@/types";

const FAILED = "저장하지 못했어요. 잠시 후 다시 시도해 주세요.";

export async function addCoachComment(input: { dailyLogId: string; body: string }): Promise<ActionResult> {
  const parsed = coachCommentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? FAILED };
  const coach = await requireCoach();
  const supabase = await createClient();
  const { error } = await supabase
    .from("coach_comments")
    .insert({ daily_log_id: parsed.data.dailyLogId, coach_id: coach.id, body: parsed.data.body });
  if (error) return { ok: false, message: FAILED };
  revalidatePath("/admin/clients", "layout");
  return { ok: true, data: undefined };
}

export async function updateCoachComment(input: { id: string; body: string }): Promise<ActionResult> {
  const parsed = z
    .object({ id: z.uuid(), body: coachCommentSchema.shape.body })
    .safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? FAILED };
  await requireCoach();
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("coach_comments")
    .update({ body: parsed.data.body }, { count: "exact" })
    .eq("id", parsed.data.id);
  if (error || count === 0) return { ok: false, message: "내가 쓴 코멘트만 고칠 수 있어요." };
  revalidatePath("/admin/clients", "layout");
  return { ok: true, data: undefined };
}

export async function deleteCoachComment(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return { ok: false, message: FAILED };
  await requireCoach();
  const supabase = await createClient();
  const { error, count } = await supabase.from("coach_comments").delete({ count: "exact" }).eq("id", id);
  if (error || count === 0) return { ok: false, message: "내가 쓴 코멘트만 지울 수 있어요." };
  revalidatePath("/admin/clients", "layout");
  return { ok: true, data: undefined };
}
