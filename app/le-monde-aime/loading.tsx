export default function LeMondeAimeLoading() {
  return (
    <main lang="fr" className="min-h-screen bg-subtle">
      <div className="mx-auto max-w-7xl animate-pulse px-5 py-8 sm:px-8">
        <div className="h-56 rounded-panel bg-muted ring-1 ring-line-soft sm:h-72" />
        <div className="mt-6 h-7 w-72 rounded bg-muted" />
        <div className="mt-4 grid gap-5 xl:grid-cols-2">
          <div className="h-[480px] rounded-card bg-canvas ring-1 ring-line-soft" />
          <div className="h-[480px] rounded-card bg-canvas ring-1 ring-line-soft" />
        </div>
        <p className="sr-only" role="status">Chargement des offres locales…</p>
      </div>
    </main>
  );
}
