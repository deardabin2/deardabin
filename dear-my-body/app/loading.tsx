export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-dvh items-center justify-center">
      <span className="sr-only">불러오는 중이에요</span>
      <div aria-hidden className="size-8 animate-pulse rounded-full bg-muted" />
    </div>
  );
}
