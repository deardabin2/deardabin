import type { Metadata } from "next";
import { ContentList } from "@/components/features/admin/content-list";
import { requireCoach } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "레시피 관리" };

export default async function AdminRecipesPage() {
  await requireCoach();
  const supabase = await createClient();
  const { data } = await supabase
    .from("recipes")
    .select("id, title, servings, cook_minutes, is_published")
    .order("created_at", { ascending: false });
  return (
    <ContentList
      title="레시피"
      table="recipes"
      basePath="/admin/recipes"
      rows={(data ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        subtitle: `${r.servings}인분${r.cook_minutes !== null ? ` · ${r.cook_minutes}분` : ""}`,
        isPublished: r.is_published,
      }))}
    />
  );
}
