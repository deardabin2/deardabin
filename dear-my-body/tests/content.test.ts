import { describe, expect, it } from "vitest";
import { formatAmount, scaleAmount } from "@/lib/recipe";
import {
  articleSchema,
  coachCommentSchema,
  ingredientSchema,
  parseTags,
  recipeSchema,
} from "@/lib/validations/content";

describe("parseTags", () => {
  it("쉼표로 나누고 공백·#·중복을 정리한다", () => {
    expect(parseTags(" 콩, #아침,, 식물성 단백질 , 콩")).toEqual(["콩", "아침", "식물성 단백질"]);
    expect(parseTags("")).toEqual([]);
  });
});

describe("ingredientSchema", () => {
  const base = {
    name: "두부",
    category: "단백질",
    tags: "콩, 아침",
    summary: "",
    benefits: "",
    howToUse: "",
    caution: "",
    imagePath: null,
    isPublished: false,
  };

  it("태그 문자열을 배열로 바꾼다", () => {
    expect(ingredientSchema.parse(base).tags).toEqual(["콩", "아침"]);
  });

  it("태그가 10개를 넘으면 막는다", () => {
    const tags = Array.from({ length: 11 }, (_, i) => `t${i}`).join(",");
    expect(ingredientSchema.safeParse({ ...base, tags }).success).toBe(false);
  });

  it("이미지 경로는 콘텐츠 폴더 형식만 허용한다", () => {
    const ok = "ingredients/3b241101-e2bb-4255-8caf-4136c566a962.jpg";
    expect(ingredientSchema.safeParse({ ...base, imagePath: ok }).success).toBe(true);
    expect(ingredientSchema.safeParse({ ...base, imagePath: "../meal-photos/x.jpg" }).success).toBe(false);
  });

  it("이름이 비면 막는다", () => {
    expect(ingredientSchema.safeParse({ ...base, name: " " }).success).toBe(false);
  });
});

describe("recipeSchema", () => {
  const base = {
    title: "두부 볶음",
    summary: "",
    servings: "2",
    cookMinutes: "",
    ingredients: [
      { name: "두부", amount: "300", unit: "g" },
      { name: "소금", amount: "", unit: "약간" },
    ],
    steps: [{ text: "썬다" }],
    tags: "",
    nutritionNote: "",
    imagePath: null,
    isPublished: true,
    ingredientIds: [],
  };

  it("문자열 숫자를 바꾸고 빈 양·조리시간은 null 로 둔다", () => {
    const r = recipeSchema.parse(base);
    expect(r.servings).toBe(2);
    expect(r.cookMinutes).toBeNull();
    expect(r.ingredients[0].amount).toBe(300);
    expect(r.ingredients[1].amount).toBeNull();
  });

  it("0인분과 빈 단계를 막는다", () => {
    expect(recipeSchema.safeParse({ ...base, servings: "0" }).success).toBe(false);
    expect(recipeSchema.safeParse({ ...base, steps: [{ text: " " }] }).success).toBe(false);
  });
});

describe("articleSchema / coachCommentSchema", () => {
  it("정렬 순서는 0 이상의 정수", () => {
    const base = { title: "제목", category: "기초", body: "", sortOrder: "1", isPublished: false };
    expect(articleSchema.parse(base).sortOrder).toBe(1);
    expect(articleSchema.safeParse({ ...base, sortOrder: "-1" }).success).toBe(false);
  });

  it("빈 코멘트를 막는다", () => {
    const id = "3b241101-e2bb-4255-8caf-4136c566a962";
    expect(coachCommentSchema.safeParse({ dailyLogId: id, body: "  " }).success).toBe(false);
    expect(coachCommentSchema.safeParse({ dailyLogId: id, body: "좋아요" }).success).toBe(true);
  });
});

describe("scaleAmount", () => {
  it("인분에 비례해 늘리고 줄인다", () => {
    expect(scaleAmount(300, 2, 3)).toBe(450);
    expect(scaleAmount(300, 2, 1)).toBe(150);
  });

  it("10 미만은 소수 첫째 자리까지", () => {
    expect(scaleAmount(1, 2, 1)).toBe(0.5);
    expect(scaleAmount(1, 3, 1)).toBe(0.3);
    expect(scaleAmount(0.5, 2, 3)).toBe(0.8);
  });

  it("10 이상은 정수로", () => {
    expect(scaleAmount(15, 2, 3)).toBe(23); // 22.5 → 23
  });
});

describe("formatAmount", () => {
  it("양이 없으면 단위(또는 적당량)만", () => {
    expect(formatAmount(null, "약간")).toBe("약간");
    expect(formatAmount(null, "")).toBe("적당량");
    expect(formatAmount(1500, "g")).toBe("1,500g");
    expect(formatAmount(0.5, "송이")).toBe("0.5송이");
  });
});

describe("parseRecipeIngredients / parseRecipeSteps", () => {
  it("형식이 어긋난 항목은 건너뛴다", async () => {
    const { parseRecipeIngredients, parseRecipeSteps } = await import("@/lib/recipe");
    expect(
      parseRecipeIngredients([{ name: "두부", amount: 300, unit: "g" }, { amount: 1 }, "x", { name: "소금", unit: "약간" }]),
    ).toEqual([
      { name: "두부", amount: 300, unit: "g" },
      { name: "소금", amount: null, unit: "약간" },
    ]);
    expect(parseRecipeIngredients(null)).toEqual([]);
    expect(parseRecipeSteps([{ order: 2, text: "b" }, { order: 1, text: "a" }, { order: 3 }])).toEqual([
      { text: "a" },
      { text: "b" },
    ]);
  });
});
