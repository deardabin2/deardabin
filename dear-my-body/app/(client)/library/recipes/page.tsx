import type { Metadata } from "next";
import Link from "next/link";
import { Clock } from "lucide-react";
import { BackLink } from "@/components/features/library/back-link";
import { ContentImage } from "@/components/features/library/content-image";
import { FilterChips, LibraryEmpty, TagList } from "@/components/features/library/filter-chips";
import { requireUserId } from "@/lib/auth";
import { COOK_TIME_FILTERS } from "@/lib/recipe";
import { param, withParams } from "@/lib/search-params";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "레시피" };

export default async function RecipesPage({ searchParams }: PageProps<"/library/recipes">) {
  await requireUserId();
  const sp = await searchParams;
  const tag = param(sp.tag);
  const time = COOK_TIME_FILTERS.find((f) => f.key === param(sp.time));

  const supabase = await createClient();
  const { data } = await supabase
    .from("recipes")
    .select("id, title, summary, servings, cook_minutes, tags, image_path")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  const all = data ?? [];

  const tags = [...new Set(all.flatMap((r) => r.tags))].sort();
  const items = all.filter(
    (r) =>
      (!tag || r.tags.includes(tag)) &&
      (!time || (r.cook_minutes !== null && r.cook_minutes <= time.max)),
  );

  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/library" label="라이브러리" />
      <h1 className="text-xl font-semibold">레시피</h1>

      <FilterChips
        label="조리 시간"
        options={[
          { key: "all", label: "시간 전체", href: withParams("/library/recipes", { tag }), active: !time },
          ...COOK_TIME_FILTERS.map((f) => ({
            key: f.key,
            label: f.label,
            href: withParams("/library/recipes", { tag, time: f.key }),
            active: time?.key === f.key,
          })),
        ]}
      />
      {tags.length > 0 ? (
        <FilterChips
          label="태그"
          options={[
            { key: "all", label: "태그 전체", href: withParams("/library/recipes", { time: time?.key }), active: !tag },
            ...tags.map((t) => ({
              key: t,
              label: `#${t}`,
              href: withParams("/library/recipes", { tag: t, time: time?.key }),
              active: tag === t,
            })),
          ]}
        />
      ) : null}

      {items.length === 0 ? (
        <LibraryEmpty>
          {all.length === 0 ? "아직 준비된 레시피가 없어요. 곧 채워 둘게요." : "조건에 맞는 레시피가 없어요."}
        </LibraryEmpty>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((r) => (
            <li key={r.id}>
              <Link
                href={`/library/recipes/${r.id}`}
                className="flex gap-3 overflow-hidden rounded-xl border bg-card p-3 transition-colors hover:bg-accent"
              >
                <ContentImage path={r.image_path} alt="" className="size-24 shrink-0 rounded-lg" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <p className="font-semibold">{r.title}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3.5" aria-hidden />
                    {r.cook_minutes !== null ? `${r.cook_minutes}분` : "시간 미정"} · {r.servings}인분
                  </p>
                  {r.summary ? <p className="line-clamp-2 text-sm text-muted-foreground">{r.summary}</p> : null}
                  <TagList tags={r.tags.slice(0, 3)} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
