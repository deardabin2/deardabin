import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <Link href="/today" className="flex min-h-11 items-center text-base font-semibold text-primary">
          디어마이바디
        </Link>
        <div className="flex items-center">
          <ThemeToggle />
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="icon" aria-label="로그아웃">
              <LogOut aria-hidden />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
