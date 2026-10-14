import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui";
import { Icon } from "@/components/icon";

/*
 * Coquille des pages de compte (connexion, inscription).
 *
 * Elle n’est plus utilisée tant que les comptes sont fermés
 * (`AIME_AUTH_ENABLED` absent, voir lib/auth-mode.ts) mais reste en place et
 * testée : réactiver l’authentification rebranche ces pages sans réécriture.
 * Même surface claire que le reste du site : encre et papier, sans registre séparé.
 */
export function AuthSplit({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col px-5 py-8 sm:px-10 sm:py-10">
        <Link href="/" aria-label="Retour à l’accueil" className="self-start">
          <Logo withMark />
        </Link>
        <main id="contenu-principal" className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md animate-fade-up">{children}</div>
        </main>
        <p className="text-xs text-ink-4">
          Prototype indépendant · AIME® ne demande jamais les mots de passe de vos comptes administratifs.
        </p>
      </div>

      <aside className="relative hidden overflow-hidden bg-ink px-12 py-14 text-canvas lg:flex lg:flex-col lg:justify-between">
        <div className="relative">
          <p className="eyebrow text-canvas/55">AIME® · Mon espace</p>
          <h2 className="mt-5 max-w-md text-4xl leading-tight text-canvas">{title}</h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-canvas/70">{subtitle}</p>
        </div>

        <div className="product-window relative mt-12 bg-canvas/[0.06] shadow-none ring-1 ring-white/10">
          <div className="flex items-center justify-between border-b border-canvas/10 px-5 py-3">
            <span className="font-display text-xs uppercase tracking-[0.14em] text-canvas/60">Dossier civil</span>
            <span className="rounded-full bg-canvas/10 px-2.5 py-1 text-[11px] text-canvas/70">En cours</span>
          </div>
          <ul className="divide-y divide-white/10">
            {[
              { label: "Pièces des futurs époux", state: "Reçues" },
              { label: "Témoins et qualités", state: "Reçues" },
              { label: "Publication des bans", state: "À confirmer en mairie" },
            ].map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
                <span className="text-canvas/80">{row.label}</span>
                <span className="text-xs text-canvas/55">{row.state}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2 border-t border-canvas/10 px-5 py-3 text-[11px] text-canvas/55">
            <Icon name="lock" className="h-3.5 w-3.5" />
            Vos réponses restent privées. AIME® ne transmet rien à une mairie.
          </div>
        </div>
      </aside>
    </div>
  );
}
