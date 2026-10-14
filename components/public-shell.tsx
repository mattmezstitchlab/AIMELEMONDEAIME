import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Container, Logo, LogoMark } from "@/components/ui";
import { Icon } from "@/components/icon";
import { getCurrentUser } from "@/lib/auth";
import { BottomTabs } from "@/components/bottom-tabs";
import { DisplayPreferences } from "@/components/display-preferences";

/*
 * Coquille publique — refonte inspirée de Cal.com :
 *  · en-tête blanc collant, hairline, navigation centrée courte et un CTA noir ;
 *  · pied de page sombre, en colonnes, qui referme la page ;
 *  · tout le reste du site vit sur un fond papier clair.
 */

const WEDDING_PATH = "/accompagnement?besoin=mariage";

/** Entrées principales : le mariage d'abord, le reste rangé dans un menu. */
const PRIMARY = [
  { href: WEDDING_PATH, label: "Préparer mon mariage" },
  { href: "/informations/mariage", label: "Guides mariage" },
];

/** Menu « Tous les services » : les situations, les thèmes et les ressources. */
const SERVICES_MENU: Array<{ group: string; items: Array<{ href: string; label: string }> }> = [
  {
    group: "Accompagnement",
    items: [
      { href: "/accompagnement", label: "Toutes les situations" },
      { href: "/accompagnement?besoin=famille", label: "Famille et démarches après l’union" },
      { href: "/accompagnement?besoin=evenement", label: "Événements et artistes" },
      { href: "/accompagnement?besoin=paiement", label: "Budget et difficultés de paiement" },
      { href: "/accompagnement?besoin=demenagement", label: "Logement et déménagement" },
      { href: "/accompagnement?besoin=proche", label: "Santé, handicap et proches" },
    ],
  },
  {
    group: "S’informer",
    items: [
      { href: "/informations", label: "Tous les guides et sujets" },
      { href: "/informations/famille", label: "Famille et naissance" },
      { href: "/informations/sante", label: "Santé" },
      { href: "/informations/argent", label: "Argent et difficultés" },
      { href: "/informations/logement", label: "Logement" },
      { href: "/informations/emploi", label: "Emploi et activité" },
    ],
  },
  {
    group: "Sur le territoire",
    items: [
      { href: "/le-monde-aime", label: "La carte et l’entraide" },
      { href: "/annuaire", label: "Points d’accueil" },
      { href: "/decouvrir", label: "Visiter l’espace (démonstration)" },
      { href: "/vision", label: "Notre méthode et nos limites" },
    ],
  },
];

export async function PublicHeader({ solid: _solid = false }: { solid?: boolean }) {
  const user = await getCurrentUser();
  const spaceHref = user ? (user.role === "membre" ? "/espace" : user.role === "gestionnaire" ? "/back-office" : "/admin") : "/connexion";
  const weddingStart = encodeURIComponent("/espace/demarches/nouvelle?situation=mariage");
  const createProjectHref = `/inscription?next=${weddingStart}`;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <Container wide className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="AIME® — accueil" className="shrink-0">
            <Logo withMark />
          </Link>
          <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
            {PRIMARY.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-control px-3 py-2 text-sm text-ink-2 transition hover:bg-muted hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-1 rounded-control px-3 py-2 text-sm text-ink-2 transition hover:bg-muted hover:text-ink [&::-webkit-details-marker]:hidden">
                Tous les services
                <Icon name="chevron" className="h-3.5 w-3.5 transition group-open:rotate-180" />
              </summary>
              <div className="absolute left-0 top-[calc(100%+0.6rem)] z-50 w-[46rem] max-w-[calc(100vw-3rem)] rounded-card bg-canvas p-6 shadow-lifted ring-1 ring-line">
                <div className="grid gap-6 sm:grid-cols-3">
                  {SERVICES_MENU.map((column) => (
                    <div key={column.group}>
                      <p className="eyebrow">{column.group}</p>
                      <ul className="mt-3 space-y-0.5">
                        {column.items.map((item) => (
                          <li key={item.href + item.label}>
                            <Link href={item.href} className="block rounded-control px-2.5 py-2 text-sm text-ink-2 transition hover:bg-muted hover:text-ink">
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {!user && (
            <Link href="/connexion" className="hidden rounded-control px-3 py-2 text-sm text-ink-2 transition hover:bg-muted hover:text-ink sm:block">
              Se connecter
            </Link>
          )}
          <Link
            href={user ? spaceHref : createProjectHref}
            className="inline-flex h-10 items-center gap-2 rounded-control bg-ink px-4 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition hover:bg-ink-2"
          >
            <Icon name="user" className="h-4 w-4" />
            {user ? "Mon espace" : "Créer mon espace"}
          </Link>
          <details className="group relative lg:hidden">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-control text-ink-2 ring-1 ring-line transition hover:bg-muted [&::-webkit-details-marker]:hidden">
              <span className="sr-only">Ouvrir le menu</span>
              <Icon name="menu" className="h-5 w-5" />
            </summary>
            <nav
              aria-label="Navigation mobile"
              className="absolute right-0 top-[calc(100%+0.6rem)] max-h-[75vh] w-[min(22rem,calc(100vw-2.5rem))] overflow-y-auto rounded-card bg-canvas p-4 shadow-lifted ring-1 ring-line"
            >
              <ul className="space-y-0.5">
                {PRIMARY.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="block rounded-control px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-muted">
                      {item.label}
                    </Link>
                  </li>
                ))}
                {!user && (
                  <li>
                    <Link href="/connexion" className="block rounded-control px-3 py-2.5 text-sm text-ink-2 transition hover:bg-muted">
                      Se connecter
                    </Link>
                  </li>
                )}
              </ul>
              <div className="mt-4 space-y-5 border-t border-line pt-4">
                {SERVICES_MENU.map((column) => (
                  <div key={column.group}>
                    <p className="eyebrow px-3">{column.group}</p>
                    <ul className="mt-2 space-y-0.5">
                      {column.items.map((item) => (
                        <li key={item.href + item.label}>
                          <Link href={item.href} className="block rounded-control px-3 py-2 text-sm text-ink-2 transition hover:bg-muted hover:text-ink">
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </nav>
          </details>
        </div>
      </Container>
    </header>
  );
}

const FOOTER_COLUMNS: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
  {
    title: "Mariage",
    links: [
      { href: WEDDING_PATH, label: "Parcours mariage complet" },
      { href: "/informations/mariage", label: "Guides mariage" },
      { href: "/accompagnement?besoin=mariage", label: "Démarches à la mairie" },
      { href: "/espace/demarches/nouvelle?situation=mariage", label: "Préparer dans Mon espace" },
      { href: "/inscription", label: "Créer mon espace" },
    ],
  },
  {
    title: "Accompagnement",
    links: [
      { href: "/accompagnement", label: "Tous les accompagnements" },
      { href: "/accompagnement?besoin=famille", label: "Famille et après l’union" },
      { href: "/accompagnement?besoin=evenement", label: "Événements et artistes" },
      { href: "/accompagnement?besoin=paiement", label: "Budget et difficultés" },
      { href: "/accompagnement?besoin=demenagement", label: "Logement et déménagement" },
      { href: "/accompagnement?besoin=proche", label: "Santé, handicap et proches" },
    ],
  },
  {
    title: "S’informer et se repérer",
    links: [
      { href: "/informations", label: "Tous les guides et sujets" },
      { href: "/annuaire", label: "Points d’accueil" },
      { href: "/le-monde-aime", label: "Ressources locales et entraide" },
      { href: "/decouvrir", label: "Découvrir la démonstration" },
      { href: "/vision", label: "Notre méthode et nos limites" },
      { href: "/connexion", label: "Connexion" },
    ],
  },
];

export function PublicFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto bg-night text-white/70">
      <Container wide className="py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_repeat(3,minmax(0,1fr))] lg:gap-12">
          <div className="max-w-sm">
            <Link href="/" aria-label="AIME® — accueil" className="inline-block">
              <Logo light />
            </Link>
            <p className="mt-5 text-sm leading-relaxed text-white/60">
              La terre, les arts et les générations. Une plateforme indépendante qui réunit l’information du quotidien,
              l’accompagnement des démarches et les ressources du territoire.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs text-white/60">
              <LogoMark className="h-6 w-6" tone="light" />
              <span>Prototype de démonstration · non affilié à un organisme public</span>
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="font-display text-xs uppercase tracking-[0.16em] text-white/55">{column.title}</p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={link.href} className="text-sm text-white/70 transition hover:text-white hover:underline hover:underline-offset-4">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-white/10 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <DisplayPreferences mode="footer" onDark />
            <p className="text-xs text-white/60">Aucun courriel n’est envoyé par AIME® · aucune réservation, déclaration ni transaction.</p>
          </div>
          <p className="max-w-4xl text-[11px] leading-relaxed text-white/55">
            AIME® est un prototype indépendant. Les démarches officielles dépendent notamment de votre situation et de votre mairie ;
            vérifiez toujours les informations auprès des sources officielles. AIME® n’est affilié à aucun organisme et n’effectue
            aucune réservation, déclaration ou transaction.
          </p>
          <p className="text-xs text-white/60">© {year} AIME® — Le Monde Aime · prototype de démonstration</p>
        </div>
      </Container>
    </footer>
  );
}

export function PublicPage({ children, solidHeader = false }: { children: ReactNode; solidHeader?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas pb-16 md:pb-0">
      <PublicHeader solid={solidHeader} />
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

/**
 * Coquille « authentification » : formulaire à gauche sur fond papier,
 * panneau noir à droite avec la promesse et un fragment d'interface.
 */
export function AuthSplit({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col px-5 py-8 sm:px-10 sm:py-10">
        <Link href="/" aria-label="Retour à l'accueil" className="self-start">
          <Logo withMark />
        </Link>
        <main id="contenu-principal" className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md animate-fade-up">{children}</div>
        </main>
        <p className="text-xs text-ink-4">
          Prototype indépendant · AIME® ne demande jamais les mots de passe de vos comptes administratifs.
        </p>
      </div>

      <aside className="relative hidden overflow-hidden bg-night px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="cal-night-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative">
          <p className="eyebrow text-white/60">AIME® · Mon espace</p>
          <h2 className="mt-5 max-w-md text-4xl leading-tight text-white">{title}</h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/65">{subtitle}</p>
        </div>

        <div className="product-window relative mt-12 bg-white/[0.06] shadow-none ring-1 ring-white/10">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <span className="font-display text-xs uppercase tracking-[0.14em] text-white/60">Dossier civil</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/70">En cours</span>
          </div>
          <ul className="divide-y divide-white/10">
            {[
              { label: "Pièces des futurs époux", state: "Reçues" },
              { label: "Témoins et qualités", state: "Reçues" },
              { label: "Publication des bans", state: "À confirmer en mairie" },
            ].map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
                <span className="text-white/80">{row.label}</span>
                <span className="text-xs text-white/60">{row.state}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2 border-t border-white/10 px-5 py-3 text-[11px] text-white/55">
            <Icon name="lock" className="h-3.5 w-3.5" />
            Vos réponses restent privées. AIME® ne transmet rien à une mairie.
          </div>
        </div>
      </aside>
    </div>
  );
}
