import Link from "next/link";
import type { Metadata } from "next";
import { Container, LinkButton } from "@/components/ui";

export const metadata: Metadata = { title: "Page introuvable" };

export default function NotFoundPage() {
  return (
    <main id="contenu-principal" className="flex min-h-screen flex-col bg-canvas">
      <Container className="flex flex-1 flex-col items-center justify-center py-24 text-center">
        <p className="eyebrow">
          <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
          AIME® · Le Monde Aime
        </p>
        <h1 className="mt-5 max-w-2xl text-4xl leading-tight text-ink sm:text-5xl">Cette page n’existe pas (ou plus)</h1>
        <p className="mt-5 max-w-xl leading-relaxed text-ink-3">
          Le lien que vous avez suivi est peut-être ancien. Vous pouvez repartir de l’accueil, ou explorer les personnes et les ressources
          près de vous.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <LinkButton href="/">Retour à l’accueil</LinkButton>
          <LinkButton href="/le-monde-aime" variant="secondary">Explorer les publications</LinkButton>
        </div>
        <p className="mt-10 text-xs text-ink-4">
          Besoin d’un repère ?{" "}
          <Link href="/informations" className="font-medium text-ink underline underline-offset-4">Tous les guides et sujets</Link>
        </p>
      </Container>
    </main>
  );
}
