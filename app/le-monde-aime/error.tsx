"use client";

import { useEffect } from "react";

export default function LeMondeAimeError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Le Monde Aime — erreur de chargement", error); }, [error]);
  return (
    <main lang="fr" className="grid min-h-[70vh] place-items-center bg-[#fafaf9] px-5 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm" role="alert">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-800" aria-hidden="true">!</span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">Le Monde Aime</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">La carte n’a pas pu s’ouvrir</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Vos offres et échanges ne sont pas supprimés. Réessayez dans un instant. Si le problème persiste, vous pouvez revenir à la page d’accueil.</p>
        {error.digest && <p className="mt-3 text-xs text-slate-400">Référence technique : {error.digest}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => reset()} className="rounded-lg bg-emerald-800 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-900">Réessayer</button>
          <a href="/" className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Retour à l’accueil</a>
        </div>
        <p className="mt-6 text-xs text-slate-500">Le Monde Aime est une initiative indépendante. Les structures d'accompagnement externes restent consultables dans la rubrique « Services et accompagnement ».</p>
      </section>
    </main>
  );
}
