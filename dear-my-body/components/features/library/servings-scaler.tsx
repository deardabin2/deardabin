"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatAmount, scaleAmount, type RecipeIngredientItem } from "@/lib/recipe";

const MAX_SERVINGS = 20;

export function ServingsScaler({
  baseServings,
  ingredients,
}: {
  baseServings: number;
  ingredients: RecipeIngredientItem[];
}) {
  const [servings, setServings] = useState(baseServings);

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-4" aria-labelledby="ingredients-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="ingredients-heading" className="font-semibold">
          재료
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            onClick={() => setServings((s) => Math.max(1, s - 1))}
            disabled={servings <= 1}
            aria-label="1인분 줄이기"
          >
            <Minus aria-hidden />
          </Button>
          <output aria-live="polite" className="min-w-14 text-center font-semibold">
            {servings}인분
          </output>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            onClick={() => setServings((s) => Math.min(MAX_SERVINGS, s + 1))}
            disabled={servings >= MAX_SERVINGS}
            aria-label="1인분 늘리기"
          >
            <Plus aria-hidden />
          </Button>
        </div>
      </div>
      {servings !== baseServings ? (
        <p className="text-xs text-muted-foreground">
          기준 {baseServings}인분에서 비례로 계산했어요. 양념은 맛을 보며 조절해 주세요.
        </p>
      ) : null}
      {ingredients.length === 0 ? (
        <p className="text-sm text-muted-foreground">재료 정보가 아직 없어요.</p>
      ) : (
        <ul className="divide-y">
          {ingredients.map((item, i) => (
            <li key={`${item.name}-${i}`} className="flex items-center justify-between gap-3 py-2.5">
              <span>{item.name}</span>
              <span className="text-muted-foreground tabular-nums">
                {formatAmount(
                  item.amount === null ? null : scaleAmount(item.amount, baseServings, servings),
                  item.unit,
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
