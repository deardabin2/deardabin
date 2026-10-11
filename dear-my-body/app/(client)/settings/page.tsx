import type { Metadata } from "next";
import { Download, LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import {
  DeleteAccountForm,
  DisplayNameForm,
  WithdrawConsentButton,
} from "@/components/features/settings/settings-forms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfile, hasValidConsent } from "@/lib/auth";
import { formatInTimeZone } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "설정" };

export default async function SettingsPage() {
  const profile = await getProfile();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;
  const consented = hasValidConsent(profile);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">설정</h1>

      <Card>
        <CardHeader>
          <CardTitle>내 정보</CardTitle>
          {email ? <CardDescription>{email}</CardDescription> : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <DisplayNameForm initial={profile.display_name} />
          <form action={signOut}>
            <Button type="submit" variant="ghost" className="w-full">
              <LogOut aria-hidden />
              로그아웃
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>홈 화면에 추가하기</CardTitle>
          <CardDescription>앱처럼 바로 열 수 있어요.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2 text-sm leading-relaxed">
            <li>
              <span className="font-medium">아이폰(사파리)</span>: 아래 공유 버튼 → &apos;홈 화면에 추가&apos;
            </li>
            <li>
              <span className="font-medium">안드로이드(크롬)</span>: 오른쪽 위 ⋮ 메뉴 → &apos;홈 화면에 추가&apos; 또는 &apos;앱 설치&apos;
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>내 데이터 내보내기</CardTitle>
          <CardDescription>CSV 파일로 받아 엑셀이나 구글 시트에서 열 수 있어요. 사진은 포함되지 않아요.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Button asChild variant="outline">
            <a href="/settings/export?type=logs" download>
              <Download aria-hidden />
              일일 기록
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/settings/export?type=goals" download>
              <Download aria-hidden />
              목표
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>건강정보 동의</CardTitle>
          <CardDescription>
            {consented && profile.sensitive_consent_at
              ? `${formatInTimeZone(profile.sensitive_consent_at)}에 동의했어요.`
              : "아직 동의하지 않았어요."}
          </CardDescription>
        </CardHeader>
        {consented ? (
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              동의를 철회하면 목표·일일 기록·식사 사진이 모두 지워져요. 계정은 남아 있어 라이브러리는 계속 볼 수 있어요.
            </p>
            <WithdrawConsentButton />
          </CardContent>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>계정 삭제</CardTitle>
          <CardDescription>
            계정과 모든 기록·사진·코치 코멘트가 바로 지워지고 되돌릴 수 없어요. 필요하면 먼저 데이터를 내보내 주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountForm />
        </CardContent>
      </Card>
    </div>
  );
}
