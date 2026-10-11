type LogLike = {
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
  meals?: { description: string; photo_path: string | null }[];
  behavior_checks?: unknown[];
};

/**
 * 그날 무엇이든 하나라도 남겼는지. 체중은 선택 항목이라 체중 없이도 기록한 날로 본다.
 * (입력했다가 모두 지운 빈 행은 기록으로 치지 않는다)
 */
export function hasAnyRecord(log: LogLike): boolean {
  const filled = (v: unknown) => v !== null && v !== undefined && !(typeof v === "string" && v.trim() === "");
  if (
    [
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
    ].some(filled)
  ) {
    return true;
  }
  if (log.meals?.some((m) => filled(m.description) || filled(m.photo_path))) return true;
  return (log.behavior_checks?.length ?? 0) > 0;
}
