import { getSupabaseEnv } from "@/lib/supabase/env";

export const CONTENT_IMAGE_BUCKET = "content-images";

/** 공개 버킷이라 서명 없이 주소만 만든다 */
export function contentImageUrl(path: string | null): string | null {
  if (!path) return null;
  const { url } = getSupabaseEnv();
  return `${url}/storage/v1/object/public/${CONTENT_IMAGE_BUCKET}/${path}`;
}
