import type { Metadata } from "next";
import { ContentList } from "@/components/features/admin/content-list";
import { requireCoach } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "글 관리" };

export default async function AdminArticlesPage() {
  await requireCoach();
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("id, title, category, sort_order, is_published")
    .order("category")
    .order("sort_order");
  return (
    <ContentList
      title="글"
      table="articles"
      basePath="/admin/articles"
      rows={(data ?? []).map((a) => ({
        id: a.id,
        title: a.title,
        subtitle: `${a.category} · 순서 ${a.sort_order}`,
        isPublished: a.is_published,
      }))}
    />
  );
}
