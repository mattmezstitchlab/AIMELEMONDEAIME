"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="contenu-principal" className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">AIME® · Le Monde Aime</p>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">Quelque chose n&apos;a pas fonctionné</h1>
      <p className="mt-4 leading-relaxed text-slate-600">
        Une erreur inattendue est survenue. Vos données saisies ne sont pas perdues :
        réessayez, et si le problème persiste, revenez dans quelques minutes.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center rounded-lg bg-emerald-800 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-900"
        >
          Réessayer
        </button>
        <Link href="/" className="inline-flex items-center rounded-lg border border-slate-300 px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50">
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
