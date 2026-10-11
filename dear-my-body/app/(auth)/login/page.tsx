import type { Metadata } from "next";
import { LoginForm } from "@/components/features/auth/login-form";
import { safeNextPath } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const notice =
    params.error === "confirm"
      ? "확인 링크가 만료됐거나 이미 사용됐어요. 로그인해 보시고, 안 되면 다시 가입해 주세요."
      : params.deleted
        ? "계정과 데이터를 모두 지웠어요. 그동안 함께해 주셔서 고마워요."
        : undefined;
  return <LoginForm next={next} notice={notice} />;
}
