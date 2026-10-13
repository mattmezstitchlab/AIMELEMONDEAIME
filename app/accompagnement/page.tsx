import Link from "next/link";
import type { Metadata } from "next";
import { PublicPage } from "@/components/public-shell";
import { Hero, LinkButton, formatDate } from "@/components/ui";
import { Icon } from "@/components/icon";
import { getOrganisms } from "@/lib/journey-queries";
import { ORGANISM_CATEGORY_LABEL, SITUATIONS, SITUATION_BY_KEY, RULES_REVIEWED_AT } from "@/lib/situations";
import { OrientationEntry } from "@/components/orientation-entry";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Accompagnement des démarches — AIME®", description: "Vous expliquez votre situation. AIME® vous aide à trouver les personnes, les ressources et les démarches pour avancer." };

export default async function Accompagnement({ searchParams }: { searchParams: Promise<{ besoin?: string }> }) {
  const { besoin } = await searchParams;
  const selected = besoin ? SITUATION_BY_KEY.get(besoin) : undefined;
  const orgs = await getOrganisms();
  const cats = Object.keys(ORGANISM_CATEGORY_LABEL);
  return (
    <PublicPage>
      <Hero tone="demarche" image="/images/hero-conseiller.jpg" eyebrow="AIME® · Accompagnement" title="Vous expliquez votre situation." subtitle="AIME® vous aide à trouver les personnes, les ressources et les démarches pour avancer — dans un seul espace, sans recommencer votre histoire à chaque étape."
        actions={<><LinkButton href="/espace/demarches/nouvelle">Commencer une démarche <Icon name="arrow" className="h-4 w-4" /></LinkButton><LinkButton href="#organismes" variant="ghost">Les organismes de référence</LinkButton></>} />
      {selected && (
        <section className="border-b border-slate-200 bg-[#fafaf9]">
          <div className="mx-auto max-w-7xl px-6 py-14">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Parcours suggéré · orientation, pas une décision</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{selected.label}</h2>
            <p className="mt-2 max-w-2xl text-slate-700">{selected.description}</p>
            <p className="mt-4 text-sm font-semibold text-slate-800">Quelques questions seront posées, une par étape :</p>
            <ul className="mt-2 max-w-2xl list-inside list-disc space-y-1 text-sm text-slate-700">
              {selected.questions.slice(0, 3).map((q) => <li key={q.key}>{q.label.replace(" (facultatif)", "")}</li>)}
            </ul>
            {(selected.key === "demenagement" || selected.key === "deces_proche") && (
              <p className="mt-4 text-sm text-slate-700">Guide officiel : <a href={selected.key === "demenagement" ? "https://www.service-public.gouv.fr/particuliers/vosdroits/F14128" : "https://www.service-public.gouv.fr/particuliers/vosdroits/F16507"} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-900 underline">Service-Public.gouv.fr ↗</a>. AIME® ne réalise aucune déclaration à votre place.</p>
            )}
            <div className="mt-6"><LinkButton href={`/espace/demarches/nouvelle?situation=${encodeURIComponent(selected.key)}`}>Préparer ce parcours dans Mon espace <Icon name="arrow" className="h-4 w-4" /></LinkButton></div>
            <p className="mt-3 text-xs text-slate-600">La connexion sert uniquement à enregistrer et reprendre vos réponses privées.</p>
          </div>
        </section>
      )}
      <section className="bg-white"><div className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-3xl font-bold text-[#1d1d1f]">De quoi avez-vous besoin aujourd&apos;hui ?</h2>
        <div className="mt-6 max-w-2xl"><OrientationEntry /></div>
        <p className="mt-10 text-sm font-bold text-slate-700">Ou parcourez les situations :</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{SITUATIONS.map((s) => <Link key={s.key} href={`/espace/demarches/nouvelle?situation=${s.key}`} className="rounded-2xl bg-[#fafaf9] p-6 hover:bg-emerald-50"><Icon name={s.icon} className="h-8 w-8 text-emerald-600" /><p className="mt-3 font-bold text-slate-900">{s.label}</p><p className="mt-1 text-sm text-slate-600">{s.description}</p></Link>)}</div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[["Orientation", "Expliquer, identifier les interlocuteurs, ouvrir les services officiels.", "Disponible"], ["Préparation", "Étapes, pièces, rappels personnels, récapitulatif exportable.", "Disponible"], ["Connexion officielle", "Récupérer ou transmettre des données à un organisme, avec intégration et autorisation.", "Non disponible — aucune intégration active"]].map(([t, d, st]) => <div key={t} className="rounded-2xl border border-slate-200 p-6"><p className="text-lg font-bold text-slate-900">{t}</p><p className="mt-1 text-sm text-slate-600">{d}</p><p className={`mt-3 text-xs font-bold ${st === "Disponible" ? "text-emerald-700" : "text-amber-800"}`}>{st}</p></div>)}
        </div>
        <p className="mt-6 text-xs text-slate-500">AIME® ne demande jamais les mots de passe de vos comptes administratifs et ne contourne aucun accès officiel. Il ne promet ni aide, ni validation, ni ouverture de droits : les organismes compétents restent responsables de leurs décisions.</p>
      </div></section>
      <section id="organismes" className="scroll-mt-20 bg-[#fafaf9]"><div className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-3xl font-bold text-[#1d1d1f]">Organismes et services de référence</h2>
        <p className="mt-2 max-w-3xl text-slate-600">Organismes externes référencés pour vous orienter. Ce ne sont pas des partenaires d&apos;AIME®. Pour chaque fiche : rôle, public, territoire, lien officiel et état de vérification. Règles d&apos;orientation revues le {new Date(RULES_REVIEWED_AT).toLocaleDateString("fr-FR")}.</p>
        {cats.map((c) => { const list = orgs.filter((o) => o.category === c); if (!list.length) return null; return (
          <div key={c} className="mt-10"><h3 className="text-xl font-bold text-slate-900">{ORGANISM_CATEGORY_LABEL[c]}</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{list.map((o) => <article key={o.id} className="rounded-2xl bg-white p-5 shadow-sm"><a href={o.url} target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-800 underline">{o.name} ↗</a><p className="mt-2 text-sm text-slate-700">{o.role}</p><p className="mt-2 text-xs text-slate-500">Public : {o.audience} · Territoire : {o.territory}</p><p className={`mt-2 text-[11px] font-semibold ${o.contentStatus === "verifie" ? "text-emerald-700" : "text-amber-800"}`}>{o.contentStatus === "verifie" ? `Vérifié le ${formatDate(o.verifiedAt!)}${o.source ? " · source citée" : ""}` : o.linkStatus === "verifie" ? `Lien officiel accessible le ${formatDate(o.verifiedAt!)} · description à vérifier` : "À vérifier : lien non joignable lors du dernier contrôle"}</p></article>)}</div></div>); })}
        <p className="mt-10 text-sm text-slate-600">Les points d&apos;accueil affichés sur la carte sont des lieux de démonstration fictifs. <Link href="/annuaire" className="font-semibold text-emerald-800 underline">Voir les points d&apos;accueil</Link></p>
      </div></section>
    </PublicPage>
  );
}
