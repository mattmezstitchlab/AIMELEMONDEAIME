export function PageSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-5" role="status" aria-label="Chargement en cours">
      <div className="h-32 rounded-panel bg-canvas ring-1 ring-line-soft sm:h-36" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-card bg-canvas ring-1 ring-line-soft" />
        ))}
      </div>
      <div className="h-64 rounded-card bg-canvas ring-1 ring-line-soft" />
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
