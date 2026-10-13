import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Page introuvable" };

export default function NotFoundPage() {
  return (
    <main id="contenu-principal" className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">AIME® · Le Monde Aime</p>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">Cette page n&apos;existe pas (ou plus)</h1>
      <p className="mt-4 leading-relaxed text-slate-600">
        Le lien que vous avez suivi est peut-être ancien. Vous pouvez repartir de l&apos;accueil,
        ou explorer la carte des personnes et des ressources près de vous.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="inline-flex items-center rounded-lg bg-emerald-800 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-900">
          Retour à l&apos;accueil
        </Link>
        <Link href="/le-monde-aime" className="inline-flex items-center rounded-lg border border-slate-300 px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50">
          Explorer la carte
        </Link>
      </div>
    </main>
  );
}
