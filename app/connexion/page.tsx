import Link from "next/link";
import type { Metadata } from "next";
import { AuthSplit } from "@/components/public-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion — AIME®", description: "Connectez-vous à votre espace AIME® : démarches, projets, échanges et documents au même endroit." };

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthSplit title="Bon retour parmi nous." subtitle="Retrouvez vos démarches, vos projets, vos échanges et vos documents dans un seul espace.">
      <h2 className="text-3xl font-bold text-[#1d1d1f]">Connexion à AIME®</h2>
      <p className="mt-2 text-slate-600">Un seul compte pour tout. AIME® ne vous demandera jamais les mots de passe de vos comptes administratifs.</p>
      <LoginForm next={next} />
      <p className="mt-6 text-sm text-slate-600">
        Pas encore de compte ? <Link href="/inscription" className="font-semibold text-emerald-700 hover:underline">Créer mon espace</Link>
      </p>
      <p className="mt-10 rounded-2xl bg-[#fafaf9] p-5 text-sm text-slate-600">
        Vous découvrez AIME® ? <Link href="/decouvrir" className="font-semibold text-emerald-800 underline">Visitez l&apos;espace en lecture seule</Link>, sans créer de compte.
      </p>
    </AuthSplit>
  );
}
