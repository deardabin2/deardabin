"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { giveHealthConsent } from "@/app/onboarding/actions";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function ConsentForm() {
  const [agreed, setAgreed] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await giveHealthConsent({ agreed });
      if (result && !result.ok) setMessage(result.message);
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex min-h-11 items-start gap-3 rounded-xl border bg-card p-4">
        <Checkbox
          id="consent"
          checked={agreed}
          onCheckedChange={(v) => {
            setAgreed(v === true);
            setDeclined(false);
          }}
          className="mt-0.5"
        />
        <Label htmlFor="consent" className="text-base leading-snug">
          (필수) 위 건강정보 수집·이용에 동의합니다.
        </Label>
      </div>

      {message ? (
        <p role="status" className="rounded-lg bg-secondary px-3 py-2 text-sm">
          {message}
        </p>
      ) : null}

      <Button size="lg" onClick={submit} disabled={!agreed || pending}>
        {pending ? "저장하는 중…" : "동의하고 시작하기"}
      </Button>

      {declined ? (
        <div role="status" className="flex flex-col gap-3 rounded-xl bg-secondary p-4 text-sm">
          <p>
            괜찮아요. 동의하지 않으면 기록 기능은 쓸 수 없지만, 마음이 바뀌면 언제든 이 화면에서
            동의할 수 있어요.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/library">라이브러리 둘러보기</Link>
          </Button>
          <form action={signOut}>
            <Button type="submit" variant="ghost" className="w-full">
              로그아웃
            </Button>
          </form>
        </div>
      ) : (
        <Button variant="ghost" onClick={() => setDeclined(true)}>
          지금은 동의하지 않을래요
        </Button>
      )}
    </div>
  );
}
