import Link from "next/link";
import type { Metadata } from "next";
import { DemoShell } from "@/components/espace/demo-shell";
import { Card, SectionTitle } from "@/components/ui";
import { Icon } from "@/components/icon";
import { SITUATIONS } from "@/lib/situations";

export const metadata: Metadata = {
  title: "Découvrir Mon espace (démonstration) — AIME®",
  description: "Aperçu, sans inscription, de l'espace personnel AIME® : vos démarches, projets, échanges et documents réunis.",
};

const DEMO_TASKS = [
  { label: "Trouver un musicien et lui envoyer une demande", status: "Prêt", tone: "emerald" },
  { label: "Informer la mairie de l'événement ouvert au public", status: "À préparer", tone: "slate" },
  { label: "Vérifier le cadre d'engagement de l'artiste", status: "Cadre à vérifier", tone: "amber" },
];
const DEMO_JOURNEYS = [
  { title: "Fête d'été à la ferme", sub: "4/8 étapes · prochaine : informer la mairie", situation: "Événement et artiste" },
  { title: "Ma famille change", sub: "Questionnaire à terminer", situation: "Famille", draft: true },
];
const DEMO_DUE = [
  { date: "Sam. 12 juillet", label: "Relancer l'artiste pour le devis", kind: "Rappel personnel" },
  { date: "Lun. 21 juillet", label: "Déclarer la buvette en mairie", kind: "Rappel personnel" },
];

export default function DecouvrirPage() {
  return (
    <DemoShell>
      <div className="flex flex-col gap-8">
        <SectionTitle
          image="/images/hero-espace.jpg"
          eyebrow="Démonstration · Mon aperçu"
          title="Bonjour Camille"
          description="Vous expliquez votre situation. AIME® vous aide à trouver les personnes, les ressources et les démarches pour avancer. Ceci est un aperçu : les actions sont désactivées."
        />

        <div className="group flex items-center gap-4 rounded-2xl bg-emerald-800 p-6 text-white shadow-sm">
          <Icon name="arrow" className="h-8 w-8 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">Prochaine action · Fête d&apos;été à la ferme</p>
            <p className="mt-1 text-lg font-semibold">Trouver un musicien et lui envoyer une demande</p>
            <p className="text-sm text-white/80">Prêt</p>
          </div>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-[#1d1d1f]">De quoi avez-vous besoin aujourd&apos;hui ?</h2>
          <p className="mt-1 text-sm text-slate-600">Inutile de savoir quel organisme est compétent : décrivez votre situation, nous vous orientons.</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SITUATIONS.map((s) => (
              <div key={s.key} className="flex flex-col rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
                <Icon name={s.icon} className="h-7 w-7 text-emerald-600" />
                <span className="mt-3 font-semibold text-slate-900">{s.label}</span>
                {s.pilot && <span className="mt-2 w-fit rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Parcours complet</span>}
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900">Démarches en cours</h2>
            <ul className="mt-4 space-y-3">
              {DEMO_JOURNEYS.map((j) => (
                <li key={j.title} className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm ${j.draft ? "bg-amber-50" : "bg-[#fafaf9]"}`}>
                  <span><strong>{j.title}</strong><span className="block text-xs text-slate-500">{j.situation} · {j.sub}</span></span>
                  <Icon name="arrow" className="h-4 w-4 text-emerald-700" />
                </li>
              ))}
            </ul>
            <div className="mt-5 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-bold text-slate-800">Étapes de la démarche « Fête d&apos;été »</h3>
              <ol className="mt-3 space-y-2">
                {DEMO_TASKS.map((t, i) => (
                  <li key={t.label} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm">
                    <span className="font-medium text-slate-800">{i + 1}. {t.label}</span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${t.tone === "emerald" ? "bg-emerald-50 text-emerald-800" : t.tone === "amber" ? "bg-amber-50 text-amber-900" : "bg-slate-100 text-slate-600"}`}>{t.status}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Card>
          <div className="flex flex-col gap-6">
            <Card>
              <h2 className="text-lg font-semibold text-slate-900">À traiter</h2>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="rounded-lg bg-[#fafaf9] px-3 py-2">Une proposition d&apos;artiste attend votre réponse</li>
                <li className="rounded-lg bg-[#fafaf9] px-3 py-2">Demande reçue : panier de légumes (2)</li>
              </ul>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold text-slate-900">Échéances proches</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {DEMO_DUE.map((d) => <li key={d.label} className="rounded-lg bg-[#fafaf9] px-3 py-2"><strong>{d.date}</strong> · {d.label}<span className="block text-xs text-slate-500">{d.kind}</span></li>)}
              </ul>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold text-slate-900">Mes projets</h2>
              <ul className="mt-3 space-y-2 text-sm">
                <li><span className="font-semibold text-emerald-800">Fête d&apos;été à la ferme</span><span className="block text-xs text-slate-500">Chartres · organisateur</span></li>
                <li><span className="font-semibold text-emerald-800">Jardin partagé du bourg</span><span className="block text-xs text-slate-500">Chartres · participant</span></li>
              </ul>
            </Card>
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl bg-emerald-900 px-6 py-10 text-center text-white sm:px-10">
          <h2 className="text-2xl font-bold sm:text-3xl">C&apos;est votre tour.</h2>
          <p className="mx-auto mt-2 max-w-xl text-white/85">Créez votre espace en quelques minutes : un seul compte pour vos démarches, vos projets, vos échanges et vos documents.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/inscription" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50">Créer mon espace <Icon name="arrow" className="h-4 w-4" /></Link>
            <Link href="/le-monde-aime" className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">Explorer la carte</Link>
          </div>
        </section>
      </div>
    </DemoShell>
  );
}
