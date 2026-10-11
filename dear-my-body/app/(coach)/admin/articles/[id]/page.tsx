import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleForm } from "@/components/features/admin/article-form";
import { EditorPage, UUID_PATTERN } from "@/components/features/admin/editor-page";
import { getArticleCategories } from "@/lib/admin-content";
import { requireCoach } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "글 수정" };

export default async function EditArticlePage({ params }: PageProps<"/admin/articles/[id]">) {
  await requireCoach();
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();
  const supabase = await createClient();
  const { data: a } = await supabase.from("articles").select("*").eq("id", id).maybeSingle();
  if (!a) notFound();

  return (
    <EditorPage backHref="/admin/articles" backLabel="글 목록" title="글 수정" previewHref={`/library/knowledge/${id}`}>
      <ArticleForm
        id={id}
        categories={await getArticleCategories()}
        defaultValues={{
          title: a.title,
          category: a.category,
          body: a.body,
          sortOrder: String(a.sort_order),
          isPublished: a.is_published,
        }}
      />
    </EditorPage>
  );
}
