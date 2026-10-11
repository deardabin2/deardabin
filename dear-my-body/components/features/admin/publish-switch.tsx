"use client";

import { cn } from "@/lib/utils";

export function PublishSwitch({
  checked,
  onChange,
  disabled,
  label = "고객에게 공개",
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 items-center gap-3 rounded-lg text-sm disabled:opacity-50"
    >
      <span
        aria-hidden
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-input",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-card shadow transition-transform",
            checked && "translate-x-5",
          )}
        />
      </span>
      <span>
        {label} <span className="text-muted-foreground">({checked ? "공개" : "비공개"})</span>
      </span>
    </button>
  );
}
