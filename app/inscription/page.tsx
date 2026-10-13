import Link from "next/link";
import type { Metadata } from "next";
import { AuthSplit } from "@/components/public-shell";
import { RegisterForm } from "./register-form";
import { db } from "@/db";
import { offices } from "@/db/schema";

export const metadata: Metadata = { title: "Créer mon espace — AIME®", description: "Créez votre espace AIME® pour être accompagné dans vos démarches et rencontrer les personnes près de vous." };

export const dynamic = "force-dynamic";

export default async function InscriptionPage() {
  const officeList = await db.select().from(offices);
  return (
    <AuthSplit title="Votre espace, en quelques minutes." subtitle="Quelques informations suffisent pour personnaliser votre accueil et préremplir vos démarches.">
      <h2 className="text-3xl font-bold text-[#1d1d1f]">Créer mon espace</h2>
      <p className="mt-2 text-sm text-slate-600">Aucune donnée réelle n&apos;est demandée (ni numéro de sécurité sociale, ni information médicale).</p>
      <RegisterForm offices={officeList} />
      <p className="mt-6 text-sm text-slate-600">
        Déjà inscrit ? <Link href="/connexion" className="font-semibold text-emerald-700 hover:underline">Me connecter</Link>
      </p>
    </AuthSplit>
  );
}
