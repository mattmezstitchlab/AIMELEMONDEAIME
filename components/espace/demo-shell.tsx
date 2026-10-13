import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui";
import { Icon, type IconName } from "@/components/icon";

const NAV: Array<{ label: string; icon: IconName; active?: boolean; soon?: boolean }> = [
  { label: "Mon aperçu", icon: "home", active: true },
  { label: "Mes démarches", icon: "demarches" },
  { label: "Mes projets", icon: "calendar" },
  { label: "Mes échanges", icon: "echanges" },
  { label: "Mes documents", icon: "documents" },
  { label: "Mon profil", icon: "user" },
];

/** Enveloppe visuelle de « Mon espace » pour la démonstration publique (sans authentification, lecture seule). */
export function DemoShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafaf9]">
      <div className="flex items-center justify-center gap-3 bg-emerald-900 px-4 py-2 text-center text-xs font-semibold text-white">
        <Icon name="search" className="hidden h-4 w-4 sm:block" />
        <span>Aperçu de démonstration de « Mon espace » — données fictives, en lecture seule.</span>
        <Link href="/inscription" className="rounded-full bg-white/15 px-3 py-1 font-bold hover:bg-white/25">Créer le mien</Link>
      </div>
      <div className="flex flex-1">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-black/[0.06] bg-white/80 px-5 py-7 backdrop-blur-xl md:flex">
          <Link href="/" className="mb-8 px-2" aria-label="Accueil AIME®"><Logo /></Link>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Aperçu · Mon espace</p>
          <nav aria-label="Navigation de démonstration" className="flex flex-1 flex-col gap-1">
            {NAV.map((item) => (
              <span key={item.label} aria-current={item.active ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium ${item.active ? "bg-emerald-800 text-white shadow-sm" : "text-slate-400"}`}>
                <Icon name={item.icon} className={`h-5 w-5 ${item.active ? "text-white" : "text-slate-400"}`} />
                {item.label}
              </span>
            ))}
          </nav>
          <div className="mt-6 rounded-2xl bg-[#fafaf9] p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-800 text-sm font-semibold text-white">CM</span>
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">Camille (exemple)</p><p className="truncate text-xs text-slate-500">Compte de démonstration</p></div>
            </div>
            <Link href="/inscription" className="mt-3 flex w-full items-center gap-2 rounded-lg bg-emerald-800 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-900">
              <Icon name="arrow" className="h-4 w-4" /> Créer mon espace
            </Link>
          </div>
        </aside>
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <main id="contenu-principal" className="flex-1 px-4 py-6 pb-28 sm:px-6 md:pb-10 lg:px-10 lg:py-8">
            <div className="mx-auto flex max-w-6xl flex-col">{children}</div>
          </main>
        </div>
      </div>
      <nav aria-label="Navigation mobile de démonstration" className="fixed inset-x-0 bottom-0 z-20 flex border-t border-black/[0.06] bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        {NAV.slice(0, 5).map((item) => (
          <span key={item.label} className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10.5px] font-medium ${item.active ? "text-emerald-800" : "text-slate-400"}`}>
            <Icon name={item.icon} className="h-[22px] w-[22px]" />
            {item.label.replace("Mon ", "").replace("Mes ", "")}
          </span>
        ))}
      </nav>
    </div>
  );
}
