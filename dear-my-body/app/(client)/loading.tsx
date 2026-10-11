export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4 py-6">
      <span className="sr-only">불러오는 중이에요</span>
      <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
      <div className="h-32 animate-pulse rounded-xl bg-muted" />
      <div className="h-32 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
