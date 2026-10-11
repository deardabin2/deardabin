"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { saveBehaviorCheck, saveDailyLog, saveMeal } from "@/app/(client)/today/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MEAL_TYPES, type DailyLogPatch, type MealType } from "@/lib/validations/daily-log";
import { CoachComments } from "@/components/features/coach-comments";
import { BehaviorChecklist } from "./behavior-checklist";
import { DateNav } from "./date-nav";
import { MealCard } from "./meal-card";
import { SaveStatusBadge } from "./save-status";
import { ScaleSelector } from "./scale-selector";
import { Stepper } from "./stepper";
import type { LogFields, MealState, TodayData } from "./types";
import { useAutosave } from "./use-autosave";

const WATER_STEP_ML = 250;

// 컨디션 척도의 양 끝 설명
const CONDITIONS = [
  { key: "hunger", label: "배고픔", low: "거의 없음", high: "아주 배고픔" },
  { key: "energy", label: "에너지", low: "지침", high: "활기참" },
  { key: "mood", label: "기분", low: "가라앉음", high: "좋음" },
  { key: "digestion", label: "소화", low: "불편함", high: "편안함" },
] as const;

export function TodayLogger({ data }: { data: TodayData }) {
  const { logDate, today, userId } = data;
  const { status, schedule, saveNow, retry } = useAutosave();

  const [log, setLog] = useState<LogFields>(data.log);
  const [meals, setMeals] = useState(data.meals);
  const [checks, setChecks] = useState(data.checks);
  const [weightText, setWeightText] = useState(data.log.weight?.toString() ?? "");
  const [weightHint, setWeightHint] = useState<string | null>(null);

  // 저장 작업은 디바운스 뒤에 실행되므로 항상 최신 값을 ref 에서 읽는다
  const pendingPatch = useRef<DailyLogPatch>({});
  const mealsRef = useRef(meals);
  const checksRef = useRef(checks);

  const updateLog = (patch: Partial<LogFields>) => {
    setLog((prev) => ({ ...prev, ...patch }));
    pendingPatch.current = { ...pendingPatch.current, ...patch };
    schedule("log", async () => {
      const sending = pendingPatch.current;
      if (Object.keys(sending).length === 0) return { ok: true, data: undefined };
      pendingPatch.current = {};
      const result = await saveDailyLog({ logDate, patch: sending });
      // 실패하면 보내려던 값을 되돌려 놓아 '다시 시도' 때 함께 보낸다
      if (!result.ok) pendingPatch.current = { ...sending, ...pendingPatch.current };
      return result;
    });
  };

  const mealTask = (mealType: MealType) => () => {
    const m = mealsRef.current[mealType];
    return saveMeal({
      logDate,
      mealType,
      description: m.description,
      eatenAt: m.eatenAt,
      photoPath: m.photoPath,
    });
  };

  const updateMeal = (mealType: MealType, patch: Partial<MealState>, immediate = false) => {
    const next = { ...mealsRef.current, [mealType]: { ...mealsRef.current[mealType], ...patch } };
    mealsRef.current = next;
    setMeals(next);
    if (immediate) saveNow(`meal:${mealType}`, mealTask(mealType));
    else schedule(`meal:${mealType}`, mealTask(mealType));
  };

  const updateCheck = (behaviorGoalId: string, value: number | null) => {
    const next = { ...checksRef.current };
    if (value === null || value === 0) delete next[behaviorGoalId];
    else next[behaviorGoalId] = value;
    checksRef.current = next;
    setChecks(next);
    schedule(
      `check:${behaviorGoalId}`,
      () =>
        saveBehaviorCheck({
          logDate,
          behaviorGoalId,
          value: checksRef.current[behaviorGoalId] ?? null,
        }),
      400,
    );
  };

  const onWeightChange = (text: string) => {
    setWeightText(text);
    if (text.trim() === "") {
      setWeightHint(null);
      updateLog({ weight: null });
      return;
    }
    const n = Number(text);
    if (Number.isNaN(n) || n < 20 || n > 300) {
      setWeightHint("20~300 사이 숫자로 적어 주세요.");
      return;
    }
    setWeightHint(null);
    updateLog({ weight: Math.round(n * 10) / 10 });
  };

  return (
    <div className="flex flex-col gap-4">
      <DateNav logDate={logDate} today={today} />
      <div className="-mt-2 flex items-center justify-between">
        <SaveStatusBadge status={status} onRetry={retry} />
        <Link
          href="/history"
          className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-medium text-primary hover:bg-accent"
        >
          <CalendarDays className="size-4" aria-hidden />
          기록 달력
        </Link>
      </div>

      <CoachComments comments={data.coachComments} />

      <section aria-labelledby="meals-heading" className="flex flex-col gap-3">
        <h2 id="meals-heading" className="text-base font-semibold">
          식사
        </h2>
        {MEAL_TYPES.map((mealType) => (
          <MealCard
            key={mealType}
            mealType={mealType}
            meal={meals[mealType]}
            userId={userId}
            logDate={logDate}
            onChange={(patch) => updateMeal(mealType, patch)}
            onPhotoChange={(patch) => updateMeal(mealType, patch, true)}
          />
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>몸 기록</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="weight">
              체중 <span className="font-normal text-muted-foreground">(선택)</span>
            </Label>
            <div className="relative">
              <Input
                id="weight"
                type="number"
                inputMode="decimal"
                step="0.1"
                value={weightText}
                onChange={(e) => onWeightChange(e.target.value)}
                aria-describedby={weightHint ? "weight-hint" : undefined}
                className="pr-10"
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                kg
              </span>
            </div>
            {weightHint ? (
              <p id="weight-hint" className="text-sm text-muted-foreground">
                {weightHint}
              </p>
            ) : null}
          </div>

          <Stepper
            label="물"
            value={log.water_ml}
            onChange={(v) => updateLog({ water_ml: v })}
            step={WATER_STEP_ML}
            max={10000}
            unit="ml"
          />
          <Stepper
            label="수면"
            value={log.sleep_hours}
            onChange={(v) => updateLog({ sleep_hours: v === null ? null : Math.round(v * 2) / 2 })}
            step={0.5}
            max={24}
            unit="시간"
            decimal
          />
          <Stepper
            label="걸음 수"
            value={log.steps}
            onChange={(v) => updateLog({ steps: v === null ? null : Math.round(v) })}
            step={1000}
            max={100000}
            unit="걸음"
          />

          <div className="flex flex-col gap-2">
            <Label htmlFor="exercise">운동</Label>
            <Textarea
              id="exercise"
              maxLength={500}
              value={log.exercise_note ?? ""}
              placeholder="예: 저녁에 30분 걷기"
              onChange={(e) => updateLog({ exercise_note: e.target.value || null })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>컨디션</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {CONDITIONS.map((c) => (
            <ScaleSelector
              key={c.key}
              label={c.label}
              low={c.low}
              high={c.high}
              value={log[c.key]}
              onChange={(v) => updateLog({ [c.key]: v })}
            />
          ))}
        </CardContent>
      </Card>

      <BehaviorChecklist
        goals={data.behaviorGoals}
        checks={checks}
        hasActiveGoal={data.hasActiveGoal}
        onChange={updateCheck}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            <label htmlFor="note">오늘의 메모</label>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="note"
            maxLength={1000}
            value={log.note ?? ""}
            placeholder="오늘 몸과 마음은 어땠나요?"
            onChange={(e) => updateLog({ note: e.target.value || null })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
