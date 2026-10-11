import { NextResponse, type NextRequest } from "next/server";
import { buildDailyLogCsv, toCsv } from "@/lib/csv";
import { todayInSeoul } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";

// 내 데이터 CSV 내보내기. 코치라도 본인 데이터만 받도록 user_id 로 한 번 더 거른다
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return NextResponse.redirect(new URL("/login", request.url));

  const type = request.nextUrl.searchParams.get("type") === "goals" ? "goals" : "logs";
  const stamp = todayInSeoul().replaceAll("-", "");

  const { data: goals, error: goalsError } = await supabase
    .from("goals")
    .select("*, behavior_goals(id, title, kind, target_value, unit, sort_order, archived_at)")
    .eq("user_id", userId)
    .order("start_date");
  if (goalsError) return new NextResponse("내보내기에 실패했어요. 잠시 후 다시 시도해 주세요.", { status: 500 });

  let csv: string;
  if (type === "goals") {
    csv = toCsv(
      ["시작일", "마치는 날", "시작 체중(kg)", "목표 체중(kg)", "동기", "상태", "행동 목표"],
      (goals ?? []).map((g) => [
        g.start_date,
        g.end_date,
        g.start_weight,
        g.target_weight,
        g.motivation || null,
        g.status === "active" ? "진행 중" : "마침",
        [...g.behavior_goals]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(
            (b) =>
              `${b.title}${b.kind === "number" ? ` (하루 ${b.target_value}${b.unit ?? ""})` : ""}${b.archived_at ? " [뺌]" : ""}`,
          )
          .join(" / ") || null,
      ]),
    );
  } else {
    const { data: logs, error } = await supabase
      .from("daily_logs")
      .select(
        "*, meals(meal_type, description, eaten_at, photo_path), behavior_checks(behavior_goal_id, value), coach_comments(body, created_at)",
      )
      .eq("user_id", userId)
      .order("log_date");
    if (error) return new NextResponse("내보내기에 실패했어요. 잠시 후 다시 시도해 주세요.", { status: 500 });
    const behaviorGoals = (goals ?? []).flatMap((g) =>
      [...g.behavior_goals].sort((a, b) => a.sort_order - b.sort_order).map((b) => ({ id: b.id, title: b.title })),
    );
    csv = buildDailyLogCsv(logs ?? [], behaviorGoals);
  }

  const filename = `dear-my-body-${type === "goals" ? "goals" : "daily-logs"}-${stamp}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
