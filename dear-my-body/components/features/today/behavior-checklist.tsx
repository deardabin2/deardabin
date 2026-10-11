"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Stepper } from "./stepper";
import type { BehaviorGoalItem } from "./types";

export function BehaviorChecklist({
  goals,
  checks,
  hasActiveGoal,
  onChange,
}: {
  goals: BehaviorGoalItem[];
  checks: Record<string, number>;
  hasActiveGoal: boolean;
  onChange: (behaviorGoalId: string, value: number | null) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>행동 목표</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {goals.length === 0 ? (
          <p className="rounded-lg bg-muted px-3 py-4 text-center text-sm text-muted-foreground">
            {hasActiveGoal ? "아직 행동 목표가 없어요. " : "아직 목표가 없어요. "}
            <Link href="/goals" className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline">
              목표 정하러 가기
            </Link>
          </p>
        ) : null}

        {goals.map((goal) => {
          const value = checks[goal.id] ?? null;

          if (goal.kind === "check") {
            const done = value !== null && value > 0;
            return (
              <button
                key={goal.id}
                type="button"
                role="checkbox"
                aria-checked={done}
                onClick={() => onChange(goal.id, done ? null : 1)}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
                  done ? "border-primary bg-accent" : "bg-card hover:bg-muted",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-md border",
                    done ? "border-primary bg-primary text-primary-foreground" : "border-input",
                  )}
                >
                  {done ? <Check className="size-4" /> : null}
                </span>
                <span className={cn("text-base", done && "font-medium")}>{goal.title}</span>
              </button>
            );
          }

          const reached = value !== null && goal.targetValue !== null && value >= goal.targetValue;
          return (
            <div
              key={goal.id}
              className={cn("rounded-xl border p-3", reached ? "border-primary bg-accent" : "bg-card")}
            >
              <Stepper
                label={goal.title}
                value={value}
                onChange={(v) => onChange(goal.id, v)}
                step={1}
                max={100000}
                unit={goal.unit ?? ""}
                decimal
              />
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                {reached ? <Check className="size-3.5 text-primary" aria-hidden /> : null}
                하루 목표 {goal.targetValue?.toLocaleString("ko-KR")}
                {goal.unit}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
