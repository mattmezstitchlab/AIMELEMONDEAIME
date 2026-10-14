import Link from "next/link";
import { PublicPage, PageColumn } from "@/components/public-shell";
import { HeroCard, ActionRow, Panel, LinkRow, TileHeading } from "@/components/marketing/tiles";
import { Icon } from "@/components/icon";
import { LinkButton } from "@/components/ui";
import { BudgetMock, GuestListMock, RolesMock, WeddingDossierMock, TimelineMock, ChecklistMock, TransmissionsMock } from "@/components/marketing/mocks";
import { db, isDatabaseConfigured } from "@/db";
import { articles } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { ARTICLE_CATEGORY_LABELS } from "@/lib/constants";
import { openCircuits } from "@/lib/circuits";

export const dynamic = "force-dynamic";

type ArticleRow = typeof articles.$inferSelect;

/*
 * Page d'accueil : le récit d'abord, la mécanique ensuite.
 *
 * L'idée tient en trois temps. Les familles se sont éclatées, les liens se sont
 * distendus, et ce qui se transmettait de génération en génération s'est perdu.
 * On commence par le mariage parce que c'est le moment où deux histoires se
 * rejoignent, où l'on voit précisément ce qu'on veut se passer — un nom, une
 * maison, une terre, un savoir-faire. AIME® prend les choses en main : le
 * dossier civil, les proches, la fête, puis ce qui se transmet autour.
 */

/** Les trois engagements qui tiennent toute la page — et rien de plus. */
const PROMISES = [
  "Prototype indépendant : aucun organisme, aucune administration ne décide ici.",
  "Vos données restent les vôtres : rien n’est transmis sans votre accord.",
  "Les démarches officielles se font en mairie ; AIME® donne des repères, jamais de décision.",
];

const STEPS = [
  {
    number: "01",
    title: "Le dossier civil, d’abord",
    text: "Date, commune, pièces, témoins, publication des bans : un fil unique pour ne rien relancer.",
    mock: <WeddingDossierMock />,
  },
  {
    number: "02",
    title: "La fête, si vous en voulez une",
    text: "Réception, repas, musique, photos — ou rien du tout. Aucune option n’est obligatoire.",
    mock: <GuestListMock />,
  },
  {
    number: "03",
    title: "Le jour J et les proches",
    text: "Rôles limités pour la coordination et les témoins, révocables à tout moment.",
    mock: <RolesMock />,
  },
];

/** Ce qui se perd quand une famille se sépare — la raison d’être du reste. */
const FRACTURES = [
  "Des fermes s’arrêtent faute de repreneur identifié.",
  "Des ateliers ferment avec des gestes que personne n’a appris.",
  "Des aînés ont quelque chose à passer, et plus personne à qui le passer.",
];

const WEDDING_GUIDES_FALLBACK = [
  { href: "/informations/mariage", title: "Se marier : par où commencer", meta: "Guide pratique · dossier civil" },
  { href: "/accompagnement?besoin=mariage", title: "Témoins, pièces et délais", meta: "Repères à vérifier en mairie" },
  { href: "/informations/famille", title: "Après l’union : les démarches", meta: "Livret de famille, organismes à prévenir" },
];

const THEMES = [
  { href: "/le-monde-aime?univers=savoirs", title: "Transmettre un savoir-faire", meta: "Ce qui cherche à être repris ou appris" },
  { href: "/le-monde-aime?univers=terre", title: "Terre et quotidien", meta: "Producteurs, dons, prêts, trajets" },
  { href: "/le-monde-aime?univers=arts", title: "Arts et rencontres", meta: "Ateliers, concerts, lieux de répétition" },
  { href: "/informations/famille", title: "Famille et naissance", meta: "Allocations, mariage, Pacs" },
  { href: "/informations/retraite", title: "Retraite et transmission", meta: "Relevé, demande, repreneur" },
  { href: "/informations/argent", title: "Argent et difficultés", meta: "Factures, loyer, crédits" },
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
          title="Le fil s’était perdu. On le reprend."
          subtitle="Les familles se sont éclatées, les transmissions se sont arrêtées, les campagnes se sont vidées. AIME® prend les choses en main — et tout commence par un mariage, le moment où deux histoires décident de ce qu’elles se passent."
          image={{ src: "/images/hero-mariage-portrait.webp", type: "image/webp" }}
        />

        <ActionRow
          title="Commencer par mon mariage"
          hint="Dossier civil, invités, budget, jour J — puis ce qui se transmet"
          href="/accompagnement?besoin=mariage"
          label="Commencer"
        />

        <ActionRow
          title="Créer un espace privé"
          hint="Votre dossier, vos proches, vos échanges. Les comptes ouvrent bientôt."
          href="/mon-espace"
          label="Ouvrir"
        />

        <ul className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {PROMISES.map((promise) => (
            <li key={promise} className="flex items-start gap-2.5 rounded-card bg-subtle p-4 ring-1 ring-line-soft">
              <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
              <p className="text-[13px] leading-relaxed text-ink-2">{promise}</p>
            </li>
          ))}
        </ul>

        <section className="mt-8">
          <TileHeading>Pourquoi commencer par un mariage.</TileHeading>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <p className="text-sm leading-relaxed text-ink-2">
              Parce que c’est le seul moment où une famille décide de ce qu’elle devient. Deux histoires se rejoignent, deux
              territoires aussi : un nom, une maison, parfois une exploitation, et des savoir-faire qui attendent d’être repris.
            </p>
            <p className="text-sm leading-relaxed text-ink-3">
              Commencez par la mairie. La fête, les prestataires et les services autour ne sont jamais des conditions pour avancer.
            </p>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          {STEPS.map((step, index) => (
            <Panel key={step.number} label={step.title} detail={step.number} wide={index === 0}>
              <div className="w-full">{step.mock}</div>
            </Panel>
          ))}
          <Panel label="Après l’union" detail="04">
            <div className="w-full px-1 py-2">
              <ChecklistMock
                items={[
                  { label: "Livret de famille remis", done: true },
                  { label: "Organismes à prévenir" },
                  { label: "Changement de nom, si souhaité" },
                  { label: "Ce qui se transmet, à décider ensemble" },
                ]}
              />
            </div>
          </Panel>
        </div>

        <section className="mt-10 rounded-card bg-subtle p-6 ring-1 ring-line-soft sm:p-8">
          <TileHeading>Ce qui se perd quand les familles se séparent.</TileHeading>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">
            Ce ne sont pas seulement des liens qui se cassent. Ce sont des transmissions qui n’ont pas lieu : des fermes sans
            repreneur, des ateliers qui ferment, des gestes que personne n’a appris, des aînés qui ne trouvent plus à qui passer
            le relais. En France, un tiers des exploitants agricoles n’ont pas identifié de repreneur dans les trois ans qui
            précèdent leur retraite.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            {FRACTURES.map((line) => (
              <li key={line} className="rounded-card bg-canvas p-4 text-[13px] leading-relaxed text-ink-2 ring-1 ring-line">
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <LinkButton href="/le-monde-aime?univers=savoirs">
              Explorer les transmissions
              <Icon name="arrow" className="h-4 w-4" />
            </LinkButton>
            <LinkButton href="/vision" variant="secondary">
              Notre méthode
            </LinkButton>
          </div>
        </section>

        <section className="mt-8">
          <TileHeading>Ce qu’on remet en circulation.</TileHeading>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-3">
            Tout se parcourt en listes claires, commune par commune : ce qui cherche à être repris, appris, prêté ou donné. Pas
            de carte à déplacer, pas d’adresse à publier — votre commune suffit.
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          <Panel label="Transmissions en cours" detail="Communes voisines">
            <TransmissionsMock />
          </Panel>
          <Panel label="Budget et contributions" detail="Suivi par poste">
            <div className="w-full">
              <BudgetMock />
            </div>
          </Panel>
        </div>

        <ActionRow
          title="Se relier autour de soi"
          hint="Propositions, besoins, trajets, projets et personnes"
          href="/le-monde-aime"
          label="Explorer"
        />

        <section className="mt-8">
          <TileHeading>Le rétroplanning.</TileHeading>
          <div className="mt-4 rounded-card bg-subtle p-6 ring-1 ring-line-soft">
            <TimelineMock />
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

        <section className="mt-8">
          <TileHeading>Les circuits.</TileHeading>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-3">
            Une ferme, un atelier, une association, un logement, un trajet, une mémoire à transmettre : chaque circuit
            cadre un type de fiche, avec ses mots, ses règles et son tableau. Partout la même règle : votre commune suffit, aucune adresse n&apos;est publiée, et rien
            ne se conclut sans l&apos;accord des personnes.
          </p>
          <div className="mt-3">
            {openCircuits().map((circuit) => (
              <LinkRow key={circuit.key} href={`/circuits/${circuit.key}`} title={circuit.label} meta={circuit.tagline} />
            ))}
            <LinkRow href="/circuits" title="Tous les circuits" meta="Producteurs, coups de main, associations et collectifs : ce qui est ouvert aujourd'hui, et comment un circuit s'écrit." />
          </div>
        </section>

        <section className="mt-10 rounded-card bg-subtle p-7 text-center ring-1 ring-line-soft sm:p-10">
          <h2 className="text-[2rem] leading-tight tracking-[-0.02em] text-ink">Commencez par un mariage. Le reste suivra.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-3">
            Le parcours garde le fil du dossier civil, des proches, de la fête si vous en voulez une — et de ce que vous décidez
            de transmettre.
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
