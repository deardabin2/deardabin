import type { Metadata } from "next";
import { ComingSoon } from "@/components/features/layout/coming-soon";

export const metadata: Metadata = { title: "추이" };

export default function TrendsPage() {
  return <ComingSoon title="추이" description="기록이 쌓이면 체중·습관 변화를 그래프로 보여 드릴게요." />;
}
