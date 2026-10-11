import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorPage, UUID_PATTERN } from "@/components/features/admin/editor-page";
import { IngredientForm } from "@/components/features/admin/ingredient-form";
import { requireCoach } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "식재료 수정" };

export default async function EditIngredientPage({ params }: PageProps<"/admin/ingredients/[id]">) {
  await requireCoach();
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();
  const supabase = await createClient();
  const { data: i } = await supabase.from("ingredients").select("*").eq("id", id).maybeSingle();
  if (!i) notFound();

  return (
    <EditorPage backHref="/admin/ingredients" backLabel="식재료 목록" title="식재료 수정" previewHref={`/library/ingredients/${id}`}>
      <IngredientForm
        id={id}
        defaultValues={{
          name: i.name,
          category: i.category,
          tags: i.tags.join(", "),
          summary: i.summary,
          benefits: i.benefits,
          howToUse: i.how_to_use,
          caution: i.caution,
          imagePath: i.image_path,
          isPublished: i.is_published,
        }}
      />
    </EditorPage>
  );
}
