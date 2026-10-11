import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { CommentPanel } from "@/components/features/admin/comment-panel";
import { BackLink } from "@/components/features/library/back-link";
import { MEAL_LABELS } from "@/components/features/today/types";
import { Button } from "@/components/ui/button";
import { getClientProfile } from "@/lib/admin-data";
import { requireCoach } from "@/lib/auth";
import { formatInTimeZone, formatKoreanDate, isDateString, shiftDate, todayInSeoul } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { isAchieved } from "@/lib/trends";
import { MEAL_TYPES } from "@/lib/validations/daily-log";

export const metadata: Metadata = { title: "고객 일일 기록" };

const CONDITIONS = [
  { key: "hunger", label: "배고픔" },
  { key: "energy", label: "에너지" },
  { key: "mood", label: "기분" },
  { key: "digestion", label: "소화" },
] as const;

export default async function ClientLogPage({ params }: PageProps<"/admin/clients/[id]/logs/[date]">) {
  const coach = await requireCoach();
  const { id, date } = await params;
  const today = todayInSeoul();
  if (!isDateString(date) || date > today) notFound();
  const client = await getClientProfile(id);
  const supabase = await createClient();

  const { data: log } = await supabase
    .from("daily_logs")
    .select(
      "*, meals(*), behavior_checks(behavior_goal_id, value, behavior_goals(title, kind, target_value, unit)), coach_comments(id, body, created_at, coach_id, coach:profiles(display_name))",
    )
    .eq("user_id", id)
    .eq("log_date", date)
    .maybeSingle();

  const photoPaths = (log?.meals ?? []).flatMap((m) => (m.photo_path ? [m.photo_path] : []));
  const signed = new Map<string, string>();
  if (photoPaths.length) {
    const { data } = await supabase.storage.from("meal-photos").createSignedUrls(photoPaths, 60 * 60);
    for (const s of data ?? []) if (s.path && s.signedUrl) signed.set(s.path, s.signedUrl);
  }

  const name = client.display_name || "이름 없음";
  const prev = shiftDate(date, -1);
  const next = shiftDate(date, 1);
  const metrics = log
    ? [
        { label: "체중", value: log.weight !== null ? `${log.weight}kg` : null },
        { label: "물", value: log.water_ml !== null ? `${log.water_ml.toLocaleString("ko-KR")}ml` : null },
        { label: "수면", value: log.sleep_hours !== null ? `${log.sleep_hours}시간` : null },
        { label: "걸음 수", value: log.steps !== null ? `${log.steps.toLocaleString("ko-KR")}걸음` : null },
      ]
    : [];

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <BackLink href={`/admin/clients/${id}?month=${date.slice(0, 7)}`} label={`${name} 님 달력`} />
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/admin/clients/${id}/logs/${prev}`} aria-label="전날 기록">
            <ChevronLeft aria-hidden />
          </Link>
        </Button>
        <h1 className="text-center text-lg font-semibold">
          <span className="block text-sm font-normal text-muted-foreground">{name} 님</span>
          {formatKoreanDate(date)}
        </h1>
        {next > today ? (
          <Button variant="ghost" size="icon" disabled aria-label="다음 날 (아직 오지 않았어요)">
            <ChevronRight aria-hidden />
          </Button>
        ) : (
          <Button asChild variant="ghost" size="icon">
            <Link href={`/admin/clients/${id}/logs/${next}`} aria-label="다음 날 기록">
              <ChevronRight aria-hidden />
            </Link>
          </Button>
        )}
      </div>

      {!log ? (
        <p className="rounded-xl bg-muted px-4 py-10 text-center text-sm text-muted-foreground">
          이날은 남긴 기록이 없어요. 기록이 있는 날에 코멘트를 남길 수 있어요.
        </p>
      ) : (
        <>
          <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
            <h2 className="font-semibold">식사</h2>
            {MEAL_TYPES.map((type) => {
              const meal = log.meals.find((m) => m.meal_type === type);
              const photo = meal?.photo_path ? signed.get(meal.photo_path) : undefined;
              return (
                <div key={type} className="flex flex-col gap-2 border-t pt-3 first:border-t-0 first:pt-0">
                  <p className="text-sm font-medium">
                    {MEAL_LABELS[type]}
                    {meal?.eaten_at ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">{meal.eaten_at.slice(0, 5)}</span>
                    ) : null}
                  </p>
                  {meal?.description ? (
                    <p className="text-sm whitespace-pre-line">{meal.description}</p>
                  ) : !photo ? (
                    <p className="text-sm text-muted-foreground">기록 없음</p>
                  ) : null}
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt={`${MEAL_LABELS[type]} 사진`} className="aspect-[4/3] w-full rounded-lg object-cover" />
                  ) : null}
                </div>
              );
            })}
          </section>

          <section className="grid grid-cols-2 gap-3">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-xl border bg-card p-3">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="mt-1 font-semibold">{m.value ?? "–"}</p>
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-2 rounded-xl border bg-card p-4">
            <h2 className="font-semibold">컨디션</h2>
            <dl className="grid grid-cols-4 gap-2 text-center">
              {CONDITIONS.map((c) => (
                <div key={c.key}>
                  <dt className="text-xs text-muted-foreground">{c.label}</dt>
                  <dd className="mt-1 font-semibold">{log[c.key] ?? "–"}</dd>
                </div>
              ))}
            </dl>
          </section>

          {log.behavior_checks.length > 0 ? (
            <section className="flex flex-col gap-2 rounded-xl border bg-card p-4">
              <h2 className="font-semibold">행동 목표</h2>
              <ul className="flex flex-col gap-1.5 text-sm">
                {log.behavior_checks.map((c) => {
                  const g = c.behavior_goals;
                  if (!g) return null;
                  const done = isAchieved(
                    { kind: g.kind === "number" ? "number" : "check", targetValue: g.target_value },
                    Number(c.value),
                  );
                  return (
                    <li key={c.behavior_goal_id} className="flex items-center gap-2">
                      <Check className={done ? "size-4 text-primary" : "size-4 text-muted-foreground/40"} aria-hidden />
                      <span className="flex-1">{g.title}</span>
                      {g.kind === "number" ? (
                        <span className="text-muted-foreground">
                          {Number(c.value)} / {g.target_value}
                          {g.unit}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {log.exercise_note || log.note ? (
            <section className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-sm">
              {log.exercise_note ? (
                <div>
                  <h2 className="font-semibold">운동</h2>
                  <p className="mt-1 whitespace-pre-line">{log.exercise_note}</p>
                </div>
              ) : null}
              {log.note ? (
                <div>
                  <h2 className="font-semibold">메모</h2>
                  <p className="mt-1 whitespace-pre-line">{log.note}</p>
                </div>
              ) : null}
            </section>
          ) : null}

          <CommentPanel
            dailyLogId={log.id}
            comments={log.coach_comments
              .sort((a, b) => a.created_at.localeCompare(b.created_at))
              .map((c) => ({
                id: c.id,
                body: c.body,
                createdLabel: formatInTimeZone(c.created_at),
                coachName: c.coach?.display_name || "코치",
                mine: c.coach_id === coach.id,
              }))}
          />
        </>
      )}
    </div>
  );
}
