import type { Metadata } from "next";
import { EditorPage } from "@/components/features/admin/editor-page";
import { RecipeForm } from "@/components/features/admin/recipe-form";
import { getIngredientOptions } from "@/lib/admin-content";
import { requireCoach } from "@/lib/auth";

export const metadata: Metadata = { title: "새 레시피" };

export default async function NewRecipePage() {
  await requireCoach();
  return (
    <EditorPage backHref="/admin/recipes" backLabel="레시피 목록" title="새 레시피">
      <RecipeForm
        id={null}
        ingredientOptions={await getIngredientOptions()}
        defaultValues={{
          title: "",
          summary: "",
          servings: "1",
          cookMinutes: "",
          ingredients: [{ name: "", amount: "", unit: "" }],
          steps: [{ text: "" }],
          tags: "",
          nutritionNote: "",
          imagePath: null,
          isPublished: false,
          ingredientIds: [],
        }}
      />
    </EditorPage>
  );
}
