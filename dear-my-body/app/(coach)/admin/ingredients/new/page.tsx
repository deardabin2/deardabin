import type { Metadata } from "next";
import { EditorPage } from "@/components/features/admin/editor-page";
import { IngredientForm } from "@/components/features/admin/ingredient-form";
import { requireCoach } from "@/lib/auth";

export const metadata: Metadata = { title: "새 식재료" };

export default async function NewIngredientPage() {
  await requireCoach();
  return (
    <EditorPage backHref="/admin/ingredients" backLabel="식재료 목록" title="새 식재료">
      <IngredientForm
        id={null}
        defaultValues={{
          name: "",
          category: "",
          tags: "",
          summary: "",
          benefits: "",
          howToUse: "",
          caution: "",
          imagePath: null,
          isPublished: false,
        }}
      />
    </EditorPage>
  );
}
