import type { Metadata } from "next";
import { ClientHeader } from "@/components/features/admin/client-tabs";
import { TrendsView } from "@/components/features/trends/trends-view";
import { TREND_RANGES, type TrendRange } from "@/components/features/trends/types";
import { getClientProfile } from "@/lib/admin-data";
import { requireCoach } from "@/lib/auth";
import { getTrendsData } from "@/lib/trends-data";

export const metadata: Metadata = { title: "고객 추이" };

export default async function ClientTrendsPage({ params, searchParams }: PageProps<"/admin/clients/[id]/trends">) {
  await requireCoach();
  const { id } = await params;
  const { range: rangeParam } = await searchParams;
  const client = await getClientProfile(id);
  const range: TrendRange = TREND_RANGES.includes(rangeParam as TrendRange) ? (rangeParam as TrendRange) : "2w";
  const data = await getTrendsData(id, range);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5">
      <ClientHeader clientId={id} name={client.display_name || "이름 없음"} active="trends" />
      <TrendsView data={data} basePath={`/admin/clients/${id}/trends`} title="기간별 추이" />
    </div>
  );
}
