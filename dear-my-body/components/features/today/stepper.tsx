"use client";

import { useId } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Stepper({
  label,
  value,
  onChange,
  step,
  min = 0,
  max,
  unit,
  format = (v) => v.toLocaleString("ko-KR"),
  decimal = false,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  step: number;
  min?: number;
  max: number;
  unit: string;
  format?: (value: number) => string;
  decimal?: boolean;
}) {
  const inputId = useId();
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const current = value ?? 0;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-12 rounded-full"
          onClick={() => {
            const next = clamp(current - step);
            onChange(next === 0 && value === null ? null : next);
          }}
          disabled={value === null || current <= min}
          aria-label={`${label} ${format(step)}${unit} 줄이기`}
        >
          <Minus aria-hidden />
        </Button>
        <div className="relative flex-1">
          <input
            id={inputId}
            type="number"
            inputMode={decimal ? "decimal" : "numeric"}
            min={min}
            max={max}
            step={step}
            value={value ?? ""}
            placeholder="0"
            onChange={(e) => {
              if (e.target.value === "") return onChange(null);
              const n = Number(e.target.value);
              if (!Number.isNaN(n)) onChange(clamp(n));
            }}
            className="h-12 w-full rounded-lg border border-input bg-card pr-12 text-center text-lg font-semibold tabular-nums outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
            {unit}
          </span>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-12 rounded-full"
          onClick={() => onChange(clamp(current + step))}
          disabled={current >= max}
          aria-label={`${label} ${format(step)}${unit} 늘리기`}
        >
          <Plus aria-hidden />
        </Button>
      </div>
    </div>
  );
}
