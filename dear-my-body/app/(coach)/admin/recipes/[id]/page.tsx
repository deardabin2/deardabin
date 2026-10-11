import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorPage, UUID_PATTERN } from "@/components/features/admin/editor-page";
import { RecipeForm } from "@/components/features/admin/recipe-form";
import { getIngredientOptions } from "@/lib/admin-content";
import { requireCoach } from "@/lib/auth";
import { parseRecipeIngredients, parseRecipeSteps } from "@/lib/recipe";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "레시피 수정" };

export default async function EditRecipePage({ params }: PageProps<"/admin/recipes/[id]">) {
  await requireCoach();
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();
  const supabase = await createClient();
  const { data: r } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(ingredient_id)")
    .eq("id", id)
    .maybeSingle();
  if (!r) notFound();

  return (
    <EditorPage backHref="/admin/recipes" backLabel="레시피 목록" title="레시피 수정" previewHref={`/library/recipes/${id}`}>
      <RecipeForm
        id={id}
        ingredientOptions={await getIngredientOptions()}
        defaultValues={{
          title: r.title,
          summary: r.summary,
          servings: String(r.servings),
          cookMinutes: r.cook_minutes ?? "",
          ingredients: parseRecipeIngredients(r.ingredients).map((i) => ({
            name: i.name,
            amount: i.amount ?? "",
            unit: i.unit,
          })),
          steps: parseRecipeSteps(r.steps),
          tags: r.tags.join(", "),
          nutritionNote: r.nutrition_note,
          imagePath: r.image_path,
          isPublished: r.is_published,
          ingredientIds: r.recipe_ingredients.map((ri) => ri.ingredient_id),
        }}
      />
    </EditorPage>
  );
}
