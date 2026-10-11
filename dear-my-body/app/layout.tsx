import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/features/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "디어마이바디", template: "%s · 디어마이바디" },
  description: "매일의 식단과 습관을 기록하고, 내 몸의 변화를 함께 살펴봐요.",
  applicationName: "디어마이바디",
  appleWebApp: { capable: true, title: "디어마이바디", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f3ea" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2620" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          본문으로 건너뛰기
        </a>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
