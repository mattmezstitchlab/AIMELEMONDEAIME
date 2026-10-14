"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Container, PrimaryButton } from "@/components/ui";

export default function LeMondeAimeError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Le Monde Aime — erreur de chargement", error); }, [error]);
  return (
    <main lang="fr" className="grid min-h-[70vh] place-items-center bg-subtle px-5 py-12">
      <Container className="max-w-xl">
        <section role="alert" className="rounded-panel bg-canvas p-8 text-center shadow-lifted ring-1 ring-line">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-control bg-muted text-ink ring-1 ring-ink" aria-hidden="true">
            !
          </span>
          <p className="eyebrow mt-5 justify-center">Le Monde Aime</p>
          <h1 className="mt-3 text-2xl text-ink">Les publications n’ont pas pu s’ouvrir</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-3">
            Vos offres et échanges ne sont pas supprimés. Réessayez dans un instant. Si le problème persiste, vous pouvez revenir à la page
            d’accueil.
          </p>
          {error.digest && <p className="mt-3 text-xs text-ink-4">Référence technique : {error.digest}</p>}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <PrimaryButton type="button" onClick={() => reset()}>Réessayer</PrimaryButton>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-control bg-canvas px-4 text-sm font-medium text-ink-2 ring-1 ring-line transition hover:bg-subtle hover:text-ink"
            >
              Retour à l’accueil
            </Link>
          </div>
          <p className="mt-6 text-xs leading-relaxed text-ink-4">
            Le Monde Aime est une initiative indépendante. Les structures d’accompagnement externes restent consultables dans la rubrique
            « Services et accompagnement ».
          </p>
        </section>
      </Container>
    </main>
  );
}
