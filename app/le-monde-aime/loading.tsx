export default function LeMondeAimeLoading() {
  return (
    <main lang="fr" className="min-h-screen bg-[#fafaf9]">
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6">
        <div className="h-64 rounded-3xl bg-emerald-950/15 sm:h-80" />
        <div className="mt-6 h-8 w-72 rounded bg-slate-200" />
        <div className="mt-4 grid gap-5 xl:grid-cols-2">
          <div className="h-[480px] rounded-2xl bg-white" />
          <div className="h-[480px] rounded-2xl bg-white" />
        </div>
        <p className="sr-only" role="status">Chargement des offres locales…</p>
      </div>
    </main>
  );
}
