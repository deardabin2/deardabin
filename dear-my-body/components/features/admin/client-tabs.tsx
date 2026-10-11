import Link from "next/link";
import { BackLink } from "@/components/features/library/back-link";
import { cn } from "@/lib/utils";

export function ClientHeader({
  clientId,
  name,
  active,
}: {
  clientId: string;
  name: string;
  active: "calendar" | "trends";
}) {
  const tabs = [
    { key: "calendar", label: "기록 달력", href: `/admin/clients/${clientId}` },
    { key: "trends", label: "추이", href: `/admin/clients/${clientId}/trends` },
  ] as const;
  return (
    <div className="flex flex-col gap-3">
      <BackLink href="/admin/clients" label="고객 목록" />
      <h1 className="text-xl font-semibold">{name}</h1>
      <nav aria-label="고객 기록 보기" className="flex w-fit rounded-lg bg-secondary p-1">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            aria-current={active === t.key ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center rounded-md px-4 text-sm",
              active === t.key ? "bg-card font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
