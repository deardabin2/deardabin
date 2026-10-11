"use client";

import { Button } from "@/components/ui/button";

export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="text-base font-medium">잠깐 문제가 생겼어요</p>
      <p className="text-sm text-muted-foreground">네트워크를 확인하고 다시 시도해 주세요.</p>
      <Button onClick={reset}>다시 시도</Button>
    </main>
  );
}
