"use client";

import { useId, useState } from "react";
import { Markdown } from "@/components/features/markdown";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** 마크다운 입력 + 미리보기 탭 */
export function MarkdownField({
  label,
  value,
  onChange,
  error,
  rows = 8,
  hint = "## 제목, **굵게**, - 목록, [링크](주소) 를 쓸 수 있어요.",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  rows?: number;
  hint?: string;
}) {
  const id = useId();
  const [mode, setMode] = useState<"write" | "preview">("write");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <div role="tablist" aria-label={`${label} 보기 방식`} className="flex rounded-lg bg-secondary p-0.5 text-xs">
          {(
            [
              ["write", "작성"],
              ["preview", "미리보기"],
            ] as const
          ).map(([key, text]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={mode === key}
              onClick={() => setMode(key)}
              className={cn(
                "min-h-11 rounded-md px-3",
                mode === key ? "bg-card font-semibold shadow-xs" : "text-muted-foreground",
              )}
            >
              {text}
            </button>
          ))}
        </div>
      </div>
      {mode === "write" ? (
        <Textarea
          id={id}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          className="min-h-40 font-mono text-sm"
        />
      ) : (
        <div className="min-h-40 rounded-lg border bg-background p-3">
          {value.trim() ? <Markdown>{value}</Markdown> : <p className="text-sm text-muted-foreground">미리 볼 내용이 없어요.</p>}
        </div>
      )}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
