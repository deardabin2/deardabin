import type { Metadata } from "next";
import { ArticleForm } from "@/components/features/admin/article-form";
import { EditorPage } from "@/components/features/admin/editor-page";
import { getArticleCategories } from "@/lib/admin-content";
import { requireCoach } from "@/lib/auth";

export const metadata: Metadata = { title: "새 글" };

export default async function NewArticlePage() {
  await requireCoach();
  return (
    <EditorPage backHref="/admin/articles" backLabel="글 목록" title="새 글">
      <ArticleForm
        id={null}
        categories={await getArticleCategories()}
        defaultValues={{ title: "", category: "", body: "", sortOrder: "0", isPublished: false }}
      />
    </EditorPage>
  );
}
