/** searchParams 값을 문자열 하나로 (배열이면 첫 값) */
export function param(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  const trimmed = v?.trim();
  return trimmed ? trimmed.slice(0, 50) : undefined;
}

export function withParams(path: string, params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) search.set(k, v);
  const s = search.toString();
  return s ? `${path}?${s}` : path;
}
