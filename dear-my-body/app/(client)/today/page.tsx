import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TodayLogger } from "@/components/features/today/today-logger";
import type { MealState, TodayData } from "@/components/features/today/types";
import { requireConsentedProfile } from "@/lib/auth";
import { isDateString, todayInSeoul } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { MEAL_TYPES, type MealType } from "@/lib/validations/daily-log";

export const metadata: Metadata = { title: "오늘 기록" };

const SIGNED_URL_SECONDS = 60 * 60;

export default async function TodayPage({ searchParams }: PageProps<"/today">) {
  const profile = await requireConsentedProfile();
  const { date } = await searchParams;
  const today = todayInSeoul();

  const requested = typeof date === "string" && isDateString(date) ? date : today;
  if (requested > today) redirect("/today");
  const logDate = requested;

  const supabase = await createClient();
  const [{ data: log }, { data: goal }] = await Promise.all([
    supabase
      .from("daily_logs")
      .select(
        "*, meals(*), behavior_checks(behavior_goal_id, value), coach_comments(id, body, created_at, coach:profiles(display_name))",
      )
      .eq("user_id", profile.id)
      .eq("log_date", logDate)
      .maybeSingle(),
    supabase
      .from("goals")
      .select("id, behavior_goals(id, title, kind, target_value, unit, sort_order, archived_at)")
      .eq("user_id", profile.id)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  const checks = Object.fromEntries(
    (log?.behavior_checks ?? []).map((c) => [c.behavior_goal_id, Number(c.value)]),
  );

  // 지금 진행 중인 행동 목표 + 그날 체크했지만 지금은 빠진 행동 목표
  const activeBehaviorGoals = (goal?.behavior_goals ?? [])
    .filter((b) => b.archived_at === null || b.id in checks)
    .sort((a, b) => a.sort_order - b.sort_order);
  const shownIds = new Set(activeBehaviorGoals.map((b) => b.id));
  const missingIds = Object.keys(checks).filter((id) => !shownIds.has(id));
  const { data: pastBehaviorGoals } = missingIds.length
    ? await supabase
        .from("behavior_goals")
        .select("id, title, kind, target_value, unit, sort_order, archived_at")
        .in("id", missingIds)
    : { data: [] };

  const mealRows = log?.meals ?? [];
  const photoPaths = mealRows.flatMap((m) => (m.photo_path ? [m.photo_path] : []));
  const signedUrls = new Map<string, string>();
  if (photoPaths.length) {
    const { data: signed } = await supabase.storage
      .from("meal-photos")
      .createSignedUrls(photoPaths, SIGNED_URL_SECONDS);
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) signedUrls.set(s.path, s.signedUrl);
    }
  }

  const meals = Object.fromEntries(
    MEAL_TYPES.map((type) => {
      const row = mealRows.find((m) => m.meal_type === type);
      const state: MealState = {
        description: row?.description ?? "",
        eatenAt: row?.eaten_at ? row.eaten_at.slice(0, 5) : null,
        photoPath: row?.photo_path ?? null,
        photoUrl: row?.photo_path ? (signedUrls.get(row.photo_path) ?? null) : null,
      };
      return [type, state];
    }),
  ) as Record<MealType, MealState>;

  const data: TodayData = {
    userId: profile.id,
    logDate,
    today,
    hasActiveGoal: Boolean(goal),
    log: {
      weight: log?.weight ?? null,
      water_ml: log?.water_ml ?? null,
      sleep_hours: log?.sleep_hours ?? null,
      steps: log?.steps ?? null,
      exercise_note: log?.exercise_note ?? null,
      hunger: log?.hunger ?? null,
      energy: log?.energy ?? null,
      mood: log?.mood ?? null,
      digestion: log?.digestion ?? null,
      note: log?.note ?? null,
    },
    meals,
    checks,
    coachComments: (log?.coach_comments ?? [])
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((c) => ({ id: c.id, body: c.body, createdAt: c.created_at, coachName: c.coach?.display_name ?? null })),
    behaviorGoals: [...activeBehaviorGoals, ...(pastBehaviorGoals ?? [])].map((b) => ({
      id: b.id,
      title: b.title,
      kind: b.kind === "number" ? "number" : "check",
      targetValue: b.target_value,
      unit: b.unit,
    })),
  };

  return <TodayLogger key={logDate} data={data} />;
}
