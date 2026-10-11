import Link from "next/link";
import { cn } from "@/lib/utils";

/** 링크 기반 필터 칩. 선택 상태는 URL 에 담겨 뒤로 가기·공유가 자연스럽다 */
export function FilterChips({
  label,
  options,
}: {
  label: string;
  options: { key: string; label: string; href: string; active: boolean }[];
}) {
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4">
      <ul className="flex w-max gap-2">
        {options.map((o) => (
          <li key={o.key}>
            <Link
              href={o.href}
              aria-current={o.active ? "true" : undefined}
              className={cn(
                "flex min-h-11 items-center rounded-full border px-4 text-sm whitespace-nowrap transition-colors",
                o.active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {o.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="태그">
      {tags.map((t) => (
        <li key={t} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
          #{t}
        </li>
      ))}
    </ul>
  );
}

export function LibraryEmpty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-muted px-4 py-10 text-center text-sm text-muted-foreground">{children}</p>;
}
