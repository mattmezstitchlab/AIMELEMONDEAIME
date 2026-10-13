import Link from "next/link";
import type { Metadata } from "next";
import { AuthSplit } from "@/components/auth-split";
import { LoginForm } from "./login-form";

const DEMO = [
  { role: "Membre · ferme (Chartres)", email: "jean.dupont@exemple.fr" },
  { role: "Membre · exploitante (Saint-Brieuc)", email: "marie.lefevre@exemple.fr" },
  { role: "Membre · retraité", email: "paul.martin@exemple.fr" },
  { role: "Musicien (espace artiste)", email: "tom.leroy@exemple.fr" },
  { role: "Atelier couture", email: "odette.lambert@exemple.fr" },
  { role: "Équipe d'accompagnement — Beauce", email: "agent.beauce@aime-demo.fr" },
  { role: "Administration", email: "admin@aime-demo.fr" },
];

export const metadata: Metadata = { title: "Connexion — AIME®", description: "Connectez-vous à votre espace AIME® : démarches, projets, échanges et documents au même endroit." };

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthSplit image="/images/hero-espace.jpg" title="Bon retour parmi nous." subtitle="Retrouvez vos démarches, vos projets, vos échanges et vos documents dans un seul espace.">
      <h2 className="text-3xl font-bold text-[#1d1d1f]">Connexion à AIME®</h2>
      <p className="mt-2 text-slate-600">Un seul compte pour tout. AIME® ne vous demandera jamais les mots de passe de vos comptes administratifs.</p>
      <LoginForm next={next} />
      <p className="mt-6 text-sm text-slate-600">
        Pas encore de compte ? <Link href="/inscription" className="font-semibold text-emerald-700 hover:underline">Créer mon espace</Link>
      </p>
      <div className="mt-10 rounded-2xl bg-[#fafaf9] p-5 text-sm">
        <p className="font-semibold text-slate-800">Comptes de démonstration (fictifs)</p>
        <p className="mt-1 text-xs text-slate-500">Mot de passe commun : <code className="font-semibold text-slate-700">Demo1234!</code></p>
        <ul className="mt-3 space-y-1.5">
          {DEMO.map((d) => (
            <li key={d.email} className="flex flex-wrap justify-between gap-x-3 text-xs"><span className="text-slate-500">{d.role}</span><span className="font-medium text-slate-800">{d.email}</span></li>
          ))}
        </ul>
      </div>
    </AuthSplit>
  );
}
