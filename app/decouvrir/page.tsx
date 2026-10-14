import type { Metadata } from "next";
import { PublicPage } from "@/components/public-shell";
import { Card, Container, Hero, LinkButton } from "@/components/ui";
import { Icon } from "@/components/icon";
import { GuestListMock } from "@/components/marketing/mocks";
import { loginAsDemo } from "@/lib/actions/auth";

export const metadata: Metadata = {
  title: "Découvrir Mon espace (visite guidée) — AIME®",
  description: "Visitez le vrai espace personnel AIME® avec un compte de démonstration en lecture seule : démarches, projets, échanges et documents réunis. Sans inscription.",
};

const POINTS = [
  { icon: "demarches", title: "Mes démarches", text: "Parcours guidés et dossiers suivis par l'équipe, réunis dans une seule liste." },
  { icon: "echanges", title: "Mes échanges & projets", text: "Demandes sur la carte, projets, cercles privés et messages de votre bureau." },
  { icon: "documents", title: "Mes documents", text: "Vos pièces au même endroit, avec leurs partages contrôlés." },
  { icon: "user", title: "Mon profil", text: "Ce que vous proposez, cherchez ou transmettez près de chez vous." },
] as const;

export default async function DecouvrirPage({ searchParams }: { searchParams: Promise<{ indisponible?: string }> }) {
  const sp = await searchParams;
  return (
    <PublicPage solidHeader>
      <Hero
        size="md"
        eyebrow="Visite guidée"
        title="Découvrez Mon espace, le vrai — en lecture seule."
        subtitle="Plus d’aperçu recopié : cette visite vous connecte à un compte de démonstration dans l’interface réelle. Vous pouvez tout parcourir ; les actions d’écriture sont désactivées et les données affichées sont fictives."
        media={<GuestListMock />}
      >
        <div className="mt-9 max-w-xl">
          {sp.indisponible && (
            <p
              role="alert"
              className="mb-5 rounded-control bg-state-danger-soft px-4 py-3 text-sm leading-relaxed text-state-danger ring-1 ring-state-danger-line"
            >
              La visite guidée n’est pas disponible : la base de données n’est peut-être pas configurée ou le compte de démonstration n’y a
              pas été créé. Vous pouvez <a href="/inscription" className="font-semibold underline">créer un compte</a> si la base est activée.
            </p>
          )}
          <form action={loginAsDemo}>
            <button
              type="submit"
              className="inline-flex h-11 items-center gap-2 rounded-control bg-ink px-5 text-[15px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition hover:bg-ink-2"
            >
              Commencer la visite
              <Icon name="arrow" className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-3 text-xs text-ink-4">Sans inscription ni mot de passe. Quittez à tout moment par « Se déconnecter ».</p>
        </div>
      </Hero>

      <section className="bg-canvas">
        <Container className="py-16 lg:py-20">
          <div className="grid gap-4 sm:grid-cols-2">
            {POINTS.map((p) => (
              <Card key={p.title}>
                <span className="grid h-10 w-10 place-items-center rounded-control bg-muted">
                  <Icon name={p.icon} className="h-5 w-5 text-ink" />
                </span>
                <p className="mt-4 text-base font-medium text-ink">{p.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-3">{p.text}</p>
              </Card>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <LinkButton href="/inscription">Créer mon espace</LinkButton>
            <LinkButton href="/connexion" variant="secondary">J’ai déjà un compte</LinkButton>
          </div>
        </Container>
      </section>
    </PublicPage>
  );
}
