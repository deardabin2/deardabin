import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireCoach } from "@/lib/auth";
import { formatKoreanDate, shiftDate, todayInSeoul } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { weekStartOf } from "@/lib/trends";

export const metadata: Metadata = { title: "고객" };

const RECENT_DAYS = 30;

export default async function ClientsPage() {
  await requireCoach();
  const today = todayInSeoul();
  const weekStart = weekStartOf(today);
  const supabase = await createClient();

  const [{ data: clients }, { data: logs }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, created_at, sensitive_consent_at")
      .eq("role", "client")
      .order("created_at", { ascending: false }),
    supabase
      .from("daily_logs")
      .select("user_id, log_date")
      .gte("log_date", shiftDate(today, -(RECENT_DAYS - 1)))
      .order("log_date", { ascending: false }),
  ]);

  const lastLog = new Map<string, string>();
  const weekDays = new Map<string, number>();
  for (const l of logs ?? []) {
    if (!lastLog.has(l.user_id)) lastLog.set(l.user_id, l.log_date);
    if (l.log_date >= weekStart) weekDays.set(l.user_id, (weekDays.get(l.user_id) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">고객</h1>
        <p className="text-sm text-muted-foreground">{clients?.length ?? 0}명</p>
      </div>
      {!clients || clients.length === 0 ? (
        <p className="rounded-xl bg-muted px-4 py-10 text-center text-sm text-muted-foreground">
          아직 가입한 고객이 없어요.
        </p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {clients.map((c) => {
            const last = lastLog.get(c.id);
            return (
              <li key={c.id}>
                <Link
                  href={`/admin/clients/${c.id}`}
                  className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-accent"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="truncate font-medium">{c.display_name || "이름 없음"}</p>
                    <p className="text-xs text-muted-foreground">
                      {!c.sensitive_consent_at
                        ? "건강정보 동의 전"
                        : last
                          ? `최근 기록 ${formatKoreanDate(last)} · 이번 주 ${weekDays.get(c.id) ?? 0}일`
                          : `최근 ${RECENT_DAYS}일 기록 없음`}
                    </p>
                  </div>
                  <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
