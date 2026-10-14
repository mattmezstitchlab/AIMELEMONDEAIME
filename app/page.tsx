import Link from "next/link";
import { PublicPage, PageColumn } from "@/components/public-shell";
import { HeroCard, ActionRow, Tile, LinkRow, TileHeading } from "@/components/marketing/tiles";
import { Icon } from "@/components/icon";
import { LinkButton } from "@/components/ui";
import { BudgetMock, GuestListMock, RolesMock, WeddingDossierMock, TimelineMock, ChecklistMock, MapPointsMock } from "@/components/marketing/mocks";
import { db, isDatabaseConfigured } from "@/db";
import { articles } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { ARTICLE_CATEGORY_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

type ArticleRow = typeof articles.$inferSelect;

/** Les trois engagements qui tiennent toute la page — et rien de plus. */
const PROMISES = [
  "Rien n’est transmis à une mairie ni à un organisme.",
  "Les liens des invités et des proches sont temporaires et révocables.",
  "Les sources officielles restent la référence : AIME® ne décide rien.",
];

const STEPS = [
  {
    number: "01",
    title: "Le dossier civil, d’abord",
    text: "Date, commune, pièces, témoins, publication des bans : un fil unique pour ne rien relancer.",
    tone: "coral" as const,
    mock: <WeddingDossierMock />,
  },
  {
    number: "02",
    title: "La fête, si vous en voulez une",
    text: "Réception, repas, musique, photos — ou rien du tout. Aucune option n’est obligatoire.",
    tone: "amber" as const,
    mock: <GuestListMock />,
  },
  {
    number: "03",
    title: "Le jour J et les proches",
    text: "Rôles limités pour la coordination et les témoins, révocables à tout moment.",
    tone: "sand" as const,
    mock: <RolesMock />,
  },
];

const WEDDING_GUIDES_FALLBACK = [
  { href: "/informations/mariage", title: "Se marier : par où commencer", meta: "Guide pratique · dossier civil" },
  { href: "/accompagnement?besoin=mariage", title: "Témoins, pièces et délais", meta: "Repères à vérifier en mairie" },
  { href: "/informations/famille", title: "Après l’union : les démarches", meta: "Livret de famille, organismes à prévenir" },
];

const THEMES = [
  { href: "/informations/famille", title: "Famille et naissance", meta: "Allocations, mariage, Pacs" },
  { href: "/informations/sante", title: "Santé", meta: "Remboursements, arrêts de travail" },
  { href: "/informations/argent", title: "Argent et difficultés", meta: "Factures, loyer, crédits" },
  { href: "/informations/logement", title: "Logement", meta: "Aides et déménagement" },
  { href: "/informations/retraite", title: "Retraite et carrière", meta: "Relevé, demande, cotisations" },
  { href: "/informations/emploi", title: "Emploi et activité", meta: "Recherche, création, transmission" },
];

async function getWeddingGuides(): Promise<ArticleRow[]> {
  if (!isDatabaseConfigured) return [];
  try {
    return await db
      .select()
      .from(articles)
      .where(and(eq(articles.category, "mariage"), eq(articles.isPublished, true)))
      .orderBy(desc(articles.publishedAt))
      .limit(4);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const weddingGuides = await getWeddingGuides();

  return (
    <PublicPage>
      <PageColumn className="flex flex-col gap-4 pt-4 sm:gap-5 sm:pt-6">
        <HeroCard
          eyebrow="Le Monde Aime"
          title="Votre mariage, étape par étape."
          subtitle="Les démarches civiles conduites proprement, la fête si vous en voulez une, les repères après l’union — et les ressources du territoire pour tout ce qui entoure."
          image={{ src: "/images/hero-mariage-portrait.webp", type: "image/webp" }}
        />

        <ActionRow
          title="Préparer mon mariage"
          hint="Dossier civil, invités, budget, jour J"
          href="/accompagnement?besoin=mariage"
          label="Commencer"
        />

        <ul className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {PROMISES.map((promise) => (
            <li key={promise} className="flex items-start gap-2.5 rounded-card bg-subtle p-4 ring-1 ring-line-soft">
              <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
              <p className="text-[13px] leading-relaxed text-ink-2">{promise}</p>
            </li>
          ))}
        </ul>

        <section className="mt-6">
          <TileHeading>Le parcours, dans l’ordre.</TileHeading>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-3">
            Commencez par la mairie. La fête, les prestataires et les services autour ne sont jamais des conditions pour avancer.
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          {STEPS.map((step, index) => (
            <Tile key={step.number} tone={step.tone} label={step.title} detail={step.number} wide={index === 0}>
              <div className="w-full">{step.mock}</div>
            </Tile>
          ))}
          <Tile tone="sage" label="Après l’union" detail="04">
            <div className="w-full px-1 py-2">
              <ChecklistMock
                items={[
                  { label: "Livret de famille remis", done: true },
                  { label: "Organismes à prévenir" },
                  { label: "Changement de nom, si souhaité" },
                  { label: "Remerciements" },
                ]}
              />
            </div>
          </Tile>
        </div>

        <ActionRow
          title="Organiser la fête à plusieurs"
          hint="Invités, budget, programme, plan de table"
          href="/le-monde-aime"
          label="Voir l’espace"
        />

        <section className="mt-6">
          <TileHeading>Ce qui vit autour.</TileHeading>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-3">
            Facultatif, au même endroit, sans jamais conditionner l’avancement des démarches civiles.
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          <Tile tone="sky" label="La carte du territoire" detail="Communes voisines">
            <MapPointsMock />
          </Tile>
          <Tile tone="lilac" label="Budget et contributions" detail="Suivi par poste">
            <div className="w-full">
              <BudgetMock />
            </div>
          </Tile>
        </div>

        <section className="mt-8">
          <TileHeading>Le rétroplanning.</TileHeading>
          <div className="mt-4 rounded-card bg-subtle p-6 ring-1 ring-line-soft">
            <div className="theme-light">
              <TimelineMock />
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <TileHeading>Guides pratiques.</TileHeading>
            <Link href="/informations" className="nav-tiny text-ink-3 transition hover:text-ink">
              Tous les guides
            </Link>
          </div>
          <div className="mt-3">
            {weddingGuides.length > 0
              ? weddingGuides.map((article) => (
                  <LinkRow
                    key={article.id}
                    href={`/guides/${article.slug}`}
                    title={article.title}
                    meta={`${article.kind === "guide" ? "Guide pratique" : "Article"} · ${ARTICLE_CATEGORY_LABELS[article.category] ?? "Mariage"}`}
                  />
                ))
              : WEDDING_GUIDES_FALLBACK.map((guide) => (
                  <LinkRow key={guide.title} href={guide.href} title={guide.title} meta={guide.meta} />
                ))}
          </div>
        </section>

        <section className="mt-8">
          <TileHeading>Par sujet de vie.</TileHeading>
          <div className="mt-3">
            {THEMES.map((theme) => (
              <LinkRow key={theme.title} href={theme.href} title={theme.title} meta={theme.meta} />
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-card bg-subtle p-7 text-center ring-1 ring-line-soft sm:p-10">
          <h2 className="text-[2rem] leading-tight tracking-[-0.02em] text-ink">Commencez par la prochaine étape.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-3">
            Le parcours garde le fil du dossier civil, des options de fête que vous choisissez et des repères après l’union.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <LinkButton href="/accompagnement?besoin=mariage" size="lg">
              Commencer le parcours mariage
              <Icon name="arrow" className="h-4 w-4" />
            </LinkButton>
            <LinkButton href="/informations/mariage" variant="secondary" size="lg">
              Lire les guides mariage
            </LinkButton>
          </div>
        </section>
      </PageColumn>
    </PublicPage>
  );
}
