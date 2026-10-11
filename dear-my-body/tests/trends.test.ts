import { describe, expect, it } from "vitest";
import {
  achievementRate,
  bestBehaviorGoal,
  dateRange,
  isAchieved,
  movingAverage,
  movingAverageChange,
  recordDaysThisWeek,
  weekStartOf,
  weeklyAchievement,
  type RateGoal,
} from "@/lib/trends";

const days = (from: string, values: (number | null)[]) =>
  dateRange(from, "2099-12-31")
    .slice(0, values.length)
    .flatMap((date, i) => (values[i] === null ? [] : [{ date, weight: values[i] as number }]));

describe("dateRange", () => {
  it("양 끝을 포함하고 월을 넘긴다", () => {
    expect(dateRange("2026-09-29", "2026-10-02")).toEqual([
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
    ]);
    expect(dateRange("2026-10-02", "2026-10-01")).toEqual([]);
  });
});

describe("movingAverage", () => {
  it("매일 기록이 있으면 직전 7일 평균을 낸다", () => {
    const entries = days("2026-10-01", [70, 71, 72, 73, 74, 75, 76, 77]);
    const ma = movingAverage(entries, "2026-10-07", "2026-10-08");
    expect(ma).toEqual([
      { date: "2026-10-07", value: 73 }, // 70~76
      { date: "2026-10-08", value: 74 }, // 71~77
    ]);
  });

  it("창 안 기록이 3개 미만이면 null", () => {
    const entries = days("2026-10-01", [70, 71]);
    expect(movingAverage(entries, "2026-10-01", "2026-10-02").map((p) => p.value)).toEqual([
      null,
      null,
    ]);
    const three = days("2026-10-01", [70, 71, 72]);
    expect(movingAverage(three, "2026-10-03", "2026-10-03")[0].value).toBe(71);
  });

  it("빠진 날은 건너뛰고 있는 기록만 평균낸다", () => {
    // 10/1 70, 10/2 없음, 10/3 72, 10/4 없음, 10/5 74
    const entries = days("2026-10-01", [70, null, 72, null, 74]);
    expect(movingAverage(entries, "2026-10-05", "2026-10-05")[0].value).toBe(72);
  });

  it("7일보다 오래된 기록은 창에서 빠진다", () => {
    const entries = [
      { date: "2026-10-01", weight: 100 },
      { date: "2026-10-06", weight: 70 },
      { date: "2026-10-07", weight: 70 },
      { date: "2026-10-08", weight: 70 },
    ];
    expect(movingAverage(entries, "2026-10-07", "2026-10-08").map((p) => p.value)).toEqual([
      80, // 10/1~10/7: 100, 70, 70
      70, // 10/2~10/8: 70, 70, 70
    ]);
  });

  it("소수 둘째 자리까지 반올림한다", () => {
    const entries = days("2026-10-01", [70, 70, 70.1]);
    expect(movingAverage(entries, "2026-10-03", "2026-10-03")[0].value).toBe(70.03);
  });
});

describe("movingAverageChange", () => {
  it("기준일 이후 첫 평균과 마지막 평균의 차이", () => {
    const series = [
      { date: "2026-10-01", value: null },
      { date: "2026-10-02", value: 70 },
      { date: "2026-10-03", value: 69.5 },
      { date: "2026-10-04", value: null },
      { date: "2026-10-05", value: 68.84 },
    ];
    expect(movingAverageChange(series)).toEqual({
      start: { date: "2026-10-02", value: 70 },
      current: { date: "2026-10-05", value: 68.84 },
      diff: -1.2,
    });
    expect(movingAverageChange(series, "2026-10-03")?.start.value).toBe(69.5);
  });

  it("평균이 하나뿐이면 null", () => {
    expect(movingAverageChange([{ date: "2026-10-01", value: 70 }])).toBeNull();
  });
});

const check: RateGoal = {
  id: "a",
  title: "아침 먹기",
  kind: "check",
  targetValue: null,
  activeFrom: "2026-10-01",
  activeUntil: null,
};
const water: RateGoal = {
  id: "b",
  title: "물 마시기",
  kind: "number",
  targetValue: 6,
  activeFrom: "2026-10-01",
  activeUntil: null,
};

describe("isAchieved", () => {
  it("체크형은 0보다 크면, 숫자형은 목표치 이상이면 달성", () => {
    expect(isAchieved(check, 1)).toBe(true);
    expect(isAchieved(check, undefined)).toBe(false);
    expect(isAchieved(water, 6)).toBe(true);
    expect(isAchieved(water, 5)).toBe(false);
  });
});

describe("achievementRate", () => {
  const checks = [
    { date: "2026-10-01", behaviorGoalId: "a", value: 1 },
    { date: "2026-10-02", behaviorGoalId: "a", value: 1 },
    { date: "2026-10-03", behaviorGoalId: "b", value: 6 },
    { date: "2026-10-04", behaviorGoalId: "b", value: 4 },
  ];

  it("기록하지 않은 날도 분모에 넣는다", () => {
    expect(achievementRate(check, checks, "2026-10-01", "2026-10-04")).toEqual({
      achieved: 2,
      eligible: 4,
      rate: 0.5,
    });
  });

  it("숫자형은 목표치에 못 미치면 달성으로 세지 않는다", () => {
    expect(achievementRate(water, checks, "2026-10-01", "2026-10-04").achieved).toBe(1);
  });

  it("행동 목표가 대상이었던 기간으로만 계산한다", () => {
    const later = { ...check, activeFrom: "2026-10-02", activeUntil: "2026-10-03" };
    expect(achievementRate(later, checks, "2026-10-01", "2026-10-04")).toEqual({
      achieved: 1,
      eligible: 2,
      rate: 0.5,
    });
  });

  it("기간이 겹치지 않으면 rate 는 null", () => {
    const future = { ...check, activeFrom: "2026-11-01" };
    expect(achievementRate(future, checks, "2026-10-01", "2026-10-04").rate).toBeNull();
  });
});

describe("weeklyAchievement", () => {
  it("월요일 시작 주로 나누고 기간 끝에서 자른다", () => {
    // 2026-10-05 는 월요일
    const checks = [
      { date: "2026-10-04", behaviorGoalId: "a", value: 1 }, // 일요일 (전 주)
      { date: "2026-10-05", behaviorGoalId: "a", value: 1 },
      { date: "2026-10-06", behaviorGoalId: "a", value: 1 },
    ];
    const weeks = weeklyAchievement([check], checks, "2026-10-03", "2026-10-07");
    expect(weeks).toEqual([
      { weekStart: "2026-09-28", achieved: 1, eligible: 2, rate: 0.5 }, // 10/3~10/4
      { weekStart: "2026-10-05", achieved: 2, eligible: 3, rate: 2 / 3 }, // 10/5~10/7
    ]);
  });

  it("행동 목표가 없으면 rate 는 null", () => {
    expect(weeklyAchievement([], [], "2026-10-05", "2026-10-06")[0].rate).toBeNull();
  });

  it("여러 행동 목표를 합쳐 계산한다", () => {
    const checks = [
      { date: "2026-10-05", behaviorGoalId: "a", value: 1 },
      { date: "2026-10-05", behaviorGoalId: "b", value: 8 },
      { date: "2026-10-06", behaviorGoalId: "a", value: 1 },
    ];
    const [week] = weeklyAchievement([check, water], checks, "2026-10-05", "2026-10-06");
    expect(week).toMatchObject({ achieved: 3, eligible: 4, rate: 0.75 });
  });
});

describe("bestBehaviorGoal", () => {
  it("달성률이 가장 높은 행동 목표, 동률이면 앞쪽", () => {
    const checks = [
      { date: "2026-10-01", behaviorGoalId: "a", value: 1 },
      { date: "2026-10-01", behaviorGoalId: "b", value: 6 },
    ];
    expect(bestBehaviorGoal([check, water], checks, "2026-10-01", "2026-10-02")?.goal.id).toBe("a");
    checks.push({ date: "2026-10-02", behaviorGoalId: "b", value: 6 });
    expect(bestBehaviorGoal([check, water], checks, "2026-10-01", "2026-10-02")).toEqual({
      goal: water,
      rate: 1,
    });
  });

  it("하루도 지키지 않았으면 null", () => {
    expect(bestBehaviorGoal([check], [], "2026-10-01", "2026-10-02")).toBeNull();
  });
});

describe("week helpers", () => {
  it("weekStartOf 는 월요일", () => {
    expect(weekStartOf("2026-10-11")).toBe("2026-10-05"); // 일요일 → 그 주 월요일
    expect(weekStartOf("2026-10-05")).toBe("2026-10-05");
  });

  it("recordDaysThisWeek 는 월요일부터 오늘까지", () => {
    expect(
      recordDaysThisWeek(["2026-10-04", "2026-10-05", "2026-10-07", "2026-10-07", "2026-10-12"], "2026-10-08"),
    ).toBe(2);
  });
});
