"use server";

import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { consentSchema, HEALTH_CONSENT_VERSION } from "@/lib/validations/consent";
import type { ActionResult } from "@/types";

export async function giveHealthConsent(input: { agreed: boolean }): Promise<ActionResult> {
  const parsed = consentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "건강정보 수집·이용에 동의해 주셔야 기록을 시작할 수 있어요." };
  }

  const userId = await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      sensitive_consent_at: new Date().toISOString(),
      sensitive_consent_version: HEALTH_CONSENT_VERSION,
    })
    .eq("id", userId);
  if (error) return { ok: false, message: "저장하지 못했어요. 잠시 후 다시 시도해 주세요." };

  const { count } = await supabase
    .from("goals")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");

  redirect(count ? "/today" : "/goals?welcome=1");
}
