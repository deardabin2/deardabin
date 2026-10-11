import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getIngredientOptions() {
  const supabase = await createClient();
  const { data } = await supabase.from("ingredients").select("id, name, is_published").order("name");
  return (data ?? []).map((i) => ({ id: i.id, name: i.name, isPublished: i.is_published }));
}

export async function getArticleCategories() {
  const supabase = await createClient();
  const { data } = await supabase.from("articles").select("category");
  return [...new Set((data ?? []).map((a) => a.category))].sort();
}
