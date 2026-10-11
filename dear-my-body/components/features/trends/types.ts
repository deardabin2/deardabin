export const TREND_RANGES = ["2w", "4w", "all"] as const;
export type TrendRange = (typeof TREND_RANGES)[number];

export const TREND_RANGE_LABELS: Record<TrendRange, string> = {
  "2w": "2주",
  "4w": "4주",
  all: "전체",
};

export type DailyPoint = {
  date: string;
  weight: number | null;
  ma: number | null;
  sleep: number | null;
  water: number | null;
  hunger: number | null;
  energy: number | null;
  mood: number | null;
  digestion: number | null;
};

export type TrendsData = {
  range: TrendRange;
  from: string;
  today: string;
  daily: DailyPoint[];
  weightDays: number;
  showMovingAverage: boolean;
  targetWeight: number | null;
  summary: {
    weightChange: { from: string; diff: number; current: number } | null;
    baselineLabel: string;
    recordDaysThisWeek: number;
    elapsedDaysThisWeek: number;
    bestGoal: { title: string; rate: number } | null;
  };
  weekly: { weekStart: string; rate: number | null; achieved: number; eligible: number }[];
  goalRates: { id: string; title: string; achieved: number; eligible: number; rate: number | null }[];
  hasBehaviorGoals: boolean;
};
