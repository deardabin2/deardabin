import "server-only";
import { monthRange } from "@/lib/calendar";
import { hasAnyRecord } from "@/lib/records";
import { createClient } from "@/lib/supabase/server";

/** 그 달에 무엇이든 기록한 날짜들. 고객 본인과 코치 화면이 함께 쓴다 (권한은 RLS) */
export async function getRecordedDates(userId: string, month: string): Promise<string[]> {
  const { start, end } = monthRange(month);
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("daily_logs")
    .select("*, meals(description, photo_path), behavior_checks(id)")
    .eq("user_id", userId)
    .gte("log_date", start)
    .lte("log_date", end);
  return (logs ?? []).filter(hasAnyRecord).map((l) => l.log_date);
}
