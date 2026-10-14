"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Container, PrimaryButton } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="contenu-principal" className="flex min-h-screen flex-col bg-canvas">
      <Container className="flex flex-1 flex-col items-center justify-center py-24 text-center">
        <p className="eyebrow">
          <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
          AIME® · Le Monde Aime
        </p>
        <h1 className="mt-5 max-w-2xl text-4xl leading-tight text-ink sm:text-5xl">Quelque chose n’a pas fonctionné</h1>
        <p className="mt-5 max-w-xl leading-relaxed text-ink-3">
          Une erreur inattendue est survenue. Vos données saisies ne sont pas perdues : réessayez, et si le problème persiste, revenez dans
          quelques minutes.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <PrimaryButton type="button" onClick={reset} size="lg">Réessayer</PrimaryButton>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-control bg-canvas px-5 text-[15px] font-medium text-ink-2 ring-1 ring-line transition hover:bg-subtle hover:text-ink"
          >
            Retour à l’accueil
          </Link>
        </div>
        <p className="mt-10 text-xs text-ink-4">
          Si le problème persiste,{" "}
          <a href="/api/health" className="font-medium text-ink underline underline-offset-4">consultez l’état du service</a>.
        </p>
      </Container>
    </main>
  );
}
