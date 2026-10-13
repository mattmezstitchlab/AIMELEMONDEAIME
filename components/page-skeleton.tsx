export function PageSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6" role="status" aria-label="Chargement en cours">
      <div className="h-[260px] rounded-2xl bg-slate-200 sm:h-[300px]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-white" />)}
      </div>
      <div className="h-64 rounded-2xl bg-white" />
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
