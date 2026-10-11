import { differenceInCalendarDays, format, startOfISOWeek } from "date-fns";
import { shiftDate, toDate } from "@/lib/date";

/** 이동평균 창 크기(일) */
export const MA_WINDOW_DAYS = 7;
/** 창 안에 체중 기록이 이만큼 있어야 그날 평균을 낸다 (드문드문 잰 날 하나로 선이 튀지 않게) */
export const MA_MIN_POINTS = 3;
/** 기간 안에 체중을 잰 날이 이보다 적으면 이동평균 대신 안내 문구를 보여 준다 */
export const MIN_WEIGHT_DAYS_FOR_TREND = 7;

export type WeightEntry = { date: string; weight: number };
export type SeriesPoint = { date: string; value: number | null };

/** from~to 사이 모든 날짜 (양 끝 포함) */
export function dateRange(from: string, to: string): string[] {
  const days = differenceInCalendarDays(toDate(to), toDate(from));
  return Array.from({ length: Math.max(days + 1, 0) }, (_, i) => shiftDate(from, i));
}

const round = (n: number, digits = 2) => Math.round(n * 10 ** digits) / 10 ** digits;

/**
 * 7일 이동평균. 각 날짜에 대해 그날을 포함한 직전 7일(달력 기준) 안의 체중 평균.
 * 창 안의 기록이 MA_MIN_POINTS 개 미만이면 null.
 * from 이전 6일치 체중도 넘겨주면 기간 첫날부터 평균을 낼 수 있다.
 */
export function movingAverage(
  entries: WeightEntry[],
  from: string,
  to: string,
  { window = MA_WINDOW_DAYS, minPoints = MA_MIN_POINTS } = {},
): SeriesPoint[] {
  const byDate = new Map(entries.map((e) => [e.date, e.weight]));
  return dateRange(from, to).map((date) => {
    const values = dateRange(shiftDate(date, -(window - 1)), date).flatMap((d) => {
      const w = byDate.get(d);
      return w === undefined ? [] : [w];
    });
    if (values.length < minPoints) return { date, value: null };
    return { date, value: round(values.reduce((a, b) => a + b, 0) / values.length) };
  });
}

/** 시작(기준일 이후 첫 평균)과 지금(마지막 평균)의 이동평균 차이 */
export function movingAverageChange(series: SeriesPoint[], baselineFrom?: string) {
  const valid = series.filter(
    (p): p is { date: string; value: number } =>
      p.value !== null && (!baselineFrom || p.date >= baselineFrom),
  );
  if (valid.length < 2) return null;
  const start = valid[0];
  const current = valid[valid.length - 1];
  if (start.date === current.date) return null;
  return { start, current, diff: round(current.value - start.value, 1) };
}

// ---------------------------------------------------------------------------
// 행동 목표 달성률
// ---------------------------------------------------------------------------

export type RateGoal = {
  id: string;
  title: string;
  kind: "check" | "number";
  targetValue: number | null;
  /** 이 날부터 매일 지킬 대상 (포함) */
  activeFrom: string;
  /** 이 날까지 대상 (포함). 보관하지 않았으면 null */
  activeUntil: string | null;
};

export type CheckEntry = { date: string; behaviorGoalId: string; value: number };

export function isAchieved(goal: Pick<RateGoal, "kind" | "targetValue">, value: number | undefined) {
  if (value === undefined) return false;
  if (goal.kind === "check") return value > 0;
  return goal.targetValue !== null && value >= goal.targetValue;
}

export type Rate = { achieved: number; eligible: number; rate: number | null };

/**
 * [from, to] 기간 중 이 행동 목표가 대상이었던 날 가운데 지킨 날의 비율.
 * 기록하지 않은 날은 지키지 않은 날로 센다(분모에 포함).
 */
export function achievementRate(goal: RateGoal, checks: CheckEntry[], from: string, to: string): Rate {
  const start = goal.activeFrom > from ? goal.activeFrom : from;
  const end = goal.activeUntil !== null && goal.activeUntil < to ? goal.activeUntil : to;
  if (start > end) return { achieved: 0, eligible: 0, rate: null };

  const values = new Map(
    checks.filter((c) => c.behaviorGoalId === goal.id).map((c) => [c.date, c.value]),
  );
  const days = dateRange(start, end);
  const achieved = days.filter((d) => isAchieved(goal, values.get(d))).length;
  return { achieved, eligible: days.length, rate: achieved / days.length };
}

/** 월요일 시작 주 단위로, 모든 행동 목표를 합친 달성률 */
export function weeklyAchievement(goals: RateGoal[], checks: CheckEntry[], from: string, to: string) {
  const weeks: { weekStart: string; from: string; to: string }[] = [];
  let weekStart = weekStartOf(from);
  while (weekStart <= to) {
    const weekEnd = shiftDate(weekStart, 6);
    weeks.push({
      weekStart,
      from: weekStart < from ? from : weekStart,
      to: weekEnd > to ? to : weekEnd,
    });
    weekStart = shiftDate(weekStart, 7);
  }

  return weeks.map((w) => {
    const totals = goals
      .map((g) => achievementRate(g, checks, w.from, w.to))
      .reduce((acc, r) => ({ achieved: acc.achieved + r.achieved, eligible: acc.eligible + r.eligible }), {
        achieved: 0,
        eligible: 0,
      });
    return {
      weekStart: w.weekStart,
      ...totals,
      rate: totals.eligible === 0 ? null : totals.achieved / totals.eligible,
    };
  });
}

/** 기간 중 가장 잘 지킨 행동 목표. 하루도 지키지 않았으면 null, 동률이면 목록 앞쪽 */
export function bestBehaviorGoal(goals: RateGoal[], checks: CheckEntry[], from: string, to: string) {
  let best: { goal: RateGoal; rate: number } | null = null;
  for (const goal of goals) {
    const r = achievementRate(goal, checks, from, to);
    if (r.rate === null || r.achieved === 0) continue;
    if (!best || r.rate > best.rate) best = { goal, rate: r.rate };
  }
  return best;
}

export function weekStartOf(date: string): string {
  return format(startOfISOWeek(toDate(date)), "yyyy-MM-dd");
}

/** 이번 주(월요일~오늘) 기록한 날 수 */
export function recordDaysThisWeek(recordedDates: string[], today: string): number {
  const start = weekStartOf(today);
  return new Set(recordedDates.filter((d) => d >= start && d <= today)).size;
}
