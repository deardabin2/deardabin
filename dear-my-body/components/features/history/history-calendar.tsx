import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { monthGrid, shiftMonth } from "@/lib/calendar";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function HistoryCalendar({
  month,
  today,
  recordedDates,
}: {
  month: string;
  today: string;
  recordedDates: string[];
}) {
  const recorded = new Set(recordedDates);
  const cells = monthGrid(month);
  const [year, monthNumber] = month.split("-").map(Number);
  const isCurrentMonth = month === today.slice(0, 7);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/history?month=${shiftMonth(month, -1)}`} aria-label="이전 달">
            <ChevronLeft aria-hidden />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">
          {year}년 {monthNumber}월
        </h1>
        {isCurrentMonth ? (
          <Button variant="ghost" size="icon" disabled aria-label="다음 달 (아직 오지 않았어요)">
            <ChevronRight aria-hidden />
          </Button>
        ) : (
          <Button asChild variant="ghost" size="icon">
            <Link href={`/history?month=${shiftMonth(month, 1)}`} aria-label="다음 달">
              <ChevronRight aria-hidden />
            </Link>
          </Button>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {recorded.size > 0
          ? `${monthNumber}월에 ${recorded.size}일 기록했어요.`
          : isCurrentMonth
            ? "이번 달 기록은 아직 없어요. 오늘부터 시작해 볼까요?"
            : `${monthNumber}월에는 남긴 기록이 없어요.`}
      </p>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} aria-hidden className="py-1 text-xs text-muted-foreground">
            {w}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} aria-hidden />;
          const day = Number(date.slice(8));
          const isFuture = date > today;
          const has = recorded.has(date);
          const isToday = date === today;
          const label = `${monthNumber}월 ${day}일${has ? ", 기록 있음" : ""}${isToday ? ", 오늘" : ""}`;

          if (isFuture) {
            return (
              <div
                key={date}
                aria-hidden
                className="flex aspect-square min-h-11 items-center justify-center rounded-lg text-sm text-muted-foreground/50"
              >
                {day}
              </div>
            );
          }
          return (
            <Link
              key={date}
              href={isToday ? "/today" : `/today?date=${date}`}
              aria-label={label}
              className={cn(
                "flex aspect-square min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg text-sm transition-colors",
                has ? "bg-accent font-medium text-accent-foreground" : "hover:bg-muted",
                isToday && "ring-2 ring-primary",
              )}
            >
              {day}
              <span
                aria-hidden
                className={cn("size-1.5 rounded-full", has ? "bg-primary" : "bg-transparent")}
              />
            </Link>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span aria-hidden className="size-2 rounded-full bg-primary" /> 기록한 날
        </span>
      </div>
    </div>
  );
}
