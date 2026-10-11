"use client";

import { cn } from "@/lib/utils";

export function ScaleSelector({
  label,
  low,
  high,
  value,
  onChange,
}: {
  label: string;
  low: string;
  high: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span id={`scale-${label}`} className="text-sm font-medium">
          {label}
        </span>
        <span className="text-xs text-muted-foreground">
          1 {low} · 5 {high}
        </span>
      </div>
      <div role="radiogroup" aria-labelledby={`scale-${label}`} className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${label} ${n}점${n === 1 ? ` (${low})` : n === 5 ? ` (${high})` : ""}`}
              // 이미 고른 값을 다시 누르면 선택을 지운다
              onClick={() => onChange(selected ? null : n)}
              className={cn(
                "h-11 rounded-lg border text-base font-medium tabular-nums transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-accent",
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
