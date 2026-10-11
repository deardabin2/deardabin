import type { Metadata } from "next";
import { ClientHeader } from "@/components/features/admin/client-tabs";
import { HistoryCalendar } from "@/components/features/history/history-calendar";
import { getClientProfile } from "@/lib/admin-data";
import { requireCoach } from "@/lib/auth";
import { parseMonthParam } from "@/lib/calendar";
import { todayInSeoul } from "@/lib/date";
import { getRecordedDates } from "@/lib/history-data";

export const metadata: Metadata = { title: "고객 기록" };

export default async function ClientCalendarPage({ params, searchParams }: PageProps<"/admin/clients/[id]">) {
  await requireCoach();
  const { id } = await params;
  const { month: monthParam } = await searchParams;
  const client = await getClientProfile(id);
  const today = todayInSeoul();
  const month = parseMonthParam(monthParam, today);
  const recordedDates = await getRecordedDates(id, month);
  const name = client.display_name || "이름 없음";

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5">
      <ClientHeader clientId={id} name={name} active="calendar" />
      <HistoryCalendar
        month={month}
        today={today}
        recordedDates={recordedDates}
        title={`${name} 님의`}
        dayHref={(date) => `/admin/clients/${id}/logs/${date}`}
        monthHref={(m) => `/admin/clients/${id}?month=${m}`}
      />
    </div>
  );
}
