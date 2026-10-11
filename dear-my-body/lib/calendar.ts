import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";

/** "2026-10" 형식. 잘못됐거나 미래 달이면 이번 달 */
export function parseMonthParam(value: unknown, today: string): string {
  const current = today.slice(0, 7);
  if (typeof value !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return current;
  return value > current ? current : value;
}

export function shiftMonth(month: string, amount: number): string {
  return format(addMonths(parse(month, "yyyy-MM", new Date()), amount), "yyyy-MM");
}

export function monthRange(month: string) {
  const first = parse(month, "yyyy-MM", new Date());
  return {
    start: format(startOfMonth(first), "yyyy-MM-dd"),
    end: format(endOfMonth(first), "yyyy-MM-dd"),
  };
}

/** 일요일부터 시작하는 달력 칸. 이번 달이 아닌 칸은 null */
export function monthGrid(month: string): (string | null)[] {
  const first = parse(month, "yyyy-MM", new Date());
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(first)),
    end: endOfWeek(endOfMonth(first)),
  });
  return days.map((d) => (format(d, "yyyy-MM") === month ? format(d, "yyyy-MM-dd") : null));
}
