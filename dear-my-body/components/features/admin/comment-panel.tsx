"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCoachComment, deleteCoachComment, updateCoachComment } from "@/app/(coach)/admin/comment-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type AdminComment = {
  id: string;
  body: string;
  createdLabel: string;
  coachName: string;
  mine: boolean;
};

export function CommentPanel({ dailyLogId, comments }: { dailyLogId: string; comments: AdminComment[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<{ id: string; body: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const run = (task: () => Promise<{ ok: boolean; message?: string }>, onDone?: () => void) => {
    setMessage(null);
    startTransition(async () => {
      const result = await task();
      if (!result.ok) {
        setMessage(result.message ?? "저장하지 못했어요.");
        return;
      }
      onDone?.();
      router.refresh();
    });
  };

  return (
    <section aria-labelledby="comments-heading" className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <h2 id="comments-heading" className="font-semibold">
        코치 코멘트
      </h2>
      <p className="text-xs text-muted-foreground">남긴 코멘트는 고객의 그날 기록 화면 맨 위에 보여요.</p>

      {comments.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => (
            <li key={c.id} className="flex flex-col gap-2 rounded-lg bg-muted p-3">
              {editing?.id === c.id ? (
                <>
                  <label htmlFor={`edit-${c.id}`} className="sr-only">
                    코멘트 고치기
                  </label>
                  <Textarea
                    id={`edit-${c.id}`}
                    value={editing.body}
                    maxLength={1000}
                    onChange={(e) => setEditing({ id: c.id, body: e.target.value })}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setEditing(null)} disabled={pending}>
                      취소
                    </Button>
                    <Button
                      onClick={() => run(() => updateCoachComment(editing), () => setEditing(null))}
                      disabled={pending || !editing.body.trim()}
                    >
                      저장
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="whitespace-pre-line">{c.body}</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {c.coachName} · {c.createdLabel}
                    </p>
                    {c.mine ? (
                      <div className="flex">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing({ id: c.id, body: c.body })}
                          disabled={pending}
                        >
                          고치기
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm("이 코멘트를 지울까요?")) run(() => deleteCoachComment(c.id));
                          }}
                          disabled={pending}
                        >
                          지우기
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <label htmlFor="new-comment" className="sr-only">
        새 코멘트
      </label>
      <Textarea
        id="new-comment"
        value={draft}
        maxLength={1000}
        placeholder="오늘 기록에 따뜻한 한마디를 남겨 주세요"
        onChange={(e) => setDraft(e.target.value)}
      />
      {message ? (
        <p role="status" className="text-sm text-destructive">
          {message}
        </p>
      ) : null}
      <Button
        onClick={() => run(() => addCoachComment({ dailyLogId, body: draft }), () => setDraft(""))}
        disabled={pending || !draft.trim()}
      >
        {pending ? "저장하는 중…" : "코멘트 남기기"}
      </Button>
    </section>
  );
}
