import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthSplit } from "@/components/auth-shell";
import { RegisterForm } from "./register-form";
import { Notice } from "@/components/ui";
import { db, isDatabaseConfigured } from "@/db";
import { offices } from "@/db/schema";
import { AUTH_ENABLED } from "@/lib/auth-mode";

export const metadata: Metadata = { title: "Créer mon espace — AIME®", description: "Créez votre espace AIME® pour être accompagné dans vos démarches et rencontrer les personnes près de vous." };

export const dynamic = "force-dynamic";

/*
 * Comptes fermés tant que `AIME_AUTH_ENABLED` n’est pas à 1 : l’explication
 * publique prend le relais. Le formulaire reste en place pour la réactivation.
 */
export default async function InscriptionPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (!AUTH_ENABLED) redirect("/mon-espace");
  const { next } = await searchParams;
  const officeList = isDatabaseConfigured
    ? await db.select().from(offices).catch(() => [])
    : [];
  return (
    <AuthSplit title="Votre espace, en quelques minutes." subtitle="Quelques informations suffisent pour personnaliser votre accueil et préremplir vos démarches.">
      <h1 className="text-3xl text-ink">Créer mon espace</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-3">
        Aucune donnée réelle n’est demandée (ni numéro de sécurité sociale, ni information médicale).
      </p>
      {!isDatabaseConfigured && (
        <Notice tone="warning" className="mt-6">
          La création de compte sera disponible après configuration de la base de données PostgreSQL.
        </Notice>
      )}
      <RegisterForm offices={officeList} available={isDatabaseConfigured} next={next} />
      <p className="mt-6 text-sm text-ink-3">
        Déjà inscrit ?{" "}
        <Link
          href={next ? `/connexion?next=${encodeURIComponent(next)}` : "/connexion"}
          className="font-medium text-ink underline underline-offset-4"
        >
          Me connecter
        </Link>
      </p>
    </AuthSplit>
  );
}
