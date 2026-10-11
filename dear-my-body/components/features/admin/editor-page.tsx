import type { ReactNode } from "react";
import { BackLink } from "@/components/features/library/back-link";

export function EditorPage({
  backHref,
  backLabel,
  title,
  previewHref,
  children,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  previewHref?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <BackLink href={backHref} label={backLabel} />
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-xl font-semibold">{title}</h1>
        {previewHref ? (
          <a href={previewHref} target="_blank" rel="noreferrer" className="flex min-h-11 items-center text-sm text-primary hover:underline">
            고객 화면으로 보기
          </a>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export const UUID_PATTERN = /^[0-9a-f-]{36}$/;
