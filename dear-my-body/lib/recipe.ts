/** 기준 인분의 양을 원하는 인분으로 환산. 10 미만은 소수 첫째 자리, 그 이상은 정수로 */
export function scaleAmount(amount: number, baseServings: number, servings: number): number {
  const scaled = (amount * servings) / baseServings;
  return scaled < 10 ? Math.round(scaled * 10) / 10 : Math.round(scaled);
}

export function formatAmount(amount: number | null, unit: string): string {
  if (amount === null) return unit || "적당량";
  const text = amount.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
  return `${text}${unit}`;
}

export const COOK_TIME_FILTERS = [
  { key: "15", label: "15분 이내", max: 15 },
  { key: "30", label: "30분 이내", max: 30 },
] as const;

export type RecipeIngredientItem = { name: string; amount: number | null; unit: string };
export type RecipeStepItem = { text: string };

/** DB jsonb 를 화면용 배열로. 형식이 어긋난 항목은 건너뛴다 */
export function parseRecipeIngredients(value: unknown): RecipeIngredientItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const { name, amount, unit } = item as Record<string, unknown>;
    if (typeof name !== "string" || !name) return [];
    return [
      {
        name,
        amount: typeof amount === "number" && amount > 0 ? amount : null,
        unit: typeof unit === "string" ? unit : "",
      },
    ];
  });
}

export function parseRecipeSteps(value: unknown): RecipeStepItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const { order, text } = item as Record<string, unknown>;
      if (typeof text !== "string" || !text) return [];
      return [{ order: typeof order === "number" ? order : 0, text }];
    })
    .sort((a, b) => a.order - b.order)
    .map(({ text }) => ({ text }));
}
