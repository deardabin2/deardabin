"use client";

import { useOptimistic, useTransition } from "react";
import { setPublished } from "@/app/(coach)/admin/content-actions";
import { cn } from "@/lib/utils";

export function PublishToggle({
  table,
  id,
  isPublished,
  label,
}: {
  table: "ingredients" | "recipes" | "articles";
  id: string;
  isPublished: boolean;
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(isPublished);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimistic}
      aria-label={`${label} 공개`}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          await setPublished(table, id, !optimistic);
        })
      }
      className={cn(
        "flex min-h-11 min-w-16 shrink-0 items-center justify-center rounded-full border px-3 text-xs font-medium transition-colors",
        optimistic ? "border-primary bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
      )}
    >
      {optimistic ? "공개" : "비공개"}
    </button>
  );
}
