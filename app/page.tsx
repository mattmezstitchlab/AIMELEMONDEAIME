import Link from "next/link";
import { PublicPage } from "@/components/public-shell";
import { Hero, LinkButton, FeatureIcon, Tag, FamilyMark, CategoryLegend } from "@/components/ui";
import { Icon, type IconName } from "@/components/icon";
import { db } from "@/db";
import { articles, offices } from "@/db/schema";
import { and, desc, eq, inArray, notInArray } from "drizzle-orm";
import { ARTICLE_CATEGORY_LABELS, FEATURED_GUIDE_SLUGS, THEME_TONE, type ColorFamily } from "@/lib/constants";
import { SITUATIONS } from "@/lib/situations";
import { OrientationEntry } from "@/components/orientation-entry";

type MosaicItem = { label: string; desc: string; href: string; icon: IconName; family: ColorFamily };

/** Index des thématiques : une ligne par sujet, repérée par une forme et un libellé (aucune image). */
const MOSAIC: MosaicItem[] = [
  { label: "Santé", desc: "Remboursements, arrêts de travail, prévention.", href: "/informations/sante", icon: "sante", family: "demarche" },
  { label: "Famille", desc: "Naissance, union, séparation, prestations.", href: "/informations/famille", icon: "famille", family: "demarche" },
  { label: "Mariage", desc: "Le mariage de bout en bout : dossier, invités, budget, jour J.", href: "/informations/mariage", icon: "heart", family: "arts" },
  { label: "Logement", desc: "Louer, être aidé, connaître ses droits.", href: "/informations/logement", icon: "logement", family: "demarche" },
  { label: "Argent et difficultés", desc: "Factures, loyer, crédits, impôts : les premiers gestes et les interlocuteurs gratuits.", href: "/informations/argent", icon: "paiements", family: "demarche" },
  { label: "Retraite", desc: "Carrière, estimation, demande en ligne.", href: "/informations/retraite", icon: "retraite", family: "demarche" },
  { label: "Activité et cotisations", desc: "Créer, déclarer, cotiser.", href: "/informations/cotisations", icon: "cotisations", family: "demarche" },
  { label: "Emploi", desc: "Embauche, recherche d'emploi, formation.", href: "/informations/emploi", icon: "emploi", family: "demarche" },
  { label: "Terre & quotidien", desc: "Produits locaux, dons, prêts, trajets, jardins.", href: "/le-monde-aime?univers=terre", icon: "sprout", family: "terre" },
  { label: "Arts & rencontres", desc: "Artistes, concerts, ateliers, lieux, matériel.", href: "/le-monde-aime?univers=arts", icon: "music", family: "arts" },
  { label: "Savoirs & générations", desc: "Transmission, cuisine, couture, mémoire locale.", href: "/le-monde-aime?univers=savoirs", icon: "graduation", family: "savoirs" },
  { label: "Événements et artistes", desc: "Organiser, engager un artiste, préparer.", href: "/le-monde-aime?univers=arts", icon: "calendar", family: "arts" },
  { label: "Accompagner un proche", desc: "Autonomie, handicap, soutien aux aidants.", href: "/accompagnement", icon: "heart", family: "demarche" },
  { label: "Vie administrative", desc: "Orientation et organismes de référence.", href: "/informations", icon: "shield", family: "encre" },
];

export const dynamic = "force-dynamic";

type ArticleRow = typeof articles.$inferSelect;

function ArticleCard({ article }: { article: ArticleRow }) {
  return (
    <Link href={`/guides/${article.slug}`} className="group flex flex-col gap-5 border-t-2 border-encre pt-6 transition hover:bg-[#fafaf9]">
      <div className="flex items-center gap-3">
        <FamilyMark family={THEME_TONE[article.category] ?? "encre"} chip />
        <Tag>{ARTICLE_CATEGORY_LABELS[article.category] ?? article.category}</Tag>
      </div>
      <h3 className="text-2xl font-bold leading-tight tracking-[-0.02em] text-encre group-hover:underline group-hover:underline-offset-4">{article.title}</h3>
      <p className="line-clamp-3 text-base leading-relaxed text-slate-600">{article.summary}</p>
      <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-encre">Lire le guide <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" /></span>
    </Link>
  );
}

export default async function HomePage() {
  const featuredRows = await db.select().from(articles).where(and(eq(articles.isPublished, true), inArray(articles.slug, [...FEATURED_GUIDE_SLUGS])));
  const featuredArticles = FEATURED_GUIDE_SLUGS.map((slug) => featuredRows.find((a) => a.slug === slug)).filter((a): a is ArticleRow => Boolean(a));
  const latestArticles = await db.select().from(articles).where(and(eq(articles.isPublished, true), notInArray(articles.slug, [...FEATURED_GUIDE_SLUGS]))).orderBy(desc(articles.publishedAt)).limit(3);
  const officeList = await db.select().from(offices);

  return (
    <PublicPage>
      <Hero
        size="xl"
        tone="encre"
        eyebrow="AIME® · Le Monde Aime"
        title={<>La terre, les arts<br />et les générations.</>}
        subtitle="Trouvez près de vous de quoi vivre, créer et transmettre. Dites votre situation : AIME® vous oriente vers les personnes, les ressources et les démarches pour avancer."
        footer={
          <ol className="grid gap-10 text-white sm:grid-cols-3">
            {[
              { family: "terre" as const, title: "La terre", text: "Produits locaux, dons, prêts, jardins." },
              { family: "arts" as const, title: "Les arts", text: "Artistes, ateliers, événements, lieux." },
              { family: "savoirs" as const, title: "Les générations", text: "Transmission, cuisine, mémoire locale." },
            ].map((item, i) => (
              <li key={item.title} className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <FamilyMark family={item.family} chip />
                  <span className="text-sm font-bold tabular-nums text-white/70">0{i + 1}</span>
                </div>
                <p className="text-2xl font-bold tracking-[-0.02em]">{item.title}</p>
                <p className="text-base text-white/80">{item.text}</p>
              </li>
            ))}
          </ol>
        }
      >
        <div className="mt-8 max-w-xl"><OrientationEntry variant="hero" /></div>
        <p className="mt-5 text-sm text-white/75">
          <Link href="/inscription" className="font-semibold text-white underline underline-offset-4 hover:text-emerald-200">Créer mon espace</Link>
          <span aria-hidden="true" className="mx-2 text-white/40">·</span>
          <Link href="/decouvrir" className="font-semibold text-white underline underline-offset-4 hover:text-emerald-200">Découvrir la démo</Link>
          <span aria-hidden="true" className="mx-2 text-white/40">·</span>
          <Link href="/le-monde-aime" className="font-semibold text-white underline underline-offset-4 hover:text-emerald-200">Explorer la carte</Link>
        </p>
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
        <div className="mx-auto mt-16 max-w-7xl px-6 lg:px-8">
          <CategoryLegend />
          <ol className="mt-16 border-t-2 border-encre">
            {MOSAIC.map((t, i) => (
              <li key={t.label} className="border-b border-slate-300">
                <Link href={t.href} className="group grid grid-cols-[2.5rem_1fr] items-baseline gap-x-4 gap-y-3 py-7 transition hover:bg-white md:grid-cols-12 md:gap-6">
                  <span className="text-sm font-bold tabular-nums text-slate-500 md:col-span-1">0{i + 1}</span>
                  <span className="flex items-center gap-4 md:col-span-4">
                    <FamilyMark family={t.family} chip />
                    <span className="text-2xl font-bold leading-tight tracking-[-0.02em] text-encre group-hover:underline group-hover:underline-offset-4 sm:text-3xl">{t.label}</span>
                  </span>
                  <span className="col-start-2 text-base leading-relaxed text-slate-600 md:col-span-6 md:col-start-auto">{t.desc}</span>
                  <span className="col-start-2 md:col-span-1 md:col-start-auto md:justify-self-end"><Icon name="arrow" className="h-5 w-5 transition group-hover:translate-x-1" /></span>
                </Link>
              </li>
            ))}
          </ol>
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

      {featuredArticles.length > 0 ? (
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-32 lg:px-8 lg:py-40">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">Les guides essentiels</p>
              <h2 className="mt-4 text-4xl font-bold leading-[1.1] text-[#1d1d1f] sm:text-5xl">Guides à la une.</h2>
              <p className="mt-6 text-lg leading-relaxed text-slate-600">Un guide d&apos;entrée par grande thématique, choisi durablement : mariage, famille, santé, argent, logement, retraite.</p>
            </div>
            <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {featuredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

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
              <ArticleCard key={article.id} article={article} />
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
