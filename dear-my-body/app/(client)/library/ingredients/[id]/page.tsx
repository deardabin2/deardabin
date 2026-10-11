import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/features/library/back-link";
import { ContentImage } from "@/components/features/library/content-image";
import { TagList } from "@/components/features/library/filter-chips";
import { Markdown } from "@/components/features/markdown";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "식재료" };

const SECTIONS = [
  { key: "benefits", title: "이런 점이 좋아요" },
  { key: "how_to_use", title: "이렇게 먹어요" },
  { key: "caution", title: "알아 두세요" },
] as const;

export default async function IngredientDetailPage({ params }: PageProps<"/library/ingredients/[id]">) {
  await requireUserId();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await createClient();
  const { data: ingredient } = await supabase
    .from("ingredients")
    .select("*, recipe_ingredients(recipes(id, title, cook_minutes, image_path, is_published))")
    .eq("id", id)
    .maybeSingle();
  if (!ingredient) notFound();

  const recipes = ingredient.recipe_ingredients
    .flatMap((ri) => (ri.recipes ? [ri.recipes] : []))
    .filter((r) => r.is_published);

  return (
    <article className="flex flex-col gap-5">
      <BackLink href="/library/ingredients" label="식재료" />
      <ContentImage path={ingredient.image_path} alt={ingredient.name} className="aspect-[16/10] w-full rounded-xl" />
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">{ingredient.category}</p>
        <h1 className="text-2xl font-semibold">{ingredient.name}</h1>
        {ingredient.summary ? <p className="text-muted-foreground">{ingredient.summary}</p> : null}
        <TagList tags={ingredient.tags} />
      </header>

      {SECTIONS.map(({ key, title }) =>
        ingredient[key] ? (
          <section key={key} className="flex flex-col gap-2 rounded-xl border bg-card p-4">
            <h2 className="font-semibold">{title}</h2>
            <Markdown>{ingredient[key]}</Markdown>
          </section>
        ) : null,
      )}

      {recipes.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">이 재료로 만드는 레시피</h2>
          <ul className="flex flex-col gap-2">
            {recipes.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/library/recipes/${r.id}`}
                  className="flex min-h-16 items-center gap-3 rounded-xl border bg-card p-2 pr-4 transition-colors hover:bg-accent"
                >
                  <ContentImage path={r.image_path} alt="" className="size-12 shrink-0 rounded-lg" />
                  <span className="flex-1 font-medium">{r.title}</span>
                  {r.cook_minutes !== null ? (
                    <span className="text-sm text-muted-foreground">{r.cook_minutes}분</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
