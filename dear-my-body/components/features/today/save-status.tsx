import { Check, CloudUpload, RotateCw } from "lucide-react";
import type { SaveStatus } from "./use-autosave";

export function SaveStatusBadge({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  return (
    <div aria-live="polite" className="flex min-h-11 items-center text-xs text-muted-foreground">
      {status === "saving" ? (
        <span className="flex items-center gap-1">
          <CloudUpload className="size-4 animate-pulse" aria-hidden />
          저장 중…
        </span>
      ) : null}
      {status === "saved" ? (
        <span className="flex items-center gap-1 text-primary">
          <Check className="size-4" aria-hidden />
          저장됐어요
        </span>
      ) : null}
      {status === "error" ? (
        <button
          type="button"
          onClick={onRetry}
          className="flex min-h-11 items-center gap-1 rounded-lg px-2 font-medium text-destructive underline-offset-4 hover:underline"
        >
          <RotateCw className="size-4" aria-hidden />
          저장이 안 됐어요 · 다시 시도
        </button>
      ) : null}
      {status === "idle" ? <span>입력하면 자동으로 저장돼요</span> : null}
    </div>
  );
}
