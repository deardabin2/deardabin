import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/features/library/back-link";
import { Markdown } from "@/components/features/markdown";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "기초지식" };

export default async function ArticlePage({ params }: PageProps<"/library/knowledge/[id]">) {
  await requireUserId();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await createClient();
  const { data: article } = await supabase.from("articles").select("*").eq("id", id).maybeSingle();
  if (!article) notFound();

  return (
    <article className="flex flex-col gap-4">
      <BackLink href="/library/knowledge" label="기초지식" />
      <header>
        <p className="text-sm text-muted-foreground">{article.category}</p>
        <h1 className="mt-1 text-2xl font-semibold">{article.title}</h1>
      </header>
      <Markdown>{article.body}</Markdown>
    </article>
  );
}
