export function formatShortDate(date: string) {
  const [, m, d] = date.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export function formatNumber(value: number, digits = 1) {
  return value.toLocaleString("ko-KR", { maximumFractionDigits: digits });
}

export function formatCompact(value: number) {
  if (Math.abs(value) >= 1000) return `${formatNumber(value / 1000, 1)}K`;
  return formatNumber(value, 1);
}

export function formatPercent(rate: number) {
  return `${Math.round(rate * 100)}%`;
}

/** 감량·증량 모두 같은 톤으로. 부호만 붙인다 */
export function formatSignedKg(diff: number) {
  if (diff === 0) return "변화 없음";
  return `${diff > 0 ? "+" : "−"}${formatNumber(Math.abs(diff), 1)}kg`;
}
