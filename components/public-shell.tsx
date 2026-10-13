import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Logo } from "@/components/ui";
import { Icon } from "@/components/icon";
import { getCurrentUser } from "@/lib/auth";
import { BottomTabs } from "@/components/bottom-tabs";

// Navigation par intention : Explorer (la carte), Être accompagné (démarches), S'informer (thématiques + guides).
const PRIMARY = [
  { href: "/le-monde-aime", label: "Explorer la carte" },
  { href: "/accompagnement", label: "Être accompagné" },
];
// Une seule page « S'informer » qui réunit toutes les thématiques et les guides.
const INFORMER = [
  { href: "/informations", label: "Tout voir" },
  { href: "/informations/sante", label: "Santé" },
  { href: "/informations/famille", label: "Famille" },
  { href: "/informations/logement", label: "Logement" },
  { href: "/informations/retraite", label: "Retraite" },
  { href: "/informations/emploi", label: "Emploi" },
  { href: "/informations/cotisations", label: "Activité et cotisations" },
];

export async function PublicHeader({ solid = false }: { solid?: boolean }) {
  const user = await getCurrentUser();
  const spaceHref = user ? (user.role === "membre" ? "/espace" : user.role === "gestionnaire" ? "/back-office" : "/admin") : "/connexion";
  const text = solid ? "text-slate-700 hover:text-emerald-800" : "text-white/85 hover:text-white";
  return (
    <header className={solid ? "relative z-30 border-b border-black/[0.06] bg-white" : "absolute inset-x-0 top-0 z-30"}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <Link href="/" aria-label="AIME® — accueil">
          <Logo light={!solid} />
        </Link>
        <nav aria-label="Navigation principale" className="hidden items-center gap-6 lg:flex">
          {PRIMARY.map((item) => (
            <Link key={item.href} href={item.href} className={`text-sm font-medium transition ${text}`}>
              {item.label}
            </Link>
          ))}
          <details className="group relative">
            <summary className={`flex cursor-pointer list-none items-center gap-1 text-sm font-medium transition [&::-webkit-details-marker]:hidden ${text}`}>
              S&apos;informer
              <svg viewBox="0 0 24 24" className="h-4 w-4 transition group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </summary>
            <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-black/[0.06] bg-white p-2 shadow-xl">
              {INFORMER.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-[#fafaf9]">{item.label}</Link>
              ))}
            </div>
          </details>
          {!user && <Link href="/decouvrir" className={`text-sm font-medium transition ${text}`}>Découvrir l&apos;espace</Link>}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href={spaceHref}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900"
          >
            <Icon name="user" className="h-4 w-4" />
            {user ? "Mon espace" : "Se connecter"}
          </Link>
          <details className="relative lg:hidden">
            <summary className={`flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg backdrop-blur [&::-webkit-details-marker]:hidden ${solid ? "bg-slate-100 text-slate-800" : "bg-white/15 text-white"}`}>
              <span className="sr-only">Ouvrir le menu</span>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </summary>
            <nav aria-label="Navigation mobile" className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-2 shadow-xl">
              <Link href="/le-monde-aime" className="block rounded-lg px-3 py-2.5 text-sm font-bold text-emerald-800 hover:bg-[#fafaf9]">Explorer la carte</Link>
              <Link href="/accompagnement" className="block rounded-lg px-3 py-2.5 text-sm font-bold text-emerald-800 hover:bg-[#fafaf9]">Être accompagné</Link>
              {!user && <Link href="/decouvrir" className="block rounded-lg px-3 py-2.5 text-sm font-bold text-emerald-800 hover:bg-[#fafaf9]">Découvrir l&apos;espace</Link>}
              <p className="px-3 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">S&apos;informer</p>
              {INFORMER.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-[#fafaf9]">{item.label}</Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-[#f7f7f5]">
      <div className="mx-auto max-w-6xl px-6 py-16 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <nav aria-label="Liens de pied de page" className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-slate-600">
          <Link href="/informations" className="font-semibold text-emerald-700 hover:underline">S&apos;informer</Link>
          <Link href="/informations/sante" className="hover:text-emerald-700">Santé</Link>
          <Link href="/informations/famille" className="hover:text-emerald-700">Famille</Link>
          <Link href="/informations/retraite" className="hover:text-emerald-700">Retraite</Link>
          <Link href="/informations/emploi" className="hover:text-emerald-700">Emploi agricole</Link>
          <Link href="/accompagnement" className="hover:text-emerald-700">Accompagnement des démarches</Link>
          <Link href="/annuaire" className="hover:text-emerald-700">Points d&apos;accueil</Link>
          <Link href="/decouvrir" className="hover:text-emerald-700">Découvrir l&apos;espace (démo)</Link>
          <Link href="/vision" className="hover:text-emerald-700">Notre méthode et nos limites</Link>
          <Link href="/le-monde-aime" className="font-semibold text-emerald-700 hover:underline">Explorer la carte</Link>
          <Link href="/connexion" className="hover:text-emerald-700">Connexion</Link>
        </nav>
        <div className="mt-8 flex justify-center gap-3">
          {(["phone", "pin", "echanges"] as const).map((name) => (
            <span key={name} className="grid h-10 w-10 place-items-center rounded-full bg-slate-300/70 text-white">
              <Icon name={name} className="h-4 w-4" />
            </span>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-xs leading-relaxed text-slate-500">
          AIME® (Le Monde Aime) est une initiative indépendante présentée sous forme de prototype. Elle n&apos;attribue aucun droit, ne délivre aucune
          assurance et n&apos;est affiliée à aucun organisme : la MSA, la CAF, l&apos;Assurance Maladie, France Travail et les autres organismes cités sont des
          structures externes référencées. Attestations (« SPÉCIMEN »), dossiers et paiements de démonstration sont fictifs ; aucune connexion officielle n&apos;est active.
        </p>
        <p className="mt-4 text-sm text-slate-500">© {new Date().getFullYear()} AIME® — Le Monde Aime · prototype de démonstration</p>
      </div>
    </footer>
  );
}

export function PublicPage({ children, solidHeader = false, lma = false }: { children: ReactNode; solidHeader?: boolean; lma?: boolean }) {
  return (
    <div className={`flex min-h-screen flex-col bg-white ${lma ? "pb-16 md:pb-0" : ""}`}>
      <PublicHeader solid={solidHeader} />
      <main id="contenu-principal" className="flex-1">
        {children}
      </main>
      <PublicFooter />
      {lma && (
        <Suspense fallback={null}>
          <BottomTabs />
        </Suspense>
      )}
    </div>
  );
}
