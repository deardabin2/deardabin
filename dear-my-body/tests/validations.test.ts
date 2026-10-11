import { describe, expect, it } from "vitest";
import { signupSchema } from "@/lib/validations/auth";
import {
  isOwnMealPhotoPath,
  saveBehaviorCheckSchema,
  saveDailyLogSchema,
  saveMealSchema,
} from "@/lib/validations/daily-log";
import { goalSchema } from "@/lib/validations/goal";

const USER = "8f14e45f-ceea-467e-9575-3d0b0e3a6c11";

describe("signupSchema", () => {
  const base = { displayName: "다빈", email: "a@b.co", password: "12345678", passwordConfirm: "12345678" };

  it("정상 입력을 통과시킨다", () => {
    expect(signupSchema.safeParse(base).success).toBe(true);
  });

  it("비밀번호 확인이 다르면 passwordConfirm 에 오류를 낸다", () => {
    const r = signupSchema.safeParse({ ...base, passwordConfirm: "different" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(["passwordConfirm"]);
  });

  it("8자 미만 비밀번호를 막는다", () => {
    expect(signupSchema.safeParse({ ...base, password: "1234567", passwordConfirm: "1234567" }).success).toBe(false);
  });
});

describe("goalSchema", () => {
  const base = {
    startDate: "2026-10-01",
    endDate: "2026-12-31",
    startWeight: "",
    targetWeight: "",
    motivation: "가볍게 계단 오르기",
    behaviorGoals: [],
  };

  it("체중을 비워도 통과하고 null 로 바꾼다", () => {
    const r = goalSchema.safeParse(base);
    expect(r.success).toBe(true);
    expect(r.data?.startWeight).toBeNull();
    expect(r.data?.targetWeight).toBeNull();
  });

  it("체중 문자열을 숫자로 바꾼다", () => {
    const r = goalSchema.safeParse({ ...base, startWeight: "62.4", targetWeight: 58 });
    expect(r.data?.startWeight).toBe(62.4);
    expect(r.data?.targetWeight).toBe(58);
  });

  it("범위를 벗어난 체중을 막는다", () => {
    expect(goalSchema.safeParse({ ...base, startWeight: "5" }).success).toBe(false);
    expect(goalSchema.safeParse({ ...base, startWeight: "abc" }).success).toBe(false);
  });

  it("마치는 날이 시작일보다 빠르면 막는다", () => {
    const r = goalSchema.safeParse({ ...base, endDate: "2026-09-30" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(["endDate"]);
  });

  it("행동 목표는 5개까지만 허용한다", () => {
    const one = { title: "아침 먹기", kind: "check", targetValue: "", unit: "" };
    expect(goalSchema.safeParse({ ...base, behaviorGoals: Array(5).fill(one) }).success).toBe(true);
    expect(goalSchema.safeParse({ ...base, behaviorGoals: Array(6).fill(one) }).success).toBe(false);
  });

  it("숫자형 행동 목표는 목표치가 필요하다", () => {
    const r = goalSchema.safeParse({
      ...base,
      behaviorGoals: [{ title: "물 마시기", kind: "number", targetValue: "", unit: "잔" }],
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(["behaviorGoals", 0, "targetValue"]);
  });

  it("체크형 행동 목표는 목표치·단위를 지운다", () => {
    const r = goalSchema.safeParse({
      ...base,
      behaviorGoals: [{ title: "아침 먹기", kind: "check", targetValue: "3", unit: "번" }],
    });
    expect(r.data?.behaviorGoals[0]).toMatchObject({ targetValue: null, unit: null });
  });

  it("빈 제목을 막는다", () => {
    const r = goalSchema.safeParse({
      ...base,
      behaviorGoals: [{ title: "  ", kind: "check", targetValue: "", unit: "" }],
    });
    expect(r.success).toBe(false);
  });
});

describe("saveDailyLogSchema", () => {
  it("일부 항목만 보내는 패치를 허용한다", () => {
    expect(saveDailyLogSchema.safeParse({ logDate: "2026-10-11", patch: { water_ml: 750 } }).success).toBe(true);
  });

  it("체중 null(미입력)을 허용한다", () => {
    expect(saveDailyLogSchema.safeParse({ logDate: "2026-10-11", patch: { weight: null } }).success).toBe(true);
  });

  it("빈 패치를 막는다", () => {
    expect(saveDailyLogSchema.safeParse({ logDate: "2026-10-11", patch: {} }).success).toBe(false);
  });

  it("모르는 필드(user_id 등)를 막는다", () => {
    expect(
      saveDailyLogSchema.safeParse({ logDate: "2026-10-11", patch: { user_id: USER } }).success,
    ).toBe(false);
  });

  it("컨디션은 1~5 정수만 허용한다", () => {
    expect(saveDailyLogSchema.safeParse({ logDate: "2026-10-11", patch: { mood: 0 } }).success).toBe(false);
    expect(saveDailyLogSchema.safeParse({ logDate: "2026-10-11", patch: { mood: 6 } }).success).toBe(false);
    expect(saveDailyLogSchema.safeParse({ logDate: "2026-10-11", patch: { mood: 2.5 } }).success).toBe(false);
    expect(saveDailyLogSchema.safeParse({ logDate: "2026-10-11", patch: { mood: 3 } }).success).toBe(true);
  });

  it("수면은 30분 단위만 허용한다", () => {
    expect(saveDailyLogSchema.safeParse({ logDate: "2026-10-11", patch: { sleep_hours: 7.5 } }).success).toBe(true);
    expect(saveDailyLogSchema.safeParse({ logDate: "2026-10-11", patch: { sleep_hours: 7.3 } }).success).toBe(false);
  });

  it("존재하지 않는 날짜를 막는다", () => {
    expect(saveDailyLogSchema.safeParse({ logDate: "2026-02-30", patch: { steps: 1 } }).success).toBe(false);
    expect(saveDailyLogSchema.safeParse({ logDate: "20261011", patch: { steps: 1 } }).success).toBe(false);
  });
});

describe("saveMealSchema", () => {
  const base = { logDate: "2026-10-11", mealType: "lunch", description: "현미밥", eatenAt: "12:30", photoPath: null };

  it("정상 입력을 통과시킨다", () => {
    expect(saveMealSchema.safeParse(base).success).toBe(true);
  });

  it("잘못된 끼니와 시간을 막는다", () => {
    expect(saveMealSchema.safeParse({ ...base, mealType: "brunch" }).success).toBe(false);
    expect(saveMealSchema.safeParse({ ...base, eatenAt: "25:00" }).success).toBe(false);
  });
});

describe("saveBehaviorCheckSchema", () => {
  it("null(체크 해제)과 양수를 허용하고 음수를 막는다", () => {
    const base = { logDate: "2026-10-11", behaviorGoalId: USER };
    expect(saveBehaviorCheckSchema.safeParse({ ...base, value: null }).success).toBe(true);
    expect(saveBehaviorCheckSchema.safeParse({ ...base, value: 3 }).success).toBe(true);
    expect(saveBehaviorCheckSchema.safeParse({ ...base, value: -1 }).success).toBe(false);
  });
});

describe("isOwnMealPhotoPath", () => {
  const ok = `${USER}/2026-10-11/lunch-3b241101-e2bb-4255-8caf-4136c566a962.jpg`;

  it("본인 폴더·날짜·끼니가 맞는 경로만 허용한다", () => {
    expect(isOwnMealPhotoPath(ok, USER, "2026-10-11", "lunch")).toBe(true);
    expect(isOwnMealPhotoPath(ok, "00000000-0000-4000-a000-000000000000", "2026-10-11", "lunch")).toBe(false);
    expect(isOwnMealPhotoPath(ok, USER, "2026-10-10", "lunch")).toBe(false);
    expect(isOwnMealPhotoPath(ok, USER, "2026-10-11", "dinner")).toBe(false);
  });

  it("경로 조작을 막는다", () => {
    expect(isOwnMealPhotoPath(`${USER}/2026-10-11/lunch-../../x.jpg`, USER, "2026-10-11", "lunch")).toBe(false);
  });
});
