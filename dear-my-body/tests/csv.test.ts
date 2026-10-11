import { describe, expect, it } from "vitest";
import { buildDailyLogCsv, toCsv } from "@/lib/csv";

describe("toCsv", () => {
  it("BOM 을 붙이고 쉼표·따옴표·줄바꿈을 감싼다", () => {
    const csv = toCsv(["a", "b"], [["쉼표, 있음", 'say "hi"'], ["줄\n바꿈", 3]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toBe('﻿a,b\r\n"쉼표, 있음","say ""hi"""\r\n"줄\n바꿈",3\r\n');
  });

  it("수식으로 실행될 수 있는 글은 무력화한다", () => {
    expect(toCsv(["x"], [["=HYPERLINK(1)"], ["+1"], ["@SUM"], [-1]])).toBe("﻿x\r\n'=HYPERLINK(1)\r\n'+1\r\n'@SUM\r\n-1\r\n");
  });

  it("null 은 빈칸", () => {
    expect(toCsv(["a", "b"], [[null, undefined]])).toBe("﻿a,b\r\n,\r\n");
  });
});

describe("buildDailyLogCsv", () => {
  it("날짜순으로, 끼니·행동 목표·코멘트를 열로 펼친다", () => {
    const base = {
      weight: null,
      water_ml: 500,
      sleep_hours: 7,
      steps: null,
      exercise_note: null,
      hunger: 3,
      energy: null,
      mood: null,
      digestion: null,
      note: null,
      behavior_checks: [],
      coach_comments: [],
      meals: [],
    };
    const csv = buildDailyLogCsv(
      [
        { ...base, log_date: "2026-10-02" },
        {
          ...base,
          log_date: "2026-10-01",
          meals: [{ meal_type: "lunch", description: "비빔밥", eaten_at: "12:30:00", photo_path: "x.jpg" }],
          behavior_checks: [{ behavior_goal_id: "g1", value: 1 }],
          coach_comments: [
            { body: "둘째", created_at: "2026-10-01T10:00:00Z" },
            { body: "첫째", created_at: "2026-10-01T09:00:00Z" },
          ],
        },
      ],
      [{ id: "g1", title: "아침 먹기" }],
    );
    const lines = csv.slice(1).trim().split("\r\n");
    expect(lines[0].split(",")).toContain("행동 목표: 아침 먹기");
    expect(lines[1]).toBe("2026-10-01,,500,7,,,3,,,,,,,,비빔밥,12:30,있음,,,,,,,1,첫째 / 둘째");
    expect(lines[2].startsWith("2026-10-02,")).toBe(true);
  });
});
