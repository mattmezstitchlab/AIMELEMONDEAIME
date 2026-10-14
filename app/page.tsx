import Link from "next/link";
import { PublicPage } from "@/components/public-shell";
import { Hero, LinkButton, Tag } from "@/components/ui";
import { Icon } from "@/components/icon";
import { db, isDatabaseConfigured } from "@/db";
import { articles } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { ARTICLE_CATEGORY_LABELS, THEME_META } from "@/lib/constants";

export const dynamic = "force-dynamic";

type ArticleRow = typeof articles.$inferSelect;

const PROJECT_FEATURES = [
  {
    icon: "users" as const,
    title: "Invités et RSVP",
    text: "Suivez les réponses foyer par foyer. Chaque lien RSVP est limité au foyer concerné, temporaire et révocable.",
  },
  {
    icon: "shield" as const,
    title: "Proches organisateurs",
    text: "Donnez à chaque proche un accès limité au projet et au rôle confié, avec un lien temporaire que vous pouvez révoquer.",
  },
  {
    icon: "calendar" as const,
    title: "Budget et jour J",
    text: "Rassemblez les devis, le programme, les contributions et le plan de table ; retrouvez une page du jour J à consulter ou imprimer.",
  },
];

const PHASES = [
  {
    number: "01",
    icon: "calendar" as const,
    title: "D’abord, les démarches à la mairie",
    text: "Date, commune, dossier civil, pièces et délais : vérifiez les modalités directement auprès de votre mairie.",
    href: "/accompagnement?besoin=mariage",
    linkLabel: "Commencer le parcours",
  },
  {
    number: "02",
    icon: "heart" as const,
    title: "La fête, si vous en souhaitez une",
    text: "En parallèle du civil, choisissez librement ce qui vous convient : lieu, repas, musique, photos ou aucune réception.",
    href: "#projet-mariage",
    linkLabel: "Voir les options facultatives",
  },
  {
    number: "03",
    icon: "users" as const,
    title: "Le jour J et les proches",
    text: "Si vous le souhaitez, coordonnez invités, réponses, programme, budget et coups de main dans un projet partagé.",
    href: "#projet-mariage",
    linkLabel: "Découvrir l’espace de préparation",
  },
  {
    number: "04",
    icon: "refresh" as const,
    title: "Après l’union",
    text: "Retrouvez les repères utiles après le mariage, à adapter à votre situation et à vérifier auprès des organismes concernés.",
    href: "/informations/mariage",
    linkLabel: "Voir les guides mariage",
  },
];

async function getWeddingGuides(): Promise<ArticleRow[]> {
  if (!isDatabaseConfigured) return [];
  try {
    return await db
      .select()
      .from(articles)
      .where(and(eq(articles.category, "mariage"), eq(articles.isPublished, true)))
      .orderBy(desc(articles.publishedAt))
      .limit(3);
  } catch {
    return [];
  }
}

function ArticleCard({ article }: { article: ArticleRow }) {
  return (
    <Link href={`/guides/${article.slug}`} className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.05] transition hover:-translate-y-1 hover:shadow-lg">
      <div className="h-44 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={THEME_META[article.category]?.image ?? "/images/hero-mariage.jpg"}
          alt=""
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
      </div>
      <div className="p-6">
        <Tag>{article.kind === "guide" ? "Guide pratique" : ARTICLE_CATEGORY_LABELS[article.category] ?? "Mariage"}</Tag>
        <h3 className="mt-4 text-lg font-bold leading-snug text-slate-900">{article.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{article.summary}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
          Lire le guide<Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const weddingGuides = await getWeddingGuides();

  return (
    <PublicPage>
      <Hero
        size="xl"
        image="/images/hero-mariage.jpg"
        gradient="wedding"
        eyebrow="AIME® · MARIAGE"
        title={<>Votre mariage,<br />étape par étape.</>}
        subtitle="D’abord les démarches civiles. Puis, si vous le souhaitez, la fête et sa coordination. Enfin, les repères après l’union."
        actions={
          <>
            <LinkButton href="/accompagnement?besoin=mariage">
              Commencer le parcours mariage<Icon name="arrow" className="h-4 w-4" />
            </LinkButton>
            <LinkButton href="#etapes-mariage" variant="ghost">Voir les étapes</LinkButton>
          </>
        }
      >
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/80">
          Cérémonie civile seule ou journée de fête : vous choisissez les étapes qui vous concernent. AIME® ne transmet rien à une mairie et n’effectue aucune réservation ni paiement.
        </p>
      </Hero>

      <section id="etapes-mariage" className="bg-white scroll-mt-20">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">Le parcours mariage, dans l’ordre</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-[#1d1d1f] sm:text-4xl">Du dossier civil aux suites de l’union.</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Commencez par la mairie, ajoutez seulement les options de fête qui vous correspondent, puis retrouvez les repères pour le jour J et l’après-mariage.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {PHASES.map((phase) => (
              <Link key={phase.number} href={phase.href} className="group rounded-2xl bg-[#fafaf9] p-6 transition hover:bg-white hover:shadow-lg hover:ring-1 hover:ring-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-[0.16em] text-slate-500">ÉTAPE {phase.number}</span>
                  <Icon name={phase.icon} className="h-6 w-6 text-slate-700" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-slate-900">{phase.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{phase.text}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                  {phase.linkLabel}<Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="projet-mariage" className="scroll-mt-20 bg-[#fafaf9]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">Votre espace de préparation</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight text-[#1d1d1f] sm:text-4xl">Tout au même endroit, chacun·e à sa juste place.</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Si vous préparez une fête, le projet partagé aide à coordonner les invités et les proches, du premier RSVP au jour J. La cérémonie civile seule reste un parcours complet.
              </p>
            </div>
            <LinkButton href="/accompagnement?besoin=mariage">
              Préparer mon mariage<Icon name="arrow" className="h-4 w-4" />
            </LinkButton>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PROJECT_FEATURES.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
                <Icon name={feature.icon} className="h-7 w-7 text-slate-700" />
                <h3 className="mt-4 text-lg font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.text}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
            <Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0" />
            Vos réponses au parcours et vos documents personnels restent privés : les invités et les proches organisateurs n’y ont pas accès. AIME® ne réserve, ne paie et ne transmet rien à votre place.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center lg:px-8 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">À votre rythme</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold leading-tight text-[#1d1d1f] sm:text-4xl">Commencez par la prochaine étape, pas par tout le reste.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600">Le parcours garde le fil du dossier civil, des options de fête que vous choisissez et des repères après l’union.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <LinkButton href="/accompagnement?besoin=mariage">Commencer le parcours mariage<Icon name="arrow" className="h-4 w-4" /></LinkButton>
            <LinkButton href="/informations/mariage" variant="ghost">Lire les guides mariage</LinkButton>
          </div>
        </div>
      </section>

      {weddingGuides.length > 0 && (
        <section className="bg-[#fafaf9]">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">Pour aller plus loin</p>
                <h2 className="mt-3 text-3xl font-bold text-[#1d1d1f] sm:text-4xl">Guides pratiques pour le mariage.</h2>
              </div>
              <Link href="/informations/mariage" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 underline underline-offset-4">
                Tous les guides<Icon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-9 grid gap-6 md:grid-cols-3">
              {weddingGuides.map((article) => <ArticleCard key={article.id} article={article} />)}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-black/[0.06] bg-white">
        <div className="mx-auto max-w-4xl px-6 py-12 text-center">
          <p className="text-xs leading-relaxed text-slate-500">
            AIME® est un prototype indépendant. Les démarches officielles dépendent notamment de votre situation et de votre mairie ; vérifiez toujours les informations auprès des sources officielles. AIME® n’est affilié à aucun organisme et n’effectue aucune réservation, déclaration ou transaction.
          </p>
        </div>
      </section>
    </PublicPage>
  );
}
