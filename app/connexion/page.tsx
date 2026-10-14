import Link from "next/link";
import type { Metadata } from "next";
import { AuthSplit } from "@/components/public-shell";
import { LoginForm } from "./login-form";
import { Notice } from "@/components/ui";
import { isDatabaseConfigured } from "@/db";

export const metadata: Metadata = { title: "Connexion — AIME®", description: "Connectez-vous à votre espace AIME® : démarches, projets, échanges et documents au même endroit." };

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthSplit title="Bon retour parmi nous." subtitle="Retrouvez vos démarches, vos projets, vos échanges et vos documents dans un seul espace.">
      <h1 className="text-3xl text-ink">Connexion à AIME®</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-3">
        Un seul compte pour tout. AIME® ne vous demandera jamais les mots de passe de vos comptes administratifs.
      </p>
      {!isDatabaseConfigured && (
        <Notice tone="warning" className="mt-6">
          La connexion sera disponible après configuration de la base de données PostgreSQL.
        </Notice>
      )}
      <LoginForm next={next} available={isDatabaseConfigured} />
      <p className="mt-6 text-sm text-ink-3">
        Pas encore de compte ?{" "}
        <Link
          href={next ? `/inscription?next=${encodeURIComponent(next)}` : "/inscription"}
          className="font-medium text-ink underline underline-offset-4"
        >
          Créer mon espace
        </Link>
      </p>
      <p className="mt-10 rounded-card bg-muted p-5 text-sm leading-relaxed text-ink-3">
        Vous découvrez AIME® ?{" "}
        <Link href="/decouvrir" className="font-medium text-ink underline underline-offset-4">
          Visitez l’espace en lecture seule
        </Link>
        , sans créer de compte.
      </p>
    </AuthSplit>
  );
}
