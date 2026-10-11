import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BackLink } from "@/components/features/library/back-link";
import { LibraryEmpty } from "@/components/features/library/filter-chips";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "기초지식" };

export default async function KnowledgePage() {
  await requireUserId();
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("id, title, category, sort_order")
    .eq("is_published", true)
    .order("category")
    .order("sort_order")
    .order("title");

  const groups = new Map<string, { id: string; title: string }[]>();
  for (const a of data ?? []) groups.set(a.category, [...(groups.get(a.category) ?? []), a]);

  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/library" label="라이브러리" />
      <h1 className="text-xl font-semibold">기초지식</h1>
      {groups.size === 0 ? (
        <LibraryEmpty>아직 준비된 글이 없어요. 곧 채워 둘게요.</LibraryEmpty>
      ) : (
        [...groups].map(([category, articles]) => (
          <section key={category} className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-muted-foreground">{category}</h2>
            <ul className="divide-y overflow-hidden rounded-xl border bg-card">
              {articles.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/library/knowledge/${a.id}`}
                    className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 hover:bg-accent"
                  >
                    <span>{a.title}</span>
                    <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
