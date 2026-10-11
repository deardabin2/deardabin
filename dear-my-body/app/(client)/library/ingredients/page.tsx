import type { Metadata } from "next";
import Link from "next/link";
import { BackLink } from "@/components/features/library/back-link";
import { ContentImage } from "@/components/features/library/content-image";
import { FilterChips, LibraryEmpty, TagList } from "@/components/features/library/filter-chips";
import { SearchForm } from "@/components/features/library/search-form";
import { requireUserId } from "@/lib/auth";
import { param, withParams } from "@/lib/search-params";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "식재료" };

export default async function IngredientsPage({ searchParams }: PageProps<"/library/ingredients">) {
  await requireUserId();
  const sp = await searchParams;
  const category = param(sp.category);
  const q = param(sp.q);

  const supabase = await createClient();
  const { data } = await supabase
    .from("ingredients")
    .select("id, name, category, tags, summary, image_path")
    .eq("is_published", true)
    .order("name");
  const all = data ?? [];

  const categories = [...new Set(all.map((i) => i.category))].sort();
  const keyword = q?.replace(/^#/, "").toLowerCase();
  const items = all.filter(
    (i) =>
      (!category || i.category === category) &&
      (!keyword ||
        i.name.toLowerCase().includes(keyword) ||
        i.tags.some((t) => t.toLowerCase().includes(keyword))),
  );

  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/library" label="라이브러리" />
      <h1 className="text-xl font-semibold">식재료</h1>

      <SearchForm
        action="/library/ingredients"
        name="q"
        defaultValue={q}
        placeholder="이름이나 태그로 찾기"
        label="식재료 검색"
        keep={{ category }}
      />
      {categories.length > 0 ? (
        <FilterChips
          label="분류"
          options={[
            { key: "all", label: "전체", href: withParams("/library/ingredients", { q }), active: !category },
            ...categories.map((c) => ({
              key: c,
              label: c,
              href: withParams("/library/ingredients", { category: c, q }),
              active: category === c,
            })),
          ]}
        />
      ) : null}

      {items.length === 0 ? (
        <LibraryEmpty>
          {all.length === 0 ? "아직 준비된 식재료가 없어요. 곧 채워 둘게요." : "조건에 맞는 식재료가 없어요."}
        </LibraryEmpty>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {items.map((i) => (
            <li key={i.id}>
              <Link
                href={`/library/ingredients/${i.id}`}
                className="flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:bg-accent"
              >
                <ContentImage path={i.image_path} alt="" className="aspect-[4/3] w-full" />
                <div className="flex flex-1 flex-col gap-1.5 p-3">
                  <p className="text-xs text-muted-foreground">{i.category}</p>
                  <p className="font-semibold">{i.name}</p>
                  {i.summary ? <p className="line-clamp-2 text-sm text-muted-foreground">{i.summary}</p> : null}
                  <TagList tags={i.tags.slice(0, 3)} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
