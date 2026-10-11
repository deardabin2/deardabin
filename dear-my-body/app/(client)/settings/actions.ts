"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { removeAllMealPhotos } from "@/lib/meal-photos";
import { createClient } from "@/lib/supabase/server";
import { DELETE_CONFIRM_WORD } from "@/lib/validations/account";
import type { ActionResult } from "@/types";

export async function updateDisplayName(input: { displayName: string }): Promise<ActionResult> {
  const parsed = z
    .object({ displayName: z.string().trim().min(1, "이름을 적어 주세요.").max(30, "이름은 30자까지 쓸 수 있어요.") })
    .safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "이름을 확인해 주세요." };
  const userId = await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ display_name: parsed.data.displayName }).eq("id", userId);
  if (error) return { ok: false, message: "저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

/** 건강정보 동의 철회: 동의서 약속대로 건강 기록(목표·일일 기록·사진)을 지우고 동의를 해제한다. 계정은 남는다 */
export async function withdrawHealthConsent(): Promise<ActionResult> {
  const userId = await requireUserId();
  const supabase = await createClient();
  try {
    await removeAllMealPhotos(supabase, userId);
  } catch {
    return { ok: false, message: "사진을 지우지 못했어요. 잠시 후 다시 시도해 주세요." };
  }
  const { error: logsError } = await supabase.from("daily_logs").delete().eq("user_id", userId);
  const { error: goalsError } = await supabase.from("goals").delete().eq("user_id", userId);
  if (logsError || goalsError) return { ok: false, message: "기록을 지우지 못했어요. 잠시 후 다시 시도해 주세요." };

  const { error } = await supabase
    .from("profiles")
    .update({ sensitive_consent_at: null, sensitive_consent_version: null })
    .eq("id", userId);
  if (error) return { ok: false, message: "동의를 철회하지 못했어요. 잠시 후 다시 시도해 주세요." };

  revalidatePath("/", "layout");
  redirect("/onboarding/consent");
}

export async function deleteAccount(input: { confirm: string }): Promise<ActionResult> {
  if (input.confirm.trim() !== DELETE_CONFIRM_WORD) {
    return { ok: false, message: `확인을 위해 '${DELETE_CONFIRM_WORD}'라고 적어 주세요.` };
  }
  const userId = await requireUserId();
  const supabase = await createClient();
  try {
    await removeAllMealPhotos(supabase, userId);
  } catch {
    return { ok: false, message: "사진을 지우지 못했어요. 잠시 후 다시 시도해 주세요." };
  }
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { ok: false, message: "계정을 지우지 못했어요. 잠시 후 다시 시도해 주세요." };

  await supabase.auth.signOut();
  redirect("/login?deleted=1");
}
