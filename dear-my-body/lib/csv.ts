export type CsvCell = string | number | null | undefined;

/**
 * 엑셀에서 열었을 때 수식으로 실행되지 않도록 =,+,-,@ 등으로 시작하는 글은 앞에 ' 를 붙인다.
 * 숫자 셀은 그대로 둔다.
 */
function escapeCell(cell: CsvCell): string {
  if (cell === null || cell === undefined) return "";
  if (typeof cell === "number") return String(cell);
  let text = cell;
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

/** 한글이 엑셀에서 깨지지 않도록 UTF-8 BOM 을 붙인다 */
export function toCsv(header: string[], rows: CsvCell[][]): string {
  const lines = [header, ...rows].map((row) => row.map(escapeCell).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}

export const MEAL_COLUMNS = [
  ["breakfast", "아침"],
  ["lunch", "점심"],
  ["dinner", "저녁"],
  ["snack", "간식"],
] as const;

type ExportLog = {
  log_date: string;
  weight: number | null;
  water_ml: number | null;
  sleep_hours: number | null;
  steps: number | null;
  exercise_note: string | null;
  hunger: number | null;
  energy: number | null;
  mood: number | null;
  digestion: number | null;
  note: string | null;
  meals: { meal_type: string; description: string; eaten_at: string | null; photo_path: string | null }[];
  behavior_checks: { behavior_goal_id: string; value: number }[];
  coach_comments: { body: string; created_at: string }[];
};

/** 일일 기록 → 날짜당 한 줄. 행동 목표는 목표마다 한 열 */
export function buildDailyLogCsv(logs: ExportLog[], behaviorGoals: { id: string; title: string }[]): string {
  const header = [
    "날짜",
    "체중(kg)",
    "물(ml)",
    "수면(시간)",
    "걸음 수",
    "운동",
    "배고픔(1-5)",
    "에너지(1-5)",
    "기분(1-5)",
    "소화(1-5)",
    "메모",
    ...MEAL_COLUMNS.flatMap(([, label]) => [label, `${label} 시간`, `${label} 사진`]),
    ...behaviorGoals.map((g) => `행동 목표: ${g.title}`),
    "코치 코멘트",
  ];

  const rows = [...logs]
    .sort((a, b) => a.log_date.localeCompare(b.log_date))
    .map((log) => {
      const checks = new Map(log.behavior_checks.map((c) => [c.behavior_goal_id, Number(c.value)]));
      return [
        log.log_date,
        log.weight,
        log.water_ml,
        log.sleep_hours,
        log.steps,
        log.exercise_note,
        log.hunger,
        log.energy,
        log.mood,
        log.digestion,
        log.note,
        ...MEAL_COLUMNS.flatMap(([type]) => {
          const meal = log.meals.find((m) => m.meal_type === type);
          return [meal?.description || null, meal?.eaten_at?.slice(0, 5) ?? null, meal?.photo_path ? "있음" : null];
        }),
        ...behaviorGoals.map((g) => checks.get(g.id) ?? null),
        [...log.coach_comments]
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
          .map((c) => c.body)
          .join(" / ") || null,
      ];
    });

  return toCsv(header, rows);
}
