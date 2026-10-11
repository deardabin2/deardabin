import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ConsentForm } from "@/components/features/onboarding/consent-form";
import { getProfile, hasValidConsent } from "@/lib/auth";
import { healthConsentText } from "@/lib/consent-text";

export const metadata: Metadata = { title: "건강정보 동의" };

export default async function ConsentPage() {
  const profile = await getProfile();
  if (hasValidConsent(profile)) redirect("/today");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 py-10">
      <div>
        <p className="text-sm font-medium text-primary">
          {profile.display_name ? `${profile.display_name}님, 반가워요` : "반가워요"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{healthConsentText.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {healthConsentText.intro}
        </p>
      </div>

      <dl className="flex flex-col gap-4 rounded-xl bg-secondary/60 p-4 text-sm">
        {healthConsentText.items.map((item) => (
          <div key={item.label}>
            <dt className="font-medium">{item.label}</dt>
            <dd className="mt-1 leading-relaxed text-muted-foreground">{item.body}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-muted-foreground">{healthConsentText.draftNotice}</p>

      <ConsentForm />
    </main>
  );
}
