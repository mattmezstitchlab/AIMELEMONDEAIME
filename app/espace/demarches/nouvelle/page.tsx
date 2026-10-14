import Link from "next/link";
import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { journeys, projectMembers, projects } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getActiveProcedureTypes } from "@/lib/queries";
import { SectionTitle, Card } from "@/components/ui";
import { Icon } from "@/components/icon";
import { SITUATIONS, SITUATION_BY_KEY } from "@/lib/situations";
import { JourneyWizard } from "@/components/espace/journey-ui";
import { startProcedure } from "@/lib/actions/cases";

export const metadata: Metadata = { title: "Nouvelle démarche — AIME®" };

export const dynamic = "force-dynamic";

export default async function NouvelleDemarche({ searchParams }: { searchParams: Promise<{ situation?: string; reprendre?: string; q?: string; erreur?: string }> }) {
  const user = (await getCurrentUser())!;
  const sp = await searchParams;
  let journey: typeof journeys.$inferSelect | null = null;
  if (sp.reprendre) {
    const [j] = await db.select().from(journeys).where(and(eq(journeys.id, Number(sp.reprendre)), eq(journeys.userId, user.id))).limit(1);
    journey = j ?? null;
  }
  const situation = journey?.situation ?? sp.situation;
  const def = situation ? SITUATION_BY_KEY.get(situation) : undefined;

  if (def) {
    const myProjects = await db.select({ id: projects.id, title: projects.title }).from(projectMembers).innerJoin(projects, eq(projectMembers.projectId, projects.id))
      .where(and(eq(projectMembers.userId, user.id), eq(projectMembers.role, "organisateur"), eq(projectMembers.status, "accepte"), eq(projects.status, "ouvert")));
    return (
      <div className="flex flex-col gap-6">
        <SectionTitle eyebrow="Nouvelle démarche" title={def.label} description={def.description} />
        <Link href={def.key === "mariage" ? "/accompagnement?besoin=mariage" : "/espace/demarches/nouvelle"} className="text-sm font-semibold text-ink underline">{def.key === "mariage" ? "← Retour au parcours mariage" : "← Choisir une autre situation"}</Link>
        <Card><JourneyWizard situation={def.key} questions={def.questions} initial={journey?.answers ?? {}} journeyId={journey?.id} projects={myProjects} /></Card>
        <p className="text-xs text-slate-500">Vos réponses restent privées : elles ne sont visibles ni sur la carte, ni par les participants de vos projets, ni par votre famille ou vos cercles.</p>
      </div>
    );
  }

  const normalize = (x: string) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const q = normalize(sp.q ?? "");
  const list = q ? SITUATIONS.filter((s) => normalize(`${s.label} ${s.description}`).includes(q)) : SITUATIONS;
  const allProcedures = await getActiveProcedureTypes();
  const procedures = q ? allProcedures.filter((p) => normalize(`${p.title} ${p.description}`).includes(q)) : allProcedures;
  return (
    <div className="flex flex-col gap-8">
      <SectionTitle eyebrow="Nouvelle démarche" title="De quoi avez-vous besoin aujourd'hui ?" description="Un parcours guidé pour préparer vous-même, ou un dossier suivi par un bureau : tout commence ici. Quelques questions suffisent ; vous pourrez enregistrer et reprendre plus tard." />
      <form role="search" className="flex max-w-xl gap-2"><label htmlFor="sq" className="sr-only">Chercher une situation</label><input id="sq" name="q" defaultValue={sp.q} placeholder="Ex. naissance, logement, concert, retraite…" className="min-w-0 flex-1 rounded-control ring-1 ring-slate-300 px-4 py-2.5 text-sm" /><button className="rounded-control bg-ink px-4 text-sm font-bold text-white">Chercher</button></form>
      <p className="-mt-6 text-xs text-slate-500">La recherche porte sur les mots des situations proposées : elle ne comprend pas librement toutes les demandes. En cas de doute, un conseiller France services peut vous orienter.</p>
      {sp.erreur && <p role="alert" className="-mb-2 rounded-control bg-rose-50 px-4 py-2 text-sm text-rose-700">{sp.erreur}</p>}
      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">Moments de vie — parcours guidés</h2>
        <p className="-mt-2 mb-4 text-sm text-slate-600">Vous préparez vous-même, pas à pas : questions, étapes, pièces et rappels. Rien n&apos;est transmis sans votre accord.</p>
      {list.length === 0 ? <Card><p className="text-sm text-slate-700">Aucune situation ne correspond à « {sp.q} ». Essayez un autre mot, ou rendez-vous dans un <a className="font-semibold text-ink underline" href="https://www.france-services.gouv.fr" target="_blank" rel="noreferrer">espace France services</a> pour un accompagnement humain.</p></Card> : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((s) => {
            const pathwayLabel = s.key === "mariage"
              ? "Parcours mariage : démarches civiles et options de préparation"
              : s.key === "evenement"
                ? "Parcours événement : artiste et organisation, si utile"
                : s.pilot
                  ? "Parcours guidé : projet et ressources"
                  : "Orientation sourcée et liste d'actions";
            return (
              <Link key={s.key} href={`/espace/demarches/nouvelle?situation=${s.key}`} className="group flex gap-4 rounded-card bg-canvas ring-1 ring-line p-5 shadow-rested hover:ring-ink-4">
                <Icon name={s.icon} className="h-8 w-8 shrink-0 text-ink-3" />
                <span><span className="block font-bold text-slate-900">{s.label}</span><span className="mt-1 block text-sm text-slate-600">{s.description}</span><span className="mt-2 inline-block text-xs font-semibold text-ink">{pathwayLabel}</span></span>
              </Link>
            );
          })}
        </div>
      )}
      </section>
      {procedures.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900">Démarches suivies par un bureau</h2>
          <p className="-mt-2 mb-4 text-sm text-slate-600">Vous remplissez un dossier, puis vous le transmettez à l&apos;équipe d&apos;accompagnement qui l&apos;instruit et vous répond ici même. Dans cette version, l&apos;équipe est simulée : aucun organisme réel n&apos;est destinataire.</p>
          <div className="grid gap-4 md:grid-cols-2">{procedures.map((p) => (
            <form key={p.id} action={startProcedure} className="group flex gap-4 rounded-card bg-canvas ring-1 ring-line p-5 shadow-rested hover:ring-ink-4">
              <input type="hidden" name="procedureTypeId" value={p.id} />
              <Icon name="building" className="h-8 w-8 shrink-0 text-ink-3" />
              <span><span className="block font-bold text-slate-900">{p.title}</span><span className="mt-1 block text-sm text-slate-600">{p.description}</span>
              <button type="submit" className="mt-3 rounded-control bg-ink px-3 py-2 text-xs font-bold text-white">Commencer ce dossier</button></span>
            </form>
          ))}</div>
        </section>
      )}
    </div>
  );
}
