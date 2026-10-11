"use client";

import { useState, useTransition } from "react";
import { deleteAccount, updateDisplayName, withdrawHealthConsent } from "@/app/(client)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DELETE_CONFIRM_WORD } from "@/lib/validations/account";

function Status({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="status" className="rounded-lg bg-secondary px-3 py-2 text-sm">
      {message}
    </p>
  );
}

export function DisplayNameForm({ initial }: { initial: string }) {
  const [name, setName] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = await updateDisplayName({ displayName: name });
          setMessage(result.ok ? "이름을 바꿨어요." : result.message);
        });
      }}
    >
      <Label htmlFor="displayName">이름(닉네임)</Label>
      <div className="flex gap-2">
        <Input id="displayName" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} autoComplete="nickname" />
        <Button type="submit" variant="outline" disabled={pending || name.trim() === initial}>
          저장
        </Button>
      </div>
      <Status message={message} />
    </form>
  );
}

export function WithdrawConsentButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => {
          if (
            !window.confirm(
              "동의를 철회하면 지금까지의 목표·일일 기록·식사 사진이 모두 지워지고 되돌릴 수 없어요. 계속할까요?\n(먼저 CSV로 내보내 두는 걸 권해요)",
            )
          )
            return;
          setMessage(null);
          startTransition(async () => {
            const result = await withdrawHealthConsent();
            if (result && !result.ok) setMessage(result.message);
          });
        }}
      >
        {pending ? "처리하는 중…" : "동의 철회하고 건강 기록 지우기"}
      </Button>
      <Status message={message} />
    </div>
  );
}

export function DeleteAccountForm() {
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = await deleteAccount({ confirm });
          if (result && !result.ok) setMessage(result.message);
        });
      }}
    >
      <Label htmlFor="deleteConfirm">
        확인을 위해 &apos;{DELETE_CONFIRM_WORD}&apos;라고 적어 주세요
      </Label>
      <Input id="deleteConfirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
      <Button type="submit" variant="outline" disabled={pending || confirm.trim() !== DELETE_CONFIRM_WORD}>
        {pending ? "지우는 중…" : "계정과 모든 데이터 삭제"}
      </Button>
      <Status message={message} />
    </form>
  );
}
