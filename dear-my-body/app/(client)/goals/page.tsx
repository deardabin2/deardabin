import type { Metadata } from "next";
import { GoalForm } from "@/components/features/goals/goal-form";
import { requireConsentedProfile } from "@/lib/auth";
import { todayInSeoul } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "목표" };

export default async function GoalsPage({ searchParams }: PageProps<"/goals">) {
  const profile = await requireConsentedProfile();
  const { welcome } = await searchParams;
  const supabase = await createClient();

  const { data: goal } = await supabase
    .from("goals")
    .select("*, behavior_goals(*)")
    .eq("user_id", profile.id)
    .eq("status", "active")
    .is("behavior_goals.archived_at", null)
    .order("sort_order", { referencedTable: "behavior_goals" })
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">{goal ? "나의 목표" : "목표를 정해 볼까요?"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {welcome
            ? "기간과 매일 지킬 작은 행동부터 정해 봐요. 체중은 적지 않아도 괜찮아요."
            : "언제든 고칠 수 있어요. 체중은 적지 않아도 괜찮아요."}
        </p>
      </div>
      <GoalForm
        version={goal ? `${goal.id}:${goal.updated_at}` : "new"}
        hasActiveGoal={Boolean(goal)}
        defaultValues={{
          startDate: goal?.start_date ?? todayInSeoul(),
          endDate: goal?.end_date ?? "",
          startWeight: goal?.start_weight ?? "",
          targetWeight: goal?.target_weight ?? "",
          motivation: goal?.motivation ?? "",
          behaviorGoals: (goal?.behavior_goals ?? []).map((b) => ({
            id: b.id,
            title: b.title,
            kind: b.kind === "number" ? "number" : "check",
            targetValue: b.target_value ?? "",
            unit: b.unit ?? "",
          })),
        }}
      />
    </div>
  );
}
