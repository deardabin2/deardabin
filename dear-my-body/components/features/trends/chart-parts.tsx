"use client";

import type { ReactNode } from "react";
import { formatShortDate } from "./format";

export const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 11 };
export const GRID_STROKE = "var(--border)";

type TooltipRow = { label: string; value: string; swatch?: "line" | "dot" | "bar"; soft?: boolean };

/** 값이 먼저, 이름은 뒤에. 계열 표시는 색 상자가 아니라 짧은 선/점 */
export function TooltipCard({ title, rows }: { title: string; rows: TooltipRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 text-muted-foreground">{title}</p>
      <ul className="flex flex-col gap-1">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-2">
            <Swatch kind={row.swatch ?? "line"} soft={row.soft} />
            <span className="text-sm font-semibold text-popover-foreground">{row.value}</span>
            <span className="text-muted-foreground">{row.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Swatch({ kind, soft = false }: { kind: "line" | "dot" | "bar"; soft?: boolean }) {
  const color = soft ? "bg-chart-soft" : "bg-chart-main";
  if (kind === "dot") return <span aria-hidden className={`size-2 rounded-full ${color}`} />;
  if (kind === "bar") return <span aria-hidden className={`size-2.5 rounded-sm ${color}`} />;
  return <span aria-hidden className={`h-0.5 w-3 rounded-full ${color}`} />;
}

export function ChartEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg bg-muted px-3 py-6 text-center text-sm text-muted-foreground">{children}</p>
  );
}

/** 그래프와 같은 내용을 표로. 툴팁 없이도 모든 값을 읽을 수 있게 한다 */
export function TableView({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: string[];
  rows: (string | number)[][];
}) {
  if (rows.length === 0) return null;
  return (
    <details className="group text-sm">
      <summary className="flex min-h-11 cursor-pointer items-center text-muted-foreground hover:text-foreground">
        표로 보기
      </summary>
      <div className="max-h-72 overflow-auto rounded-lg border">
        <table className="w-full text-left tabular-nums">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={c} scope="col" className="px-3 py-2 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row[0])} className="border-t">
                {row.map((cell, i) =>
                  i === 0 ? (
                    <th key={i} scope="row" className="px-3 py-1.5 font-normal">
                      {cell}
                    </th>
                  ) : (
                    <td key={i} className="px-3 py-1.5">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export function dateTick(value: string) {
  return formatShortDate(value);
}
