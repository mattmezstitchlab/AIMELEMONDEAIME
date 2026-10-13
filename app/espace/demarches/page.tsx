import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getMyJourneys } from "@/lib/journey-queries";
import { getMemberCases } from "@/lib/queries";
import { Card, SectionTitle, StatusBadge, LinkButton, EmptyState, formatDate } from "@/components/ui";
import { Icon } from "@/components/icon";
import { SITUATION_BY_KEY } from "@/lib/situations";

export const metadata: Metadata = { title: "Mes démarches — AIME®" };

export const dynamic = "force-dynamic";

export default async function DemarchesPage() {
  const user = (await getCurrentUser())!;
  const [js, memberCases] = await Promise.all([getMyJourneys(user.id), getMemberCases(user.id)]);
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle image="/images/hero-conseiller.jpg" eyebrow="Mes démarches" title="Accompagner vos moments de vie" description="Comprendre, préparer, organiser et suivre — sans recommencer votre histoire à chaque étape."
        actions={<LinkButton href="/espace/demarches/nouvelle"><Icon name="filePlus" className="h-4 w-4" /> Nouvelle démarche</LinkButton>} />
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        <strong>Ce que fait AIME® dans cette version :</strong> orientation (interlocuteurs, liens officiels) et préparation (étapes, pièces, rappels, récapitulatif).
        <strong> Aucune connexion officielle n&apos;est active</strong> : rien n&apos;est transmis à un organisme, et les organismes restent seuls responsables de leurs décisions.
      </div>
      {js.length === 0 ? <EmptyState title="Aucune démarche pour l'instant" description="Décrivez votre situation : nous préparons avec vous les prochaines étapes." action={<LinkButton href="/espace/demarches/nouvelle">Commencer</LinkButton>} /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {js.map((j) => {
            const def = SITUATION_BY_KEY.get(j.situation);
            const href = j.status === "questionnaire" ? `/espace/demarches/nouvelle?reprendre=${j.id}` : `/espace/demarches/suivi/${j.id}`;
            return (
              <Link key={j.id} href={href}>
                <Card className="h-full transition hover:border-emerald-300">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{def?.short}{j.isDemo ? " · exemple fictif" : ""}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{j.title}</p>
                  <p className="text-sm text-slate-600">{j.status === "questionnaire" ? "Questionnaire à terminer — reprenez où vous en étiez" : j.status === "terminee" ? "Terminée" : `${j.done}/${j.total} étapes · prochaine : ${j.next?.label ?? "—"}`}</p>
                  <p className="mt-2 text-xs text-slate-400">Mis à jour le {formatDate(j.updatedAt)}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
      <section>
        <h2 className="text-lg font-bold text-slate-900">Dossiers de démonstration</h2>
        <p className="text-sm text-slate-600">Dossiers fictifs instruits par une équipe d&apos;accompagnement simulée dans AIME® (aucun organisme réel n&apos;est concerné).</p>
        {memberCases.length === 0 ? <p className="mt-3 text-sm text-slate-500">Aucun dossier.</p> : (
          <div className="mt-3 flex flex-col gap-2">{memberCases.map((c) => <Link key={c.id} href={`/espace/demarches/${c.id}`}><Card className="flex flex-wrap items-center justify-between gap-3 !p-4 hover:border-emerald-300"><div><p className="text-xs text-slate-500">{c.reference}</p><p className="font-semibold text-slate-900">{c.title}</p></div><StatusBadge status={c.status} /></Card></Link>)}</div>
        )}
      </section>
    </div>
  );
}
