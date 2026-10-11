import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminNav } from "@/components/features/admin/admin-nav";
import { AppHeader } from "@/components/features/layout/app-header";
import { requireCoach } from "@/lib/auth";

export const metadata: Metadata = { title: { default: "코치 관리", template: "%s · 코치 관리" } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireCoach();
  return (
    <div className="min-h-dvh">
      <AppHeader homeHref="/admin" />
      <AdminNav />
      <main id="main" tabIndex={-1} className="outline-none mx-auto w-full max-w-3xl px-4 py-5 pb-16">{children}</main>
    </div>
  );
}
