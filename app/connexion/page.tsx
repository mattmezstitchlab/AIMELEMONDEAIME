import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthSplit } from "@/components/auth-shell";
import { LoginForm } from "./login-form";
import { Notice } from "@/components/ui";
import { isDatabaseConfigured } from "@/db";
import { AUTH_ENABLED } from "@/lib/auth-mode";

export const metadata: Metadata = { title: "Connexion — AIME®", description: "Connectez-vous à votre espace AIME® : démarches, projets, échanges et documents au même endroit." };

/*
 * Les comptes sont fermés tant que `AIME_AUTH_ENABLED` n’est pas à 1 : la page
 * redirige alors vers l’explication publique. Le formulaire reste en place,
 * prêt pour la réactivation (voir lib/auth-mode.ts).
 */
export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (!AUTH_ENABLED) redirect("/mon-espace");
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
        <Link href={next ? `/inscription?next=${encodeURIComponent(next)}` : "/inscription"} className="font-medium text-ink underline underline-offset-4">
          Créer mon espace
        </Link>
      </p>
    </AuthSplit>
  );
}
