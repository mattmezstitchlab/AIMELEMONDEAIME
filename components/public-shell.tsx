import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Logo } from "@/components/ui";
import { Icon } from "@/components/icon";
import { getCurrentUser } from "@/lib/auth";
import { BottomTabs } from "@/components/bottom-tabs";

// Navigation principale centrée sur le parcours mariage ; les autres services restent accessibles discrètement en pied de page.
const PRIMARY = [
  { href: "/accompagnement?besoin=mariage", label: "Préparer mon mariage" },
  { href: "/informations/mariage", label: "Guides mariage" },
];

export async function PublicHeader({ solid = false }: { solid?: boolean }) {
  const user = await getCurrentUser();
  const spaceHref = user ? (user.role === "membre" ? "/espace" : user.role === "gestionnaire" ? "/back-office" : "/admin") : "/connexion";
  const weddingStart = encodeURIComponent("/espace/demarches/nouvelle?situation=mariage");
  const createProjectHref = `/inscription?next=${weddingStart}`;
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
          {!user && <Link href="/connexion" className={`text-sm font-medium transition ${text}`}>Connexion</Link>}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href={user ? spaceHref : createProjectHref}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900"
          >
            <Icon name="user" className="h-4 w-4" />
            {user ? "Mon espace" : "Créer mon projet"}
          </Link>
          <details className="relative lg:hidden">
            <summary className={`flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg backdrop-blur [&::-webkit-details-marker]:hidden ${solid ? "bg-slate-100 text-slate-800" : "bg-white/15 text-white"}`}>
              <span className="sr-only">Ouvrir le menu</span>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </summary>
            <nav aria-label="Navigation mobile" className="absolute right-0 mt-2 max-h-[75vh] w-72 overflow-y-auto rounded-2xl bg-white p-2 shadow-xl">
              {PRIMARY.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2.5 text-sm font-bold text-emerald-800 hover:bg-[#fafaf9]">{item.label}</Link>
              ))}
              {!user && <Link href="/connexion" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-[#fafaf9]">Connexion</Link>}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

const OTHER_SERVICE_LINKS = [
  { href: "/accompagnement?besoin=evenement", label: "Événements et artistes (facultatif)" },
  { href: "/accompagnement?besoin=famille", label: "Famille et démarches après l’union" },
  { href: "/accompagnement?besoin=paiement", label: "Budget et difficultés de paiement" },
  { href: "/accompagnement?besoin=demenagement", label: "Logement et déménagement" },
  { href: "/accompagnement?besoin=proche", label: "Santé, handicap et proches" },
  { href: "/le-monde-aime", label: "Ressources locales et entraide" },
  { href: "/informations", label: "Tous les guides et sujets" },
  { href: "/accompagnement", label: "Tous les accompagnements" },
  { href: "/annuaire", label: "Points d’accueil" },
  { href: "/decouvrir", label: "Découvrir la démonstration" },
  { href: "/vision", label: "Notre méthode et nos limites" },
  { href: "/connexion", label: "Connexion" },
];

export function PublicFooter() {
  return (
    <footer className="bg-[#f7f7f5]">
      <div className="mx-auto max-w-6xl px-6 py-10 text-center sm:py-12">
        <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
          <Link href="/" aria-label="AIME® — accueil"><Logo /></Link>
          <nav aria-label="Liens mariage" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link href="/accompagnement?besoin=mariage" className="font-semibold text-emerald-800 hover:underline">Parcours mariage complet</Link>
            <Link href="/informations/mariage" className="font-semibold text-emerald-800 hover:underline">Guides mariage</Link>
          </nav>
        </div>
        <details className="mt-6 border-t border-black/[0.06] pt-4 text-left">
          <summary className="cursor-pointer text-[11px] font-semibold text-slate-500">Autres services AIME® et sujets — accessibles séparément, non obligatoires pour le mariage</summary>
          <nav aria-label="Autres services et sujets" className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] leading-relaxed text-slate-500">
            {OTHER_SERVICE_LINKS.map((item) => <Link key={item.href} href={item.href} className="hover:text-slate-800 hover:underline">{item.label}</Link>)}
          </nav>
        </details>
        <p className="mx-auto mt-6 max-w-3xl text-[10px] leading-relaxed text-slate-500">
          AIME® est un prototype indépendant. Les démarches officielles dépendent notamment de votre situation et de votre mairie ; vérifiez toujours les informations auprès des sources officielles. AIME® n’est affilié à aucun organisme et n’effectue aucune réservation, déclaration ou transaction.
        </p>
        <p className="mt-3 text-[11px] text-slate-500">© {new Date().getFullYear()} AIME® — Le Monde Aime · prototype de démonstration</p>
      </div>
    </footer>
  );
}

export function PublicPage({ children, solidHeader = false }: { children: ReactNode; solidHeader?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col bg-white pb-16 md:pb-0">
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
 * Variante « authentification » de la coquille publique (chantier 5) :
 * panneau visuel + formulaire, sans en-tête ni pied de page. Elle remplace
 * l'ancienne troisième coquille (auth-split) — il n'en reste que deux :
 * celle-ci (publique et ses variantes) et app-shell (espaces connectés).
 */
export function AuthSplit({ image, title, subtitle, children }: { image: string; title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="grid flex-1 lg:grid-cols-2">
        <div className="relative isolate flex min-h-[320px] flex-col justify-between overflow-hidden p-8 lg:min-h-0 lg:p-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="animate-hero-zoom absolute inset-0 z-0 h-full w-full object-cover" />
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/65 via-black/25 to-black/15" />
          <Link href="/" aria-label="Retour à l'accueil" className="relative z-20 self-start">
            <Logo light />
          </Link>
          <div className="animate-fade-up relative z-20 max-w-md">
            <h1 className="text-4xl font-bold leading-tight text-white lg:text-5xl">{title}</h1>
            <p className="mt-4 text-lg text-white/85">{subtitle}</p>
          </div>
        </div>
        <main id="contenu-principal" className="flex items-center justify-center px-6 py-14 sm:px-12">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
