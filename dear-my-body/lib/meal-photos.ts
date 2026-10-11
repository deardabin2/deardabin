import "server-only";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;
const BUCKET = "meal-photos";

/** 사용자 폴더 아래 모든 식사 사진 경로 ({userId}/{날짜}/{파일}) */
async function listAllMealPhotos(supabase: Supabase, userId: string): Promise<string[]> {
  const { data: folders, error } = await supabase.storage.from(BUCKET).list(userId, { limit: 1000 });
  if (error) throw error;
  const paths: string[] = [];
  for (const folder of folders ?? []) {
    // id 가 없으면 폴더(날짜), 있으면 파일
    if (folder.id) {
      paths.push(`${userId}/${folder.name}`);
      continue;
    }
    const { data: files, error: fileError } = await supabase.storage
      .from(BUCKET)
      .list(`${userId}/${folder.name}`, { limit: 1000 });
    if (fileError) throw fileError;
    for (const f of files ?? []) if (f.id) paths.push(`${userId}/${folder.name}/${f.name}`);
  }
  return paths;
}

export async function removeAllMealPhotos(supabase: Supabase, userId: string) {
  const paths = await listAllMealPhotos(supabase, userId);
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await supabase.storage.from(BUCKET).remove(paths.slice(i, i + 100));
    if (error) throw error;
  }
}
