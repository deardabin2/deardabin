import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HEALTH_CONSENT_VERSION } from "@/lib/validations/consent";

/** 로그인한 사용자 id. 없으면 로그인 화면으로 보낸다. */
export const requireUserId = cache(async (): Promise<string> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  return userId;
});

export const getProfile = cache(async () => {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error || !profile) throw new Error("프로필을 불러오지 못했어요.");
  return profile;
});

export function hasValidConsent(profile: {
  sensitive_consent_at: string | null;
  sensitive_consent_version: string | null;
}) {
  return (
    profile.sensitive_consent_at !== null &&
    profile.sensitive_consent_version === HEALTH_CONSENT_VERSION
  );
}

/** 기록 기능 화면에서 사용. 동의 전이면 동의 화면으로 보낸다. */
export async function requireConsentedProfile() {
  const profile = await getProfile();
  if (!hasValidConsent(profile)) redirect("/onboarding/consent");
  return profile;
}
