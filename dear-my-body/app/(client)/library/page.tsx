import type { Metadata } from "next";
import { ComingSoon } from "@/components/features/layout/coming-soon";

export const metadata: Metadata = { title: "라이브러리" };

export default function LibraryPage() {
  return <ComingSoon title="라이브러리" description="식재료·레시피·기초지식을 곧 여기서 볼 수 있어요." />;
}
