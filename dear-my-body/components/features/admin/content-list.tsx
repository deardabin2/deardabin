import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublishToggle } from "./publish-toggle";

export type ContentRow = { id: string; title: string; subtitle: string; isPublished: boolean };

export function ContentList({
  title,
  table,
  basePath,
  rows,
}: {
  title: string;
  table: "ingredients" | "recipes" | "articles";
  basePath: string;
  rows: ContentRow[];
}) {
  const published = rows.filter((r) => r.isPublished).length;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length}개 · 공개 {published}개
          </p>
        </div>
        <Button asChild>
          <Link href={`${basePath}/new`}>
            <Plus aria-hidden />새로 만들기
          </Link>
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-xl bg-muted px-4 py-10 text-center text-sm text-muted-foreground">
          아직 만든 {title}이(가) 없어요.
        </p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-2">
              <Link href={`${basePath}/${r.id}`} className="flex min-h-12 min-w-0 flex-1 flex-col justify-center hover:underline">
                <span className="truncate font-medium">{r.title}</span>
                {r.subtitle ? <span className="truncate text-xs text-muted-foreground">{r.subtitle}</span> : null}
              </Link>
              <PublishToggle table={table} id={r.id} isPublished={r.isPublished} label={r.title} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
