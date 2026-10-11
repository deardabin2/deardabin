"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { DotItemDotProps } from "recharts/types/util/types";
import { AXIS_TICK, dateTick, GRID_STROKE, TooltipCard } from "./chart-parts";
import { formatCompact, formatNumber, formatPercent, formatShortDate } from "./format";
import type { DailyPoint, TrendsData } from "./types";

const MAIN = "var(--chart-main)";
const SOFT = "var(--chart-soft)";
const SURFACE = "var(--card)";

/** 앞뒤 값이 비어 있는 외딴 점만 표시 (선만으로는 안 보이므로) */
function isolatedDot(key: keyof DailyPoint, data: DailyPoint[]) {
  function IsolatedDot({ cx, cy, index }: DotItemDotProps) {
    const prev = data[index - 1]?.[key];
    const next = data[index + 1]?.[key];
    if (data[index]?.[key] === null || (prev != null) || (next != null) || cx == null || cy == null) {
      return <g key={`dot-${index}`} />;
    }
    return (
      <circle key={`dot-${index}`} cx={cx} cy={cy} r={4} fill={MAIN} stroke={SURFACE} strokeWidth={2} />
    );
  }
  return IsolatedDot;
}

// ---------------------------------------------------------------------------

export function WeightChart({
  daily,
  targetWeight,
  showMovingAverage,
}: Pick<TrendsData, "daily" | "targetWeight" | "showMovingAverage">) {
  const values = daily.flatMap((d) => [d.weight, d.ma]).filter((v): v is number => v !== null);
  if (targetWeight !== null) values.push(targetWeight);
  const min = Math.floor(Math.min(...values) - 1);
  const step = Math.max(1, Math.ceil((Math.ceil(Math.max(...values) + 1) - min) / 4));
  const ticks = Array.from({ length: 5 }, (_, i) => min + i * step);
  const max = ticks[ticks.length - 1];

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={daily} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis
            dataKey="date"
            tickFormatter={dateTick}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            domain={[min, max]}
            ticks={ticks}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          {targetWeight !== null ? (
            <ReferenceLine
              y={targetWeight}
              stroke="var(--muted-foreground)"
              strokeWidth={1}
              label={{
                value: `목표 ${formatNumber(targetWeight)}kg`,
                position: "insideTopRight",
                fill: "var(--muted-foreground)",
                fontSize: 11,
              }}
            />
          ) : null}
          <Tooltip
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            content={(props: TooltipContentProps) => {
              const row = props.payload?.[0]?.payload as DailyPoint | undefined;
              if (!props.active || !row) return null;
              return (
                <TooltipCard
                  title={formatShortDate(row.date)}
                  rows={[
                    ...(row.ma !== null
                      ? [{ label: "7일 평균", value: `${formatNumber(row.ma)}kg`, swatch: "line" as const }]
                      : []),
                    ...(row.weight !== null
                      ? [{ label: "그날 체중", value: `${formatNumber(row.weight)}kg`, swatch: "dot" as const, soft: true }]
                      : []),
                  ]}
                />
              );
            }}
          />
          <Line
            dataKey="weight"
            name="그날 체중"
            stroke="none"
            isAnimationActive={false}
            dot={{ r: 4, fill: SOFT, stroke: SURFACE, strokeWidth: 2 }}
            activeDot={{ r: 5, fill: SOFT, stroke: SURFACE, strokeWidth: 2 }}
          />
          {showMovingAverage ? (
            <Line
              dataKey="ma"
              name="7일 평균"
              stroke={MAIN}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={false}
              activeDot={{ r: 4, fill: MAIN, stroke: SURFACE, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function WeeklyChart({ weekly }: Pick<TrendsData, "weekly">) {
  const data = weekly.map((w) => ({
    ...w,
    label: `${formatShortDate(w.weekStart)}~`,
    percent: w.rate === null ? null : Math.round(w.rate * 100),
  }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={8} />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 50, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={(props: TooltipContentProps) => {
              const row = props.payload?.[0]?.payload as (typeof data)[number] | undefined;
              if (!props.active || !row || row.rate === null) return null;
              return (
                <TooltipCard
                  title={`${formatShortDate(row.weekStart)} 주`}
                  rows={[
                    {
                      label: `${row.eligible}번 중 ${row.achieved}번`,
                      value: formatPercent(row.rate),
                      swatch: "bar",
                    },
                  ]}
                />
              );
            }}
          />
          <Bar
            dataKey="percent"
            name="달성률"
            fill={MAIN}
            maxBarSize={24}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
            label={
              data.length <= 6
                ? {
                    position: "top",
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                    formatter: (v: unknown) => (typeof v === "number" ? `${v}%` : ""),
                  }
                : false
            }
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function SmallLineChart({
  daily,
  dataKey,
  unit,
  domain,
  ticks,
  compact = false,
}: {
  daily: DailyPoint[];
  dataKey: "sleep" | "water" | "hunger" | "energy" | "mood" | "digestion";
  unit: string;
  domain?: [number, number];
  ticks?: number[];
  compact?: boolean;
}) {
  const hasData = daily.some((d) => d[dataKey] !== null);
  if (!hasData) {
    return <p className="flex h-28 items-center justify-center text-xs text-muted-foreground">아직 기록이 없어요</p>;
  }

  return (
    <div className="h-28 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={daily} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis
            dataKey="date"
            tickFormatter={dateTick}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            minTickGap={32}
          />
          <YAxis
            domain={domain ?? [0, "auto"]}
            ticks={ticks}
            tickCount={3}
            tickFormatter={(v: number) => (compact ? formatCompact(v) : formatNumber(v))}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={34}
          />
          <Tooltip
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            content={(props: TooltipContentProps) => {
              const row = props.payload?.[0]?.payload as DailyPoint | undefined;
              const value = row?.[dataKey];
              if (!props.active || !row || value === null || value === undefined) return null;
              return (
                <TooltipCard
                  title={formatShortDate(row.date)}
                  rows={[{ label: unit, value: formatNumber(value), swatch: "line" }]}
                />
              );
            }}
          />
          <Line
            dataKey={dataKey}
            stroke={MAIN}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={isolatedDot(dataKey, daily)}
            activeDot={{ r: 4, fill: MAIN, stroke: SURFACE, strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
