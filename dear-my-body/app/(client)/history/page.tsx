import type { Metadata } from "next";
import { HistoryCalendar } from "@/components/features/history/history-calendar";
import { requireConsentedProfile } from "@/lib/auth";
import { parseMonthParam } from "@/lib/calendar";
import { todayInSeoul } from "@/lib/date";
import { getRecordedDates } from "@/lib/history-data";

export const metadata: Metadata = { title: "기록 달력" };

export default async function HistoryPage({ searchParams }: PageProps<"/history">) {
  const profile = await requireConsentedProfile();
  const { month: monthParam } = await searchParams;
  const today = todayInSeoul();
  const month = parseMonthParam(monthParam, today);
  const recordedDates = await getRecordedDates(profile.id, month);

  return <HistoryCalendar month={month} today={today} recordedDates={recordedDates} />;
}
