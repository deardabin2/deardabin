import { ImageIcon } from "lucide-react";
import { contentImageUrl } from "@/lib/content-image";
import { cn } from "@/lib/utils";

export function ContentImage({ path, alt, className }: { path: string | null; alt: string; className?: string }) {
  const src = contentImageUrl(path);
  if (!src) {
    return (
      <div aria-hidden className={cn("flex items-center justify-center bg-secondary text-muted-foreground", className)}>
        <ImageIcon className="size-6" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}
