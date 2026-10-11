import { TZDate } from "@date-fns/tz";
import { addDays, format, isValid, parse } from "date-fns";
import { ko } from "date-fns/locale";

export const APP_TIME_ZONE = "Asia/Seoul";
const DATE_FORMAT = "yyyy-MM-dd";

/** 서울 기준 오늘 날짜 (yyyy-MM-dd) */
export function todayInSeoul(now: Date = new Date()): string {
  return format(new TZDate(now, APP_TIME_ZONE), DATE_FORMAT);
}

export function isDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = parse(value, DATE_FORMAT, new Date());
  return isValid(parsed) && format(parsed, DATE_FORMAT) === value;
}

export function shiftDate(date: string, days: number): string {
  return format(addDays(parse(date, DATE_FORMAT, new Date()), days), DATE_FORMAT);
}

/** "10월 11일 (토)" */
export function formatKoreanDate(date: string): string {
  return format(parse(date, DATE_FORMAT, new Date()), "M월 d일 (EEE)", { locale: ko });
}

export function toDate(date: string): Date {
  return parse(date, DATE_FORMAT, new Date());
}

export function toDateString(date: Date): string {
  return format(date, DATE_FORMAT);
}
