import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MIN_WEIGHT_DAYS_FOR_TREND } from "@/lib/trends";
import { ChartEmpty, Swatch, TableView } from "./chart-parts";
import { SmallLineChart, WeeklyChart, WeightChart } from "./charts";
import { formatNumber, formatPercent, formatShortDate, formatSignedKg } from "./format";
import { TREND_RANGES, TREND_RANGE_LABELS, type TrendsData } from "./types";

const SMALL_CHARTS = [
  { key: "sleep", title: "수면", unit: "시간", domain: undefined, ticks: undefined, compact: false },
  { key: "water", title: "물", unit: "ml", domain: undefined, ticks: undefined, compact: true },
  { key: "hunger", title: "배고픔", unit: "점", domain: [1, 5], ticks: [1, 3, 5], compact: false },
  { key: "energy", title: "에너지", unit: "점", domain: [1, 5], ticks: [1, 3, 5], compact: false },
  { key: "mood", title: "기분", unit: "점", domain: [1, 5], ticks: [1, 3, 5], compact: false },
  { key: "digestion", title: "소화", unit: "점", domain: [1, 5], ticks: [1, 3, 5], compact: false },
] as const;

const dash = (v: number | null, digits = 1) => (v === null ? "–" : formatNumber(v, digits));

export function TrendsView({
  data,
  basePath,
  title = "추이",
}: {
  data: TrendsData;
  /** 기간 필터 링크의 경로 (고객: /trends, 코치: /admin/clients/[id]/trends) */
  basePath: string;
  title?: string;
}) {
  const { summary } = data;
  const weightRows = data.daily.filter((d) => d.weight !== null || d.ma !== null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{title}</h1>
        <nav aria-label="기간" className="flex rounded-lg bg-secondary p-1">
          {TREND_RANGES.map((r) => (
            <Link
              key={r}
              href={r === "2w" ? basePath : `${basePath}?range=${r}`}
              aria-current={data.range === r ? "page" : undefined}
              className={cn(
                "flex min-h-11 min-w-14 items-center justify-center rounded-md px-3 text-sm transition-colors",
                data.range === r
                  ? "bg-card font-semibold text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {TREND_RANGE_LABELS[r]}
            </Link>
          ))}
        </nav>
      </div>

      {/* 요약 카드 */}
      <section aria-label="요약" className="grid grid-cols-2 gap-3">
        <SummaryTile
          label="7일 평균 체중 변화"
          value={summary.weightChange ? formatSignedKg(summary.weightChange.diff) : "–"}
          note={
            summary.weightChange
              ? `${summary.baselineLabel} · 지금 ${formatNumber(summary.weightChange.current)}kg`
              : `체중을 ${MIN_WEIGHT_DAYS_FOR_TREND}일 이상 기록하면 보여 드려요`
          }
        />
        <SummaryTile
          label="이번 주 기록"
          value={`${summary.recordDaysThisWeek}일`}
          note={`월요일부터 ${summary.elapsedDaysThisWeek}일 중`}
        />
        <SummaryTile
          className="col-span-2"
          label="가장 잘 지킨 행동 목표"
          value={summary.bestGoal ? summary.bestGoal.title : "–"}
          note={
            summary.bestGoal
              ? `${TREND_RANGE_LABELS[data.range]} 동안 ${formatPercent(summary.bestGoal.rate)} 지켰어요`
              : data.hasBehaviorGoals
                ? "체크가 쌓이면 보여 드려요"
                : "아직 행동 목표가 없어요"
          }
        />
      </section>

      {/* 체중 */}
      <Card>
        <CardHeader>
          <CardTitle>체중</CardTitle>
          <CardDescription>
            {formatShortDate(data.from)} ~ {formatShortDate(data.today)} · 매일 체중은 오르내리니 평균선 흐름을 봐 주세요
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {data.weightDays === 0 ? (
            <ChartEmpty>
              이 기간엔 체중 기록이 없어요. 체중은 선택이라 적지 않아도 괜찮아요.
            </ChartEmpty>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Swatch kind="dot" soft /> 그날 체중
                </span>
                {data.showMovingAverage ? (
                  <span className="flex items-center gap-1.5">
                    <Swatch kind="line" /> 7일 평균
                  </span>
                ) : null}
                {data.targetWeight !== null ? (
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden className="h-px w-3 bg-muted-foreground" /> 목표
                  </span>
                ) : null}
              </div>
              <WeightChart
                daily={data.daily}
                targetWeight={data.targetWeight}
                showMovingAverage={data.showMovingAverage}
              />
              {!data.showMovingAverage ? (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">
                  체중 기록이 {MIN_WEIGHT_DAYS_FOR_TREND}일 이상 쌓이면 7일 평균선을 그려 드려요. (지금 {data.weightDays}일)
                </p>
              ) : null}
              <TableView
                caption="날짜별 체중과 7일 평균"
                columns={["날짜", "체중(kg)", "7일 평균(kg)"]}
                rows={weightRows.map((d) => [formatShortDate(d.date), dash(d.weight), dash(d.ma, 2)])}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* 행동 목표 */}
      <Card>
        <CardHeader>
          <CardTitle>행동 목표 주간 달성률</CardTitle>
          <CardDescription>그 주에 지킨 날 ÷ 지킬 날 (월요일 시작, 기록하지 않은 날 포함)</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!data.hasBehaviorGoals ? (
            <ChartEmpty>
              아직 행동 목표가 없어요.{" "}
              {basePath === "/trends" ? (
                <Link href="/goals" className="font-medium text-primary underline-offset-4 hover:underline">
                  목표 정하러 가기
                </Link>
              ) : null}
            </ChartEmpty>
          ) : (
            <>
              <WeeklyChart weekly={data.weekly} />
              <ul className="flex flex-col gap-3" aria-label="행동 목표별 달성률">
                {data.goalRates.map((g) => (
                  <li key={g.id} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate">{g.title}</span>
                      <span className="shrink-0 text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {g.rate === null ? "–" : formatPercent(g.rate)}
                        </span>{" "}
                        ({g.achieved}/{g.eligible}일)
                      </span>
                    </div>
                    <div aria-hidden className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-chart-main"
                        style={{ width: `${Math.round((g.rate ?? 0) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <TableView
                caption="주별 행동 목표 달성률"
                columns={["주 시작", "달성률", "지킨 날/지킬 날"]}
                rows={data.weekly.map((w) => [
                  formatShortDate(w.weekStart),
                  w.rate === null ? "–" : formatPercent(w.rate),
                  `${w.achieved}/${w.eligible}`,
                ])}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* 수면·물·컨디션 */}
      <Card>
        <CardHeader>
          <CardTitle>수면 · 물 · 컨디션</CardTitle>
          <CardDescription>컨디션은 1~5점이에요</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            {SMALL_CHARTS.map((c) => (
              <figure key={c.key} className="flex min-w-0 flex-col gap-1">
                <figcaption className="text-sm font-medium">
                  {c.title} <span className="text-xs font-normal text-muted-foreground">({c.unit})</span>
                </figcaption>
                <SmallLineChart
                  daily={data.daily}
                  dataKey={c.key}
                  unit={c.unit}
                  domain={c.domain ? [...c.domain] : undefined}
                  ticks={c.ticks ? [...c.ticks] : undefined}
                  compact={c.compact}
                />
              </figure>
            ))}
          </div>
          <TableView
            caption="날짜별 수면, 물, 컨디션"
            columns={["날짜", "수면", "물(ml)", "배고픔", "에너지", "기분", "소화"]}
            rows={data.daily
              .filter((d) => [d.sleep, d.water, d.hunger, d.energy, d.mood, d.digestion].some((v) => v !== null))
              .map((d) => [
                formatShortDate(d.date),
                dash(d.sleep),
                dash(d.water, 0),
                dash(d.hunger, 0),
                dash(d.energy, 0),
                dash(d.mood, 0),
                dash(d.digestion, 0),
              ])}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  note,
  className,
}: {
  label: string;
  value: string;
  note: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1 rounded-xl border bg-card p-4", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-xl font-semibold">{value}</p>
      <p className="text-xs leading-snug text-muted-foreground">{note}</p>
    </div>
  );
}
