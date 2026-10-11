"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatKoreanDate, shiftDate } from "@/lib/date";

export function DateNav({ logDate, today }: { logDate: string; today: string }) {
  const router = useRouter();
  const prev = shiftDate(logDate, -1);
  const next = shiftDate(logDate, 1);
  const isToday = logDate === today;

  const go = (date: string) => router.push(date === today ? "/today" : `/today?date=${date}`);

  return (
    <div className="flex items-center justify-between gap-1">
      <Button asChild variant="ghost" size="icon">
        <Link href={`/today?date=${prev}`} aria-label="어제 기록 보기">
          <ChevronLeft aria-hidden />
        </Link>
      </Button>

      <div className="relative flex flex-col items-center">
        <div
          aria-hidden
          className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-lg font-semibold"
        >
          {isToday ? "오늘" : formatKoreanDate(logDate)}
          <CalendarDays className="size-4 text-muted-foreground" />
        </div>
        {isToday ? (
          <span aria-hidden className="text-xs text-muted-foreground">
            {formatKoreanDate(logDate)}
          </span>
        ) : null}
        {/* 화면에 보이는 날짜 위에 투명한 기본 날짜 선택기를 겹쳐, 탭하면 기기 달력이 열린다 */}
        <input
          type="date"
          aria-label={`날짜 선택, 지금 ${formatKoreanDate(logDate)}`}
          max={today}
          value={logDate}
          onClick={(e) => {
            try {
              e.currentTarget.showPicker?.();
            } catch {
              // 지원하지 않는 브라우저는 기본 동작(탭하면 열림)에 맡긴다
            }
          }}
          onChange={(e) => e.target.value && go(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>

      {isToday ? (
        <Button variant="ghost" size="icon" disabled aria-label="내일 기록은 내일 남길 수 있어요">
          <ChevronRight aria-hidden />
        </Button>
      ) : (
        <Button asChild variant="ghost" size="icon">
          <Link href={next === today ? "/today" : `/today?date=${next}`} aria-label="다음 날 기록 보기">
            <ChevronRight aria-hidden />
          </Link>
        </Button>
      )}
    </div>
  );
}
