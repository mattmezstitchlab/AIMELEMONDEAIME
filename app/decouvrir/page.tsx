import type { Metadata } from "next";
import { PublicPage, PageColumn } from "@/components/public-shell";
import { HeroCard, LinkRow, Tile, TileHeading } from "@/components/marketing/tiles";
import { Icon } from "@/components/icon";
import { Card, LinkButton, Notice } from "@/components/ui";
import { BudgetMock, GuestListMock, WeddingDossierMock } from "@/components/marketing/mocks";
import { loginAsDemo } from "@/lib/actions/auth";
import { isDatabaseConfigured } from "@/db";

export const metadata: Metadata = {
  title: "Découvrir Mon espace (visite guidée) — AIME®",
  description: "Visitez le vrai espace personnel AIME® avec un compte de démonstration en lecture seule : démarches, projets, échanges et documents réunis. Sans inscription.",
};

const POINTS = [
  { icon: "demarches", title: "Mes démarches", text: "Parcours guidés et dossiers suivis par l’équipe, réunis dans une seule liste." },
  { icon: "echanges", title: "Mes échanges et projets", text: "Demandes sur la carte, projets, cercles privés et messages de votre bureau." },
  { icon: "documents", title: "Mes documents", text: "Vos pièces au même endroit, avec leurs partages contrôlés." },
  { icon: "user", title: "Mon profil", text: "Ce que vous proposez, cherchez ou transmettez près de chez vous." },
] as const;

export default async function DecouvrirPage({ searchParams }: { searchParams: Promise<{ indisponible?: string }> }) {
  const sp = await searchParams;
  const available = isDatabaseConfigured;

  return (
    <PublicPage>
      <PageColumn className="flex flex-col gap-5 pt-4 sm:pt-6">
        <HeroCard
          eyebrow="Visite guidée · sans identifiant"
          title="L’espace réel, en lecture seule."
          subtitle="La visite ouvre un compte de démonstration dans l’interface réelle : vous parcourez tout, les écritures sont désactivées et les données affichées sont fictives."
          image={{ src: "/images/hero-espace-portrait.webp", type: "image/webp" }}
        />

        <div className="action-row flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[1.6rem] leading-tight tracking-[-0.02em] text-[#12100e]" style={{ fontFamily: "var(--font-display)" }}>
              Entrer dans la visite
            </p>
            <p className="mt-1 text-sm text-[#12100e]/60">Sans inscription ni mot de passe. Quittez à tout moment par « Se déconnecter ».</p>
          </div>
          <form action={loginAsDemo}>
            <button
              type="submit"
              disabled={!available}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#12100e] px-5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
            >
              Commencer
              <Icon name="arrow" className="h-4 w-4" />
            </button>
          </form>
        </div>

        {sp.indisponible && (
          <Notice tone="warning">
            La visite guidée n’est pas disponible : la base de données n’est peut-être pas configurée ou le compte de démonstration n’y a pas
            été créé.
          </Notice>
        )}
        {!available && !sp.indisponible && (
          <Notice tone="warning">
            La visite sera disponible dès que la base de données du site sera configurée.
          </Notice>
        )}

        <Tile tone="coral" label="Aperçu" detail="Invités et réponses">
          <div className="w-full">
            <GuestListMock />
          </div>
        </Tile>

        <section className="mt-2">
          <TileHeading>Ce que vous verrez dans l’espace.</TileHeading>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {POINTS.map((point) => (
              <Card key={point.title} className="bg-subtle shadow-none ring-line-soft">
                <span className="grid h-10 w-10 place-items-center rounded-control bg-muted">
                  <Icon name={point.icon} className="h-5 w-5 text-ink" />
                </span>
                <p className="mt-4 text-[15px] text-ink">{point.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-3">{point.text}</p>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          <Tile tone="sand" label="Dossier civil" detail="Suivi">
            <div className="w-full">
              <WeddingDossierMock />
            </div>
          </Tile>
          <Tile tone="sage" label="Budget estimé" detail="Par poste">
            <div className="w-full">
              <BudgetMock />
            </div>
          </Tile>
        </div>

        <section className="mt-6">
          <TileHeading>Et maintenant ?</TileHeading>
          <div className="mt-3">
            <LinkRow href="/accompagnement?besoin=mariage" title="Commencer un parcours mariage" meta="Démarches civiles, fête, après-union" />
            <LinkRow href="/mon-espace" title="Ce que contiendra Mon espace" meta="Les comptes sont en préparation" />
            <LinkRow href="/vision" title="Notre méthode et nos limites" meta="Ce qui fonctionne, ce qui reste à construire" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton href="/accompagnement?besoin=mariage">
              Ouvrir le parcours mariage
              <Icon name="arrow" className="h-4 w-4" />
            </LinkButton>
          </div>
        </section>
      </PageColumn>
    </PublicPage>
  );
}
