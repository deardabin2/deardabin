import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

// react-markdown 은 기본적으로 원시 HTML 을 렌더링하지 않는다 (스크립트 삽입 방지)
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        "prose prose-stone max-w-none text-[15px] leading-relaxed dark:prose-invert prose-headings:font-semibold prose-a:text-primary",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
