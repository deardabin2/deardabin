import type { ReactNode } from "react";
import { AppHeader } from "@/components/features/layout/app-header";
import { BottomNav } from "@/components/features/layout/bottom-nav";
import { requireUserId } from "@/lib/auth";

export default async function ClientLayout({ children }: { children: ReactNode }) {
  await requireUserId();

  return (
    <div className="min-h-dvh">
      <AppHeader />
      <main className="mx-auto w-full max-w-md px-4 pt-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
