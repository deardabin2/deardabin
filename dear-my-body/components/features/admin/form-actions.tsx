"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteContent } from "@/app/(coach)/admin/content-actions";
import { Button } from "@/components/ui/button";

export function DeleteContentButton({
  table,
  id,
  label,
  onError,
}: {
  table: "ingredients" | "recipes" | "articles";
  id: string;
  label: string;
  onError: (message: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`'${label}'을(를) 지울까요? 되돌릴 수 없어요.`)) return;
        startTransition(async () => {
          const result = await deleteContent(table, id);
          if (result && !result.ok) onError(result.message);
        });
      }}
    >
      <Trash2 aria-hidden />
      {pending ? "지우는 중…" : "지우기"}
    </Button>
  );
}
