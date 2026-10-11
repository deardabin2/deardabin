import Link from "next/link";
import { LayoutDashboard, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

export function AppHeader({ isCoach = false, homeHref = "/today" }: { isCoach?: boolean; homeHref?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <Link href={homeHref} className="flex min-h-11 items-center text-base font-semibold text-primary">
          디어마이바디
        </Link>
        <div className="flex items-center">
          {isCoach ? (
            <Button asChild variant="ghost" size="icon">
              <Link href="/admin" aria-label="코치 관리 화면">
                <LayoutDashboard aria-hidden />
              </Link>
            </Button>
          ) : null}
          <ThemeToggle />
          <Button asChild variant="ghost" size="icon">
            <Link href="/settings" aria-label="설정">
              <Settings aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
