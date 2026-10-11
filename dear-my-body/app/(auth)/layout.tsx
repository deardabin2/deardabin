import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main" tabIndex={-1} className="outline-none mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <p className="text-sm font-medium text-primary">디어마이바디</p>
        <h1 className="mt-2 text-2xl font-semibold">오늘도 내 몸을 아껴 볼까요?</h1>
      </div>
      {children}
    </main>
  );
}
