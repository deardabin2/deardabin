import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import { BackLink } from "@/components/features/library/back-link";
import { ContentImage } from "@/components/features/library/content-image";
import { TagList } from "@/components/features/library/filter-chips";
import { ServingsScaler } from "@/components/features/library/servings-scaler";
import { Markdown } from "@/components/features/markdown";
import { requireUserId } from "@/lib/auth";
import { parseRecipeIngredients, parseRecipeSteps } from "@/lib/recipe";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "레시피" };

export default async function RecipeDetailPage({ params }: PageProps<"/library/recipes/[id]">) {
  await requireUserId();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await createClient();
  const { data: recipe } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(ingredients(id, name, is_published))")
    .eq("id", id)
    .maybeSingle();
  if (!recipe) notFound();

  const steps = parseRecipeSteps(recipe.steps);
  const linked = recipe.recipe_ingredients
    .flatMap((ri) => (ri.ingredients ? [ri.ingredients] : []))
    .filter((i) => i.is_published);

  return (
    <article className="flex flex-col gap-5">
      <BackLink href="/library/recipes" label="레시피" />
      <ContentImage path={recipe.image_path} alt={recipe.title} className="aspect-[16/10] w-full rounded-xl" />
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{recipe.title}</h1>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="size-4" aria-hidden />
          {recipe.cook_minutes !== null ? `${recipe.cook_minutes}분` : "시간 미정"}
        </p>
        {recipe.summary ? <p className="text-muted-foreground">{recipe.summary}</p> : null}
        <TagList tags={recipe.tags} />
      </header>

      <ServingsScaler baseServings={recipe.servings} ingredients={parseRecipeIngredients(recipe.ingredients)} />

      {steps.length > 0 ? (
        <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
          <h2 className="font-semibold">만드는 법</h2>
          <ol className="flex flex-col gap-3">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span
                  aria-hidden
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground"
                >
                  {i + 1}
                </span>
                <p className="pt-0.5 leading-relaxed">
                  <span className="sr-only">{i + 1}단계. </span>
                  {s.text}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {recipe.nutrition_note ? (
        <section className="flex flex-col gap-2 rounded-xl border bg-card p-4">
          <h2 className="font-semibold">영양 포인트</h2>
          <Markdown>{recipe.nutrition_note}</Markdown>
        </section>
      ) : null}

      {linked.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold">들어간 식재료 알아보기</h2>
          <ul className="flex flex-wrap gap-2">
            {linked.map((i) => (
              <li key={i.id}>
                <Link
                  href={`/library/ingredients/${i.id}`}
                  className="flex min-h-11 items-center rounded-full border bg-card px-4 text-sm hover:bg-accent"
                >
                  {i.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
