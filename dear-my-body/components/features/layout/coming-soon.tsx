export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <section className="flex flex-col items-center gap-3 py-20 text-center">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
      <p className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">준비 중이에요</p>
    </section>
  );
}
