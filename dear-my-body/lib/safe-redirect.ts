/** 외부 사이트로 튕기는 오픈 리다이렉트를 막는다 */
export function safeNextPath(next: unknown, fallback = "/"): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
