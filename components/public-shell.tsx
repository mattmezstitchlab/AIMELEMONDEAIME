import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Logo } from "@/components/ui";
import { Icon } from "@/components/icon";
import { BottomTabs } from "@/components/bottom-tabs";
import { DisplayPreferences } from "@/components/display-preferences";
import { AUTH_ENABLED } from "@/lib/auth-mode";

/*
 * Coquille du site public.
 *
 * Langage visuel : encre et papier. Fond blanc, une colonne étroite et centrée,
 * navigation en capitales minuscules, cartes blanches cerclées d’un filet,
 * boutons noirs. Aucune couleur décorative : le rythme vient des surfaces et
 * des contours. Les espaces de travail (Mon espace, back-office, administration)
 * partagent la même surface claire : les deux contextes ne se mélangent pas.
 */

/** Navigation courte du haut : quatre entrées, rien de plus. */
const PRIMARY = [
  { href: "/accompagnement?besoin=mariage", label: "Parcours" },
  { href: "/circuits", label: "Circuits" },
  { href: "/informations", label: "Guides" },
  { href: "/le-monde-aime", label: "Entraide" },
];

/** Colonne principale du site public : une seule largeur, centrée. */
export function PageColumn({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[46rem] px-5 sm:px-6 ${className}`}>{children}</div>;
}

export function PublicHeader() {
  const spaceHref = AUTH_ENABLED ? "/connexion" : "/mon-espace";
  const spaceLabel = AUTH_ENABLED ? "Se connecter" : "Mon espace";

  return (
    <header className="sticky top-0 z-40 bg-canvas/80 backdrop-blur-xl">
      <PageColumn className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-7">
          <Link href="/" aria-label="AIME® — accueil" className="shrink-0">
            <Logo />
          </Link>
          <nav aria-label="Navigation principale" className="hidden items-center gap-6 sm:flex">
            {PRIMARY.map((item) => (
              <Link key={item.href} href={item.href} className="nav-tiny text-ink-3 transition hover:text-ink">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/mon-espace" className="nav-tiny hidden text-ink-3 transition hover:text-ink sm:block">
            {spaceLabel}
          </Link>
          <details className="group relative sm:hidden">
            <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full text-ink-2 ring-1 ring-line transition hover:bg-muted [&::-webkit-details-marker]:hidden">
              <span className="sr-only">Ouvrir le menu</span>
              <Icon name="menu" className="h-4 w-4" />
            </summary>
            <nav
              aria-label="Navigation mobile"
              className="absolute right-0 top-[calc(100%+0.6rem)] w-[min(20rem,calc(100vw-2.5rem))] rounded-card bg-subtle p-2 ring-1 ring-line"
            >
              {[...PRIMARY, { href: spaceHref, label: spaceLabel }].map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className="block rounded-control px-3 py-2.5 text-sm text-ink-2 transition hover:bg-muted hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </PageColumn>
    </header>
  );
}

const FOOTER_LINKS: Array<{ href: string; label: string }> = [
  { href: "/accompagnement", label: "Accompagnement" },
  { href: "/le-tour", label: "Le tour du site" },
  { href: "/circuits", label: "Les sept circuits" },
  { href: "/informations", label: "Guides et sujets" },
  { href: "/le-monde-aime", label: "Entraide et transmission" },
  { href: "/annuaire", label: "Points d’accueil" },
  { href: "/vision", label: "Notre méthode" },
  { href: "/mon-espace", label: "Mon espace" },
];

export function PublicFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-line">
      <PageColumn className="py-10">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="nav-tiny text-ink-3 transition hover:text-ink">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line-soft pt-6">
          <DisplayPreferences mode="footer" />
          <p className="text-xs text-ink-4">Aucun courriel n’est envoyé par AIME® · aucune réservation ni transaction.</p>
        </div>

        <p className="mt-6 max-w-2xl text-[11px] leading-relaxed text-ink-4">
          AIME® est un prototype indépendant. Les démarches officielles dépendent de votre situation et de votre mairie ; vérifiez
          toujours les informations auprès des sources officielles. AIME® n’est affilié à aucun organisme et n’effectue aucune
          réservation, déclaration ou transaction.
        </p>
        <p className="mt-3 text-[11px] text-ink-4">© {year} AIME® — Le Monde Aime · prototype de démonstration</p>
      </PageColumn>
    </footer>
  );
}

/** `solidHeader` n’a plus d’effet : l’en-tête public est opaque en permanence. */
export function PublicPage({ children }: { children: ReactNode; solidHeader?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas pb-20 text-ink-2 md:pb-0">
      <PublicHeader />
      <main id="contenu-principal" className="flex-1">
        {children}
      </main>
      <PublicFooter />
      <Suspense fallback={null}>
        <BottomTabs />
      </Suspense>
    </div>
  );
}
