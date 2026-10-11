"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-redirect";
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from "@/lib/validations/auth";
import type { ActionResult } from "@/types";

export async function login(input: LoginInput, next?: string): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "입력한 내용을 다시 확인해 주세요." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { ok: false, message: "메일함에서 가입 확인 링크를 먼저 눌러 주세요." };
    }
    return { ok: false, message: "이메일이나 비밀번호가 맞지 않아요." };
  }
  redirect(safeNextPath(next));
}

export async function signup(
  input: SignupInput,
): Promise<ActionResult<{ needsEmailConfirm: boolean }>> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "입력한 내용을 다시 확인해 주세요." };

  const supabase = await createClient();
  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${origin}/auth/confirm?next=/onboarding/consent`,
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { ok: false, message: "이미 가입된 이메일이에요. 로그인해 주세요." };
    }
    if (error.code === "weak_password") {
      return { ok: false, message: "조금 더 복잡한 비밀번호로 정해 주세요." };
    }
    return { ok: false, message: "가입 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요." };
  }

  // 이메일 확인을 끈 프로젝트에서는 바로 세션이 생긴다
  if (data.session) redirect("/onboarding/consent");
  return { ok: true, data: { needsEmailConfirm: true } };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function getOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
