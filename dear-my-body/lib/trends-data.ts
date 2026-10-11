import "server-only";
import type { TrendRange, TrendsData } from "@/components/features/trends/types";
import { shiftDate, todayInSeoul } from "@/lib/date";
import { hasAnyRecord } from "@/lib/records";
import { createClient } from "@/lib/supabase/server";
import {
  achievementRate,
  bestBehaviorGoal,
  dateRange,
  MA_WINDOW_DAYS,
  MIN_WEIGHT_DAYS_FOR_TREND,
  movingAverage,
  movingAverageChange,
  recordDaysThisWeek,
  weekStartOf,
  weeklyAchievement,
  type CheckEntry,
  type RateGoal,
} from "@/lib/trends";

const RANGE_DAYS: Record<Exclude<TrendRange, "all">, number> = { "2w": 14, "4w": 28 };

/** 추이 화면 데이터. 본인(고객) 화면과 코치의 고객 상세 화면이 함께 쓴다. 권한은 RLS 가 막는다 */
export async function getTrendsData(userId: string, range: TrendRange): Promise<TrendsData> {
  const today = todayInSeoul();
  const supabase = await createClient();

  const [{ data: goal }, { data: first }] = await Promise.all([
    supabase
      .from("goals")
      .select(
        "start_date, target_weight, behavior_goals(id, title, kind, target_value, sort_order, created_at, archived_at)",
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("daily_logs")
      .select("log_date")
      .eq("user_id", userId)
      .order("log_date")
      .limit(1)
      .maybeSingle(),
  ]);

  const from =
    range === "all"
      ? [first?.log_date, goal?.start_date].filter((d): d is string => !!d && d <= today).sort()[0] ?? today
      : shiftDate(today, -(RANGE_DAYS[range] - 1));

  // 체중 변화 요약은 목표 시작일 기준이라, 차트 기간보다 앞선 기록도 필요할 수 있다
  const baseline = goal?.start_date && goal.start_date <= today ? goal.start_date : from;
  const fetchFrom = shiftDate(baseline < from ? baseline : from, -(MA_WINDOW_DAYS - 1));

  const { data: logs } = await supabase
    .from("daily_logs")
    .select("*, meals(description, photo_path), behavior_checks(behavior_goal_id, value)")
    .eq("user_id", userId)
    .gte("log_date", fetchFrom)
    .lte("log_date", today)
    .order("log_date");

  const rows = logs ?? [];
  const byDate = new Map(rows.map((r) => [r.log_date, r]));
  const weights = rows.flatMap((r) => (r.weight === null ? [] : [{ date: r.log_date, weight: Number(r.weight) }]));

  const weightDays = weights.filter((w) => w.date >= from).length;
  const showMovingAverage = weightDays >= MIN_WEIGHT_DAYS_FOR_TREND;
  const ma = new Map(movingAverage(weights, from, today).map((p) => [p.date, p.value]));

  const daily = dateRange(from, today).map((date) => {
    const r = byDate.get(date);
    return {
      date,
      weight: r?.weight ?? null,
      ma: showMovingAverage ? (ma.get(date) ?? null) : null,
      sleep: r?.sleep_hours ?? null,
      water: r?.water_ml ?? null,
      hunger: r?.hunger ?? null,
      energy: r?.energy ?? null,
      mood: r?.mood ?? null,
      digestion: r?.digestion ?? null,
    };
  });

  // 시작 대비 변화도 같은 기준(기록 7일 이상)을 지킨다
  const baselineWeights = weights.filter((w) => w.date >= baseline);
  const change =
    baselineWeights.length >= MIN_WEIGHT_DAYS_FOR_TREND
      ? movingAverageChange(movingAverage(weights, baseline, today), baseline)
      : null;

  const checks: CheckEntry[] = rows.flatMap((r) =>
    r.behavior_checks.map((c) => ({ date: r.log_date, behaviorGoalId: c.behavior_goal_id, value: Number(c.value) })),
  );
  const rateGoals: RateGoal[] = (goal?.behavior_goals ?? [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((b) => {
      const created = todayInSeoul(new Date(b.created_at));
      const firstCheck = checks.filter((c) => c.behaviorGoalId === b.id).map((c) => c.date).sort()[0];
      // 지난 날짜도 기록할 수 있어서, 만든 날보다 앞선 체크가 있으면 그날부터 대상으로 본다
      const startedAt = firstCheck && firstCheck < created ? firstCheck : created;
      return {
        id: b.id,
        title: b.title,
        kind: b.kind === "number" ? "number" : "check",
        targetValue: b.target_value,
        activeFrom: goal && goal.start_date > startedAt ? goal.start_date : startedAt,
        activeUntil: b.archived_at ? todayInSeoul(new Date(b.archived_at)) : null,
      };
    });

  const goalRates = rateGoals
    .map((g) => ({ id: g.id, title: g.title, ...achievementRate(g, checks, from, today) }))
    .filter((g) => g.eligible > 0);
  const best = bestBehaviorGoal(rateGoals, checks, from, today);
  const recordedDates = rows.filter(hasAnyRecord).map((r) => r.log_date);

  const data: TrendsData = {
    range,
    from,
    today,
    daily,
    weightDays,
    showMovingAverage,
    targetWeight: goal?.target_weight ?? null,
    summary: {
      weightChange: change
        ? { from: change.start.date, diff: change.diff, current: change.current.value }
        : null,
      baselineLabel: goal?.start_date ? "목표 시작 이후" : "첫 기록 이후",
      recordDaysThisWeek: recordDaysThisWeek(recordedDates, today),
      elapsedDaysThisWeek: dateRange(weekStartOf(today), today).length,
      bestGoal: best ? { title: best.goal.title, rate: best.rate } : null,
    },
    weekly: weeklyAchievement(rateGoals, checks, from, today),
    goalRates,
    hasBehaviorGoals: rateGoals.length > 0,
  };

  return data;
}
