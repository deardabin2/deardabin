import { describe, expect, it } from "vitest";
import { monthGrid, monthRange, parseMonthParam, shiftMonth } from "@/lib/calendar";
import { isDateString, shiftDate, todayInSeoul } from "@/lib/date";
import { hasAnyRecord } from "@/lib/records";
import { safeNextPath } from "@/lib/safe-redirect";

describe("todayInSeoul", () => {
  it("UTC 기준 전날 오후 3시 이후는 서울에선 다음 날이다", () => {
    expect(todayInSeoul(new Date("2026-10-10T14:59:00Z"))).toBe("2026-10-10");
    expect(todayInSeoul(new Date("2026-10-10T15:00:00Z"))).toBe("2026-10-11");
  });
});

describe("date helpers", () => {
  it("isDateString 은 실제 있는 날짜만 통과시킨다", () => {
    expect(isDateString("2026-10-11")).toBe(true);
    expect(isDateString("2026-02-29")).toBe(false);
    expect(isDateString("2028-02-29")).toBe(true);
    expect(isDateString("2026-1-1")).toBe(false);
  });

  it("shiftDate 는 월·연을 넘어 계산한다", () => {
    expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftDate("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("calendar helpers", () => {
  it("미래 달이나 잘못된 값은 이번 달로 바꾼다", () => {
    expect(parseMonthParam("2026-12", "2026-10-11")).toBe("2026-10");
    expect(parseMonthParam("abc", "2026-10-11")).toBe("2026-10");
    expect(parseMonthParam("2026-08", "2026-10-11")).toBe("2026-08");
  });

  it("monthRange 와 shiftMonth", () => {
    expect(monthRange("2026-02")).toEqual({ start: "2026-02-01", end: "2026-02-28" });
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });

  it("monthGrid 는 일요일 시작, 7의 배수 칸", () => {
    const grid = monthGrid("2026-10");
    expect(grid.length % 7).toBe(0);
    // 2026-10-01 은 목요일 → 앞에 빈칸 4개
    expect(grid.slice(0, 5)).toEqual([null, null, null, null, "2026-10-01"]);
    expect(grid.filter(Boolean)).toHaveLength(31);
  });
});

describe("hasAnyRecord", () => {
  const empty = {
    weight: null,
    water_ml: null,
    sleep_hours: null,
    steps: null,
    exercise_note: null,
    hunger: null,
    energy: null,
    mood: null,
    digestion: null,
    note: null,
    meals: [],
    behavior_checks: [],
  };

  it("모두 비어 있으면 기록 없음", () => {
    expect(hasAnyRecord(empty)).toBe(false);
    expect(hasAnyRecord({ ...empty, note: "  ", meals: [{ description: "", photo_path: null }] })).toBe(false);
  });

  it("체중 없이 다른 항목만 있어도 기록한 날", () => {
    expect(hasAnyRecord({ ...empty, water_ml: 500 })).toBe(true);
    expect(hasAnyRecord({ ...empty, meals: [{ description: "샐러드", photo_path: null }] })).toBe(true);
    expect(hasAnyRecord({ ...empty, behavior_checks: [{}] })).toBe(true);
  });

  it("0 도 입력한 값으로 본다", () => {
    expect(hasAnyRecord({ ...empty, steps: 0 })).toBe(true);
  });
});

describe("safeNextPath", () => {
  it("내부 경로만 허용한다", () => {
    expect(safeNextPath("/goals")).toBe("/goals");
    expect(safeNextPath("//evil.com")).toBe("/");
    expect(safeNextPath("https://evil.com")).toBe("/");
    expect(safeNextPath("/\\evil.com")).toBe("/");
    expect(safeNextPath(undefined)).toBe("/");
  });
});
