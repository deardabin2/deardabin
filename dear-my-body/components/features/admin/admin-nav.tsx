"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/clients", label: "고객" },
  { href: "/admin/ingredients", label: "식재료" },
  { href: "/admin/recipes", label: "레시피" },
  { href: "/admin/articles", label: "글" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="코치 메뉴" className="border-b bg-background">
      <ul className="mx-auto grid max-w-3xl grid-cols-4">
        {TABS.map((t) => {
          const active = pathname.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 items-center justify-center border-b-2 text-sm transition-colors",
                  active
                    ? "border-primary font-semibold text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
