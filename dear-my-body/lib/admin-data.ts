import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getClientProfile(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .eq("id", id)
    .eq("role", "client")
    .maybeSingle();
  if (!data) notFound();
  return data;
}
