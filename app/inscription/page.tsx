import Link from "next/link";
import type { Metadata } from "next";
import { AuthSplit } from "@/components/public-shell";
import { RegisterForm } from "./register-form";
import { db, isDatabaseConfigured } from "@/db";
import { offices } from "@/db/schema";

export const metadata: Metadata = { title: "Créer mon espace — AIME®", description: "Créez votre espace AIME® pour être accompagné dans vos démarches et rencontrer les personnes près de vous." };

export const dynamic = "force-dynamic";

export default async function InscriptionPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const officeList = isDatabaseConfigured
    ? await db.select().from(offices).catch(() => [])
    : [];
  return (
    <AuthSplit image="/images/hero-famille.jpg" title="Votre espace, en quelques minutes." subtitle="Quelques informations suffisent pour personnaliser votre accueil et préremplir vos démarches.">
      <h2 className="text-3xl font-bold text-[#1d1d1f]">Créer mon espace</h2>
      <p className="mt-2 text-sm text-slate-600">Aucune donnée réelle n&apos;est demandée (ni numéro de sécurité sociale, ni information médicale).</p>
      {!isDatabaseConfigured && (
        <p role="status" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          La création de compte sera disponible après configuration de la base de données PostgreSQL.
        </p>
      )}
      <RegisterForm offices={officeList} available={isDatabaseConfigured} next={next} />
      <p className="mt-6 text-sm text-slate-600">
        Déjà inscrit ? <Link href={next ? `/connexion?next=${encodeURIComponent(next)}` : "/connexion"} className="font-semibold text-emerald-700 hover:underline">Me connecter</Link>
      </p>
    </AuthSplit>
  );
}
