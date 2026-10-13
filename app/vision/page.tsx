import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Clock3, LockKeyhole, ShieldCheck } from "lucide-react";
import { PublicPage } from "@/components/public-shell";
import { MILESTONES, PILOT_CRITERIA, POSITIONING, SOURCES } from "@/lib/vision";

export const metadata: Metadata = {
  title: "Notre méthode et nos limites — AIME®",
  description: "Ce que fait le prototype AIME®, ce qui existe déjà dans les services publics et ce qui exige un audit ou une habilitation.",
};

const STATUS = {
  fonctionne: { text: "Fonctionne dans ce prototype", className: "bg-slate-100 text-slate-800" },
  a_verifier: { text: "À vérifier avant déploiement", className: "bg-amber-50 text-amber-900" },
  habilitation: { text: "Habilitation nécessaire", className: "bg-rose-50 text-rose-900" },
} as const;

export default function VisionPage() {
  return (
    <PublicPage solidHeader>
      <div className="bg-[#fafaf9]">
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Notre méthode · prototype indépendant</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-[1.07] tracking-[-0.045em] text-[#171715] sm:text-6xl">Une expérience simple. Des preuves vérifiables.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-700">AIME® ne remplace aucun organisme. Nous réunissons, dans un même espace privé, la préparation des moments de vie et les ressources du territoire. Ici, vous voyez précisément ce qui fonctionne et ce qui reste à construire.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/accompagnement" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-800 px-5 text-sm font-bold text-white hover:bg-emerald-900">Décrire un besoin <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            <Link href="/decouvrir" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800 hover:bg-slate-50">Voir Mon espace (démo)</Link>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-6 px-6 py-16 md:grid-cols-3">
            {[
              { n: "01", title: "Votre histoire", text: "Saisir le strict nécessaire et pouvoir corriger, reprendre ou supprimer ce qui vous appartient.", icon: ShieldCheck },
              { n: "02", title: "Votre territoire", text: "Trouver personnes, offres, besoins et projets sur une carte, sans exposer d'adresse privée.", icon: Clock3 },
              { n: "03", title: "Vos décisions", text: "Distinguer ce que vous avez préparé, ce qui a été réellement envoyé et ce qu'un organisme a confirmé.", icon: LockKeyhole },
            ].map((item) => (
              <div key={item.n} className="rounded-2xl border border-slate-200 p-6">
                <span className="text-xs font-bold tracking-widest text-slate-500">{item.n}</span>
                <item.icon className="mt-6 h-7 w-7 text-slate-900" strokeWidth={1.6} aria-hidden="true" />
                <h2 className="mt-4 text-xl font-bold text-slate-900">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Comparaison honnête</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Ce qui existe déjà — et notre place.</h2>
          <ul className="mt-8 grid gap-3 md:grid-cols-2">
            {POSITIONING.map((line) => (
              <li key={line} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-700"><Check className="mt-0.5 h-5 w-5 shrink-0 text-slate-900" strokeWidth={1.7} aria-hidden="true" />{line}</li>
            ))}
          </ul>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">État réel</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Ce qui marche, ce qui reste.</h2>
            <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
              {MILESTONES.map((m) => (
                <article key={m.title} className="grid gap-4 py-6 md:grid-cols-[15rem_1fr]">
                  <div><span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${STATUS[m.status].className}`}>{STATUS[m.status].text}</span><h3 className="mt-3 text-lg font-bold text-slate-900">{m.title}</h3></div>
                  <div className="space-y-2 text-sm leading-relaxed text-slate-700"><p><strong className="text-slate-900">Aujourd&apos;hui :</strong> {m.present}</p><p><strong className="text-slate-900">Avant d&apos;aller plus loin :</strong> {m.next}</p></div>
                </article>
              ))}
            </div>
            <p className="mt-5 text-xs text-slate-600">Aucune connexion FranceConnect, API Particulier ou transmission vers un organisme n&apos;est active. Les points d&apos;accueil historiques de la démo ne sont pas des guichets officiels certifiés.</p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Recette à conduire</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">À mesurer avec de vraies personnes.</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-700">Ce sont des critères de validation, pas des résultats acquis ni une certification d&apos;accessibilité.</p>
          <ol className="mt-8 grid gap-3 md:grid-cols-2">
            {PILOT_CRITERIA.map((item, index) => (
              <li key={item} className="flex gap-4 rounded-xl bg-white p-5 text-sm leading-relaxed text-slate-700 ring-1 ring-slate-200"><span className="text-lg font-bold text-slate-900">{String(index + 1).padStart(2, "0")}</span>{item}</li>
            ))}
          </ol>
        </section>

        <section className="bg-[#171715] text-white">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">Sources primaires consultées</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-bold sm:text-4xl">Vérifier chaque proposition à sa source.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">Les liens suivants documentent notre positionnement. Ils ne valent pas partenariat ni intégration. Les contenus réglementaires doivent être révisés avant tout usage réel.</p>
            <ul className="mt-8 grid gap-3 md:grid-cols-2">
              {SOURCES.map((source) => (
                <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="group block h-full rounded-xl border border-white/20 p-5 hover:border-white/60 focus-visible:outline-white">
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-white">{source.name}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></span>
                  <span className="mt-2 block text-xs leading-relaxed text-white/70">{source.lesson}</span>
                </a></li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </PublicPage>
  );
}
