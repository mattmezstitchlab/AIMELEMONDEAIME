import type { Metadata } from "next";
import Link from "next/link";
import { PublicPage, PageColumn } from "@/components/public-shell";
import { HeroCard, LinkRow, Tile, TileHeading } from "@/components/marketing/tiles";
import { Icon } from "@/components/icon";
import { LinkButton } from "@/components/ui";
import { GuestListMock } from "@/components/marketing/mocks";
import { redirect } from "next/navigation";
import { isDatabaseConfigured } from "@/db";
import { AUTH_ENABLED } from "@/lib/auth-mode";

export const metadata: Metadata = {
  title: "Mon espace — AIME®",
  description:
    "Les comptes AIME® sont en préparation. En attendant, parcourez librement les parcours, les guides et la carte du territoire.",
};

const COMING = [
  {
    title: "Vos démarches au même endroit",
    text: "Parcours guidés, brouillons repris plus tard, rappels personnels et récapitulatif exportable.",
  },
  {
    title: "Le projet partagé du mariage",
    text: "Invités, réponses foyer par foyer, budget, programme et plan de table, avec des accès limités pour les proches.",
  },
  {
    title: "Un accès choisi, jamais imposé",
    text: "Aucune donnée n’est transmise à une mairie ou à un organisme : vous gardez la main sur ce qui est partagé.",
  },
];

export default function MonEspacePage() {
  // Comptes rallumés : la page d'explication s'efface devant le formulaire.
  if (AUTH_ENABLED) redirect("/connexion");
  const tourAvailable = isDatabaseConfigured;

  return (
    <PublicPage>
      <PageColumn className="flex flex-col gap-5 pt-4 sm:pt-6">
        <HeroCard
          eyebrow={AUTH_ENABLED ? "Mon espace" : "Comptes en préparation"}
          title={AUTH_ENABLED ? "Votre espace personnel." : "Mon espace ouvre bientôt."}
          subtitle={
            AUTH_ENABLED
              ? "Connectez-vous pour retrouver vos démarches, vos projets et vos documents."
              : "Les comptes AIME® sont fermés le temps de la préparation. Tout ce qui est public reste consultable librement, et la visite guidée montre l’interface réelle en lecture seule."
          }
          image={{ src: "/images/hero-espace-portrait.webp", type: "image/webp" }}
        />

        <section className="mt-2">
          <TileHeading>Ce que contiendra Mon espace.</TileHeading>
          <div className="mt-4 grid gap-4 sm:gap-5">
            {COMING.map((item) => (
              <div key={item.title} className="rounded-card bg-subtle p-5 ring-1 ring-line-soft">
                <p className="text-[15px] text-ink">{item.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-3">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <Tile tone="coral" label="Aperçu de Mon espace" detail="Lecture seule">
          <div className="w-full">
            <GuestListMock />
          </div>
        </Tile>

        <section className="mt-4">
          <TileHeading>En attendant, tout cela est ouvert :</TileHeading>
          <div className="mt-3">
            <LinkRow href="/accompagnement?besoin=mariage" title="Le parcours mariage" meta="Étapes, pièces, repères de délais" />
            <LinkRow href="/informations" title="Les guides et sujets" meta="Santé, famille, logement, retraite, emploi" />
            <LinkRow href="/le-monde-aime" title="La carte du territoire" meta="Producteurs, artistes, associations, entraide" />
            <LinkRow href="/annuaire" title="Les points d’accueil" meta="Lieux de démonstration" />
            <LinkRow href="/vision" title="Notre méthode et nos limites" meta="Ce qui fonctionne, ce qui reste à construire" />
          </div>
        </section>

        {tourAvailable && (
          <section className="mt-8 rounded-card bg-subtle p-7 ring-1 ring-line-soft sm:p-9">
            <p className="nav-tiny text-ink-3">Visite guidée · sans identifiant</p>
            <h2 className="mt-3 text-[1.75rem] leading-tight tracking-[-0.02em] text-ink">Voyez l’interface réelle, en lecture seule.</h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-3">
              La visite ouvre un compte de démonstration : vous parcourez le vrai espace, les écritures sont désactivées et les données
              affichées sont fictives.
            </p>
            <LinkButton href="/decouvrir" className="mt-6" size="lg">
              Commencer la visite
              <Icon name="arrow" className="h-4 w-4" />
            </LinkButton>
          </section>
        )}

        <p className="mt-4 text-xs leading-relaxed text-ink-4">
          Vous cherchez une réponse à une situation précise ?{" "}
          <Link href="/accompagnement" className="text-ink-2 underline underline-offset-4">
            Décrivez votre besoin
          </Link>{" "}
          — l’assistant de navigation fonctionne sans compte.
        </p>
      </PageColumn>
    </PublicPage>
  );
}
