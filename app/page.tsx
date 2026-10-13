import Link from "next/link";
import { PublicPage } from "@/components/public-shell";
import { Hero, LinkButton, FeatureIcon, Tag } from "@/components/ui";
import { Icon, type IconName } from "@/components/icon";
import { db } from "@/db";
import { articles, offices } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ARTICLE_CATEGORY_LABELS, THEME_META } from "@/lib/constants";
import { SITUATIONS } from "@/lib/situations";
import { OrientationEntry } from "@/components/orientation-entry";

const MOSAIC_TINT = "from-slate-950/70 via-slate-900/20 to-transparent";

const MOSAIC: Array<{ label: string; desc: string; href: string; image: string; icon: IconName }> = [
  { label: "Santé", desc: "Remboursements, arrêts de travail, prévention.", href: "/informations/sante", image: "/images/hero-sante.jpg", icon: "sante" },
  { label: "Famille", desc: "Naissance, union, séparation, prestations.", href: "/informations/famille", image: "/images/hero-famille.jpg", icon: "famille" },
  { label: "Logement", desc: "Louer, être aidé, connaître ses droits.", href: "/informations/logement", image: "/images/hero-logement.jpg", icon: "logement" },
  { label: "Retraite", desc: "Carrière, estimation, demande en ligne.", href: "/informations/retraite", image: "/images/hero-retraite.jpg", icon: "retraite" },
  { label: "Activité et cotisations", desc: "Créer, déclarer, cotiser.", href: "/informations/cotisations", image: "/images/hero-cotisations.jpg", icon: "cotisations" },
  { label: "Emploi", desc: "Embauche, recherche d'emploi, formation.", href: "/informations/emploi", image: "/images/hero-emploi.jpg", icon: "emploi" },
  { label: "Terre & quotidien", desc: "Produits locaux, dons, prêts, trajets, jardins.", href: "/le-monde-aime?univers=terre", image: "/images/univers-terre.jpg", icon: "sprout" },
  { label: "Arts & rencontres", desc: "Artistes, concerts, ateliers, lieux, matériel.", href: "/le-monde-aime?univers=arts", image: "/images/univers-arts.jpg", icon: "music" },
  { label: "Savoirs & générations", desc: "Transmission, cuisine, couture, mémoire locale.", href: "/le-monde-aime?univers=savoirs", image: "/images/univers-savoirs.jpg", icon: "graduation" },
  { label: "Événements et artistes", desc: "Organiser, engager un artiste, préparer.", href: "/le-monde-aime?univers=arts", image: "/images/hero-accueil.jpg", icon: "calendar" },
  { label: "Accompagner un proche", desc: "Autonomie, handicap, soutien aux aidants.", href: "/accompagnement", image: "/images/hero-conseiller.jpg", icon: "heart" },
  { label: "Vie administrative", desc: "Orientation et organismes de référence.", href: "/informations", image: "/images/hero-espace.jpg", icon: "shield" },
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const latestArticles = await db.select().from(articles).where(eq(articles.isPublished, true)).orderBy(desc(articles.publishedAt)).limit(3);
  const officeList = await db.select().from(offices);

  return (
    <PublicPage>
      <Hero
        size="xl"
        image="/images/hero-accueil.jpg"
        eyebrow="AIME® · Le Monde Aime"
        title={<>La terre, les arts<br />et les générations.</>}
        subtitle="Trouvez près de vous de quoi vivre, créer et transmettre. Vous expliquez votre situation : AIME® vous aide à trouver les personnes, les ressources et les démarches pour avancer."
        actions={
          <>
            <LinkButton href="/inscription">
              Créer mon espace
              <Icon name="arrow" className="h-4 w-4" />
            </LinkButton>
            <LinkButton href="/le-monde-aime" variant="ghost">Explorer la carte</LinkButton>
          </>
        }
      >
        <div className="mt-8 max-w-xl"><OrientationEntry variant="hero" /></div>
      </Hero>

      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-16 px-6 py-32 sm:grid-cols-3 sm:gap-12 lg:py-40">
          <FeatureIcon name="book" label="Une entrée par le besoin" text="Inutile de connaître l'organisme compétent : quelques questions suffisent pour être orienté." />
          <FeatureIcon name="timer" label="Un seul espace" text="Vos démarches, projets, échanges et documents reliés dans AIME®. Aucune transmission automatique à un organisme externe." />
          <FeatureIcon name="refresh" label="Des personnes près de vous" text="Producteurs, artistes, voisins et associations, sur la même carte." />
        </div>
        <p className="mx-auto -mt-16 max-w-3xl px-6 pb-24 text-center text-sm text-slate-600 lg:pb-28">Un prototype indépendant, transparent sur ce qui fonctionne et sur ce qui reste à vérifier. <Link href="/vision" className="font-semibold text-slate-900 underline underline-offset-4 hover:text-slate-700">Lire notre méthode et nos limites</Link>.</p>
      </section>

      <section className="bg-[#fafaf9]">
        <div className="mx-auto max-w-7xl px-6 py-32 lg:px-8 lg:py-40">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">Informations et univers</p>
            <h2 className="mt-4 text-4xl font-bold leading-[1.1] text-[#1d1d1f] sm:text-5xl">Tout ce qui compte, par thématique.</h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">Les sujets du quotidien et les univers de Le Monde Aime, au même endroit.</p>
          </div>
        </div>
        <div className="grid grid-cols-2">
          {MOSAIC.map((t) => (
            <Link key={t.label} href={t.href} className="group relative isolate flex aspect-square flex-col justify-end overflow-hidden p-6 focus-visible:z-10 sm:p-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.image} alt="" className="absolute inset-0 z-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className={`absolute inset-0 z-10 bg-gradient-to-t ${MOSAIC_TINT}`} />
              <span className="relative z-20 mb-auto grid h-11 w-11 place-items-center rounded-xl bg-white/15 text-white backdrop-blur"><Icon name={t.icon} className="h-5 w-5" /></span>
              <h3 className="relative z-20 text-xl font-bold leading-tight text-white sm:text-3xl">{t.label}</h3>
              <p className="relative z-20 mt-2 text-sm leading-relaxed text-white/85 sm:text-base">{t.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-32 lg:px-8 lg:py-40">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">Être accompagné</p>
              <h2 className="mt-4 text-4xl font-bold leading-[1.1] text-[#1d1d1f] sm:text-5xl">De quoi avez-vous besoin aujourd&apos;hui ?</h2>
              <p className="mt-6 text-lg leading-relaxed text-slate-600">Inutile de connaître l&apos;organisme compétent. Choisissez votre situation : AIME® réunit les interlocuteurs, les étapes et les ressources dans un seul endroit.</p>
            </div>
            <LinkButton href="/accompagnement" variant="ghost" className="!border-slate-300 !bg-white !text-emerald-800 hover:!bg-emerald-50">Voir l&apos;accompagnement <Icon name="arrow" className="h-4 w-4" /></LinkButton>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SITUATIONS.map((s) => (
              <Link key={s.key} href={`/espace/demarches/nouvelle?situation=${s.key}`} className="group relative flex flex-col rounded-3xl bg-[#fafaf9] p-7 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:ring-1 hover:ring-emerald-200">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-800 transition group-hover:bg-emerald-800 group-hover:text-white"><Icon name={s.icon} className="h-6 w-6" /></span>
                <span className="mt-6 text-lg font-bold leading-snug text-slate-900">{s.label}</span>
                <span className="mt-2 text-sm leading-relaxed text-slate-600">{s.description}</span>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800">{s.pilot ? "Parcours complet" : "Être orienté"} <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" /></span>
              </Link>
            ))}
          </div>
          <div className="mt-16 overflow-hidden rounded-[32px] bg-emerald-950 px-8 py-14 text-center text-white sm:px-16">
            <h3 className="text-2xl font-bold sm:text-3xl">Envie de voir à quoi ressemble « Mon espace » ?</h3>
            <p className="mx-auto mt-3 max-w-xl text-white/80">Parcourez une démonstration complète, sans créer de compte.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/decouvrir" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-emerald-950 hover:bg-emerald-50">Découvrir l&apos;espace (démo) <Icon name="arrow" className="h-4 w-4" /></Link>
              <Link href="/inscription" className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">Créer mon espace</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fafaf9]">
        <div className="mx-auto max-w-7xl px-6 py-32 lg:px-8 lg:py-40">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="text-4xl font-bold text-[#1d1d1f] sm:text-5xl">Derniers guides.</h2>
            <Link href="/informations?vue=guides" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline">
              Tous les guides <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {latestArticles.map((article) => (
              <Link key={article.id} href={`/guides/${article.slug}`} className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/[0.04] transition hover:-translate-y-1 hover:shadow-lg">
                <div className="h-48 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={THEME_META[article.category]?.image ?? "/images/hero-accueil.jpg"} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                </div>
                <div className="p-7">
                  <Tag>{ARTICLE_CATEGORY_LABELS[article.category] ?? article.category}</Tag>
                  <h3 className="mt-4 text-lg font-semibold leading-snug text-[#1d1d1f]">{article.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">{article.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-32 text-center lg:py-40">
          <p className="text-2xl leading-relaxed text-slate-600">Trouvez un point d&apos;accueil parmi {officeList.length} lieux de démonstration :</p>
          <form action="/annuaire" role="search" className="mx-auto mt-10 flex max-w-xl overflow-hidden rounded-2xl bg-[#fafaf9] shadow-sm ring-1 ring-black/[0.05]">
            <label htmlFor="home-q" className="sr-only">Ville ou code postal</label>
            <input id="home-q" name="q" placeholder="Ville ou code postal" className="min-w-0 flex-1 bg-transparent px-6 py-5 text-base outline-none" />
            <button type="submit" className="bg-emerald-800 px-8 text-base font-semibold text-white hover:bg-emerald-900">Rechercher</button>
          </form>
        </div>
      </section>
    </PublicPage>
  );
}
