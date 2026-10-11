import type { Metadata } from "next";
import { ContentList } from "@/components/features/admin/content-list";
import { requireCoach } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "식재료 관리" };

export default async function AdminIngredientsPage() {
  await requireCoach();
  const supabase = await createClient();
  const { data } = await supabase.from("ingredients").select("id, name, category, is_published").order("name");
  return (
    <ContentList
      title="식재료"
      table="ingredients"
      basePath="/admin/ingredients"
      rows={(data ?? []).map((i) => ({ id: i.id, title: i.name, subtitle: i.category, isPublished: i.is_published }))}
    />
  );
}
