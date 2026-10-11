import type { Metadata } from "next";
import { TrendsView } from "@/components/features/trends/trends-view";
import { TREND_RANGES, type TrendRange } from "@/components/features/trends/types";
import { requireConsentedProfile } from "@/lib/auth";
import { getTrendsData } from "@/lib/trends-data";

export const metadata: Metadata = { title: "추이" };

export default async function TrendsPage({ searchParams }: PageProps<"/trends">) {
  const profile = await requireConsentedProfile();
  const { range: rangeParam } = await searchParams;
  const range: TrendRange = TREND_RANGES.includes(rangeParam as TrendRange)
    ? (rangeParam as TrendRange)
    : "2w";
  const data = await getTrendsData(profile.id, range);
  return <TrendsView data={data} basePath="/trends" />;
}
