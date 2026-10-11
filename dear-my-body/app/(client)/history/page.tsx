import type { Metadata } from "next";
import { HistoryCalendar } from "@/components/features/history/history-calendar";
import { requireConsentedProfile } from "@/lib/auth";
import { monthRange, parseMonthParam } from "@/lib/calendar";
import { todayInSeoul } from "@/lib/date";
import { hasAnyRecord } from "@/lib/records";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "기록 달력" };

export default async function HistoryPage({ searchParams }: PageProps<"/history">) {
  const profile = await requireConsentedProfile();
  const { month: monthParam } = await searchParams;
  const today = todayInSeoul();
  const month = parseMonthParam(monthParam, today);
  const { start, end } = monthRange(month);

  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("daily_logs")
    .select("*, meals(description, photo_path), behavior_checks(id)")
    .eq("user_id", profile.id)
    .gte("log_date", start)
    .lte("log_date", end);

  const recordedDates = (logs ?? []).filter(hasAnyRecord).map((l) => l.log_date);

  return <HistoryCalendar month={month} today={today} recordedDates={recordedDates} />;
}
