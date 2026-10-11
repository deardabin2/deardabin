import { MessageCircleHeart } from "lucide-react";
import { formatInTimeZone } from "@/lib/date";

export type CoachCommentItem = {
  id: string;
  body: string;
  createdAt: string;
  coachName: string | null;
};

export function CoachComments({ comments }: { comments: CoachCommentItem[] }) {
  if (comments.length === 0) return null;
  return (
    <section aria-labelledby="coach-comments-heading" className="flex flex-col gap-2 rounded-xl border border-primary/30 bg-accent/60 p-4">
      <h2 id="coach-comments-heading" className="flex items-center gap-2 text-sm font-semibold text-accent-foreground">
        <MessageCircleHeart className="size-4" aria-hidden />
        코치 코멘트
      </h2>
      <ul className="flex flex-col gap-3">
        {comments.map((c) => (
          <li key={c.id} className="flex flex-col gap-1">
            <p className="leading-relaxed whitespace-pre-line">{c.body}</p>
            <p className="text-xs text-muted-foreground">
              {c.coachName || "코치"} · {formatInTimeZone(c.createdAt)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
