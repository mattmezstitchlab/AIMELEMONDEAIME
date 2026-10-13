import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPage } from "@/components/public-shell";
import { getCurrentUser } from "@/lib/auth";
import { getProjectDetail } from "@/lib/lma-queries";
import { UNIVERSE_LABEL } from "@/lib/lma";
import { DocumentsPanel, JoinPanel, NeedsPanel, PendingMembers, ProgramEditor, ProjectChat, ReportContent, Section, StatusControl } from "@/components/community/project-panels";

export const dynamic = "force-dynamic";
const fmt = (d: Date | null) => (d ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(d) : "");
const STATUS: Record<string, string> = { ouvert: "Ouvert", termine: "Terminé", annule: "Annulé" };

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id)) notFound();
  const user = await getCurrentUser();
  const detail = await getProjectDetail(id, user?.id ?? null);
  if (!detail) notFound();
  const { project, viewer } = detail;
  return (
    <PublicPage solidHeader lma>
      <div className="bg-[#fafaf9]">
        <div className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6">
          <Link href="/espace" className="text-sm font-semibold text-emerald-800 underline">← Mes liens</Link>
          <header className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800">Projet</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{STATUS[project.status] ?? project.status}</span>
              {project.isDemo && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Exemple fictif</span>}
              {project.universes.map((u) => <span key={u} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">{UNIVERSE_LABEL[u]}</span>)}
            </div>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">{project.title}</h1>
            <p className="mt-2 text-slate-700">{project.intention}</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Où</dt><dd>{project.city} · position approximative</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Quand</dt><dd>{fmt(project.startsAt)}{project.endsAt ? ` → ${fmt(project.endsAt)}` : ""}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Qui</dt><dd>Organisé par {detail.organizers.join(", ") || "—"} · {detail.participants} participant(s)</dd></div>
            </dl>
            <div className="mt-4 flex flex-wrap items-center gap-4"><JoinPanel projectId={id} viewer={viewer} loggedIn={!!user} isMemberRole={user?.role === "membre"} />{user && !viewer.isOrganizer && <ReportContent type="projet" id={id} />}</div>
            {viewer.isOrganizer && <div className="mt-4 border-t border-slate-100 pt-4"><StatusControl projectId={id} status={project.status} /></div>}
          </header>

          <Section title="Besoins et contributions" hint="Chaque contribution est acceptée explicitement par son propriétaire. Seul un propriétaire peut confirmer sa ressource.">
            <NeedsPanel projectId={id} needs={detail.needs} suggestions={detail.suggestions} isOrganizer={viewer.isOrganizer} open={project.status === "ouvert"} startsAt={project.startsAt} endsAt={project.endsAt} />
            {viewer.isOrganizer && <p className="mt-3 text-xs text-slate-500">Les réponses des propriétaires arrivent dans <Link className="underline" href="/espace">Mes liens → Échanges</Link>.</p>}
          </Section>

          <Section title="Programme"><ProgramEditor projectId={id} program={project.program} editable={viewer.isOrganizer} /></Section>

          <Section title="Participants">
            {viewer.isMember ? <ul className="flex flex-wrap gap-2">{detail.members.map((m) => <li key={m.userId} className="rounded-full bg-slate-100 px-3 py-1 text-sm">{m.name}{m.role === "organisateur" ? " · organisateur" : ""}</li>)}</ul> : <p className="text-sm text-slate-600">La liste des participants est réservée aux participants du projet.</p>}
            {viewer.isOrganizer && <PendingMembers projectId={id} pendingMembers={detail.pendingMembers} />}
          </Section>

          <Section title="Échanges du projet">
            {viewer.isMember && user ? <ProjectChat projectId={id} messages={detail.messages} userId={user.id} /> : <p className="text-sm text-slate-600">Les échanges sont réservés aux participants acceptés.</p>}
          </Section>

          <Section title="Documents" hint="Selon les rôles : certains documents sont réservés aux organisateurs.">
            {viewer.isMember ? <DocumentsPanel projectId={id} documents={detail.documents} canUpload isOrganizer={viewer.isOrganizer} /> : <p className="text-sm text-slate-600">Les documents sont réservés aux participants acceptés.</p>}
          </Section>
        </div>
      </div>
    </PublicPage>
  );
}
