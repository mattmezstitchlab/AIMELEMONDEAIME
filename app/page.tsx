import Link from "next/link";
import { PublicPage } from "@/components/public-shell";
import { Container, Hero, LinkButton, SectionHeading, Tag } from "@/components/ui";
import { Icon } from "@/components/icon";
import { BudgetMock, ChecklistMock, GuestListMock, RolesMock, TimelineMock, WeddingDossierMock } from "@/components/marketing/mocks";
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
    mock: <GuestListMock />,
  },
  {
    icon: "shield" as const,
    title: "Proches organisateurs",
    text: "Donnez à chaque proche un accès limité au projet et au rôle confié, avec un lien temporaire que vous pouvez révoquer.",
    mock: <RolesMock />,
  },
  {
    icon: "calendar" as const,
    title: "Budget et jour J",
    text: "Rassemblez les devis, le programme, les contributions et le plan de table ; retrouvez une page du jour J à consulter ou imprimer.",
    mock: <BudgetMock />,
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
    mock: (
      <ChecklistMock
        items={[
          { label: "Commune et date choisies", done: true },
          { label: "Pièces d’identité réunies", done: true },
          { label: "Témoins prévenus" },
          { label: "Bans publiés" },
        ]}
      />
    ),
  },
  {
    number: "02",
    icon: "heart" as const,
    title: "La fête, si vous en souhaitez une",
    text: "En parallèle du civil, choisissez librement ce qui vous convient : lieu, repas, musique, photos ou aucune réception.",
    href: "#projet-mariage",
    linkLabel: "Voir les options facultatives",
    mock: (
      <ChecklistMock
        items={[
          { label: "Réception, ou rien du tout", done: true },
          { label: "Repas et boissons" },
          { label: "Musique ou silence" },
          { label: "Photos et remerciements" },
        ]}
      />
    ),
  },
  {
    number: "03",
    icon: "users" as const,
    title: "Le jour J et les proches",
    text: "Si vous le souhaitez, coordonnez invités, réponses, programme, budget et coups de main dans un projet partagé.",
    href: "#projet-mariage",
    linkLabel: "Découvrir l’espace de préparation",
    mock: <TimelineMock />,
  },
  {
    number: "04",
    icon: "refresh" as const,
    title: "Après l’union",
    text: "Retrouvez les repères utiles après le mariage, à adapter à votre situation et à vérifier auprès des organismes concernés.",
    href: "/informations/mariage",
    linkLabel: "Voir les guides mariage",
    mock: (
      <ChecklistMock
        items={[
          { label: "Livret de famille" },
          { label: "Changement de nom, si souhaité" },
          { label: "Organismes à prévenir" },
          { label: "Remerciements" },
        ]}
      />
    ),
  },
];

/** Repères factuels affichés sous le hero : ce que l'outil fait, et ne fait pas. */
const GUARANTEES = [
  "Aucune démarche n’est transmise à une mairie ou à un organisme.",
  "Les liens des invités et des proches sont temporaires et révocables.",
  "Les sources officielles restent la référence : AIME® ne décide rien.",
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
    <Link
      href={`/guides/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-card bg-canvas shadow-rested ring-1 ring-line transition hover:shadow-hover"
    >
      <div className="border-b border-line p-2">
        <div className="overflow-hidden rounded-control">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={THEME_META[article.category]?.image ?? "/images/hero-mariage.jpg"}
            alt=""
            className="h-44 w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <Tag>{article.kind === "guide" ? "Guide pratique" : ARTICLE_CATEGORY_LABELS[article.category] ?? "Mariage"}</Tag>
        <h3 className="mt-4 text-xl leading-snug text-ink">{article.title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-3">{article.summary}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-ink">
          Lire le guide
          <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
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
        eyebrow="AIME® · Mariage"
        title={<>Votre mariage,<br />étape par étape.</>}
        subtitle="D’abord les démarches civiles. Puis, si vous le souhaitez, la fête et sa coordination. Enfin, les repères après l’union."
        actions={
          <>
            <LinkButton href="/accompagnement?besoin=mariage" size="lg">
              Commencer le parcours mariage
              <Icon name="arrow" className="h-4 w-4" />
            </LinkButton>
            <LinkButton href="#etapes-mariage" variant="secondary" size="lg">
              Voir les étapes
            </LinkButton>
          </>
        }
        media={<WeddingDossierMock />}
      >
        <p className="mt-6 flex max-w-xl items-start gap-2 text-sm leading-relaxed text-ink-4">
          <Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0" />
          Cérémonie civile seule ou journée de fête : vous choisissez les étapes qui vous concernent. AIME® ne transmet rien à une
          mairie et n’effectue aucune réservation ni paiement.
        </p>
      </Hero>

      <section className="border-b border-line bg-subtle">
        <Container wide>
          <ul className="grid gap-4 py-8 sm:grid-cols-3">
            {GUARANTEES.map((text) => (
              <li key={text} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-3">
                <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
                {text}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section id="etapes-mariage" className="scroll-mt-20 bg-canvas">
        <Container wide className="py-20 lg:py-28">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <SectionHeading
              eyebrow="Le parcours mariage, dans l’ordre"
              title="Du dossier civil aux suites de l’union."
              description="Commencez par la mairie, ajoutez seulement les options de fête qui vous correspondent, puis retrouvez les repères pour le jour J et l’après-mariage."
            />
            <LinkButton href="/accompagnement?besoin=mariage" variant="secondary">
              Ouvrir le parcours
              <Icon name="arrow" className="h-4 w-4" />
            </LinkButton>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {PHASES.map((phase) => (
              <Link
                key={phase.number}
                href={phase.href}
                className="group flex flex-col rounded-card bg-muted p-6 transition hover:bg-canvas hover:shadow-hover hover:ring-1 hover:ring-line"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs tracking-[0.14em] text-ink-4">{phase.number}</span>
                  <Icon name={phase.icon} className="h-5 w-5 text-ink-3" />
                </div>
                <h3 className="mt-5 text-lg leading-snug text-ink">{phase.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-3">{phase.text}</p>
                <div className="mt-5 rounded-control bg-canvas/70 p-4 ring-1 ring-line-soft">{phase.mock}</div>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-ink">
                  {phase.linkLabel}
                  <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section id="projet-mariage" className="scroll-mt-20 border-y border-line bg-subtle">
        <Container wide className="py-20 lg:py-28">
          <SectionHeading
            eyebrow="Votre espace de préparation"
            title="Tout au même endroit, chacun à sa juste place."
            description="Si vous préparez une fête, le projet partagé aide à coordonner les invités et les proches, du premier RSVP au jour J. La cérémonie civile seule reste un parcours complet."
            actions={
              <LinkButton href="/accompagnement?besoin=mariage">
                Préparer mon mariage
                <Icon name="arrow" className="h-4 w-4" />
              </LinkButton>
            }
          />

          <div className="mt-14 space-y-14 lg:space-y-20">
            {PROJECT_FEATURES.map((feature, index) => (
              <div key={feature.title} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <span className="grid h-10 w-10 place-items-center rounded-control bg-canvas ring-1 ring-line">
                    <Icon name={feature.icon} className="h-5 w-5 text-ink" />
                  </span>
                  <h3 className="mt-5 text-2xl leading-snug text-ink sm:text-3xl">{feature.title}</h3>
                  <p className="mt-3 max-w-lg text-base leading-relaxed text-ink-3">{feature.text}</p>
                </div>
                <div className={index % 2 === 1 ? "lg:order-1" : ""}>{feature.mock}</div>
              </div>
            ))}
          </div>

          <p className="mt-14 flex max-w-3xl items-start gap-2.5 text-sm leading-relaxed text-ink-3">
            <Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
            Vos réponses au parcours et vos documents personnels restent privés : les invités et les proches organisateurs n’y ont pas
            accès. AIME® ne réserve, ne paie et ne transmet rien à votre place.
          </p>
        </Container>
      </section>

      <section className="bg-canvas">
        <Container wide className="py-20 lg:py-24">
          <SectionHeading
            eyebrow="…et bien plus encore"
            title="Ce qui vit autour du mariage."
            description="Facultatif, au même endroit, sans jamais conditionner l’avancement des démarches civiles."
          />
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "book" as const, title: "Guides pratiques", text: "Des repères datés, sources officielles citées, à vérifier selon votre situation.", href: "/informations" },
              { icon: "pin" as const, title: "La carte du territoire", text: "Producteurs, artistes, associations et entraide près de chez vous.", href: "/le-monde-aime" },
              { icon: "documents" as const, title: "Documents partagés", text: "Chaque pièce déposée une seule fois, avec un partage révocable.", href: "/espace/documents" },
              { icon: "calendar" as const, title: "Rendez-vous", text: "Demandez un temps d’échange avec l’équipe d’accompagnement.", href: "/espace/echanges" },
            ].map((item) => (
              <Link key={item.title} href={item.href} className="group">
                <span className="grid h-10 w-10 place-items-center rounded-control bg-muted transition group-hover:bg-canvas group-hover:ring-1 group-hover:ring-line">
                  <Icon name={item.icon} className="h-5 w-5 text-ink" />
                </span>
                <p className="mt-4 text-base font-medium text-ink">{item.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-3">{item.text}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {weddingGuides.length > 0 && (
        <section className="border-y border-line bg-subtle">
          <Container wide className="py-20 lg:py-24">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading eyebrow="Pour aller plus loin" title="Guides pratiques pour le mariage." />
              <Link href="/informations/mariage" className="inline-flex items-center gap-2 text-sm font-medium text-ink underline underline-offset-4">
                Tous les guides
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {weddingGuides.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </Container>
        </section>
      )}

      <section className="bg-canvas">
        <Container className="py-20 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow justify-center">À votre rythme</p>
            <h2 className="mt-4 text-4xl leading-[1.05] text-ink sm:text-5xl">Commencez par la prochaine étape, pas par tout le reste.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ink-3">
              Le parcours garde le fil du dossier civil, des options de fête que vous choisissez et des repères après l’union.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <LinkButton href="/accompagnement?besoin=mariage" size="lg">
                Commencer le parcours mariage
                <Icon name="arrow" className="h-4 w-4" />
              </LinkButton>
              <LinkButton href="/informations/mariage" variant="secondary" size="lg">
                Lire les guides mariage
              </LinkButton>
            </div>
            <p className="mt-5 text-sm text-ink-4">Prototype de démonstration · aucune donnée transmise à un organisme.</p>
          </div>
        </Container>
      </section>
    </PublicPage>
  );
}
