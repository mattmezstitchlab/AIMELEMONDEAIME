import { GuestInformationEditor } from "@/components/community/guest-information-editor";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicPage } from "@/components/public-shell";
import { getCurrentUser } from "@/lib/auth";
import { getProjectDetail } from "@/lib/lma-queries";
import { getWeddingAccessLinksForOrganizer, getWeddingWorkspace } from "@/lib/wedding-queries";
import { weddingDayPassed } from "@/lib/wedding";
import { UNIVERSE_LABEL } from "@/lib/lma";
import { DocumentsPanel, JoinPanel, NeedsPanel, PendingMembers, ProgramEditor, ProjectChat, ReportContent, Section, StatusControl } from "@/components/community/project-panels";
import { WeddingBudgetPanel, WeddingGuestsPanel, WeddingTablesPanel } from "@/components/community/wedding-panels";
import { WeddingAccessLinksPanel } from "@/components/community/wedding-access-panels";

export const metadata: Metadata = { title: "Projet — Le Monde Aime" };

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
  // Espace mariage (invités, budget) : réservé aux participants acceptés,
  // noms et montants ne sont jamais exposés aux visiteurs du projet.
  const wedding = viewer.isMember ? await getWeddingWorkspace(id) : null;
  const weddingAccessLinks = wedding && user && viewer.isOrganizer
    ? await getWeddingAccessLinksForOrganizer(id, user.id)
    : [];
  return (
    <PublicPage>
      <div className="bg-subtle">
        <div className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6">
          <Link href="/espace" className="text-sm font-semibold text-ink underline">← Mes liens</Link>
          <header className="rounded-card bg-canvas ring-1 ring-line p-6 shadow-rested">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-ink">Projet</span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-ink-2">{STATUS[project.status] ?? project.status}</span>
              {project.isDemo && <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-ink-3">Exemple fictif</span>}
              {project.universes.map((u) => <span key={u} className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-ink">{UNIVERSE_LABEL[u]}</span>)}
            </div>
            <h1 className="mt-3 text-3xl font-bold text-ink">{project.title}</h1>
            <p className="mt-2 text-ink-2">{project.intention}</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div><dt className="text-xs font-bold uppercase tracking-wide text-ink-3">Où</dt><dd>{project.city} · position approximative</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wide text-ink-3">Quand</dt><dd>{fmt(project.startsAt)}{project.endsAt ? ` → ${fmt(project.endsAt)}` : ""}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wide text-ink-3">Qui</dt><dd>Organisé par {detail.organizers.join(", ") || "—"} · {detail.participants} participant(s)</dd></div>
            </dl>
            <div className="mt-4 flex flex-wrap items-center gap-4"><JoinPanel projectId={id} viewer={viewer} loggedIn={!!user} isMemberRole={user?.role === "membre"} />{user && !viewer.isOrganizer && <ReportContent type="projet" id={id} />}</div>
            {viewer.isOrganizer && <div className="mt-4 border-t border-line pt-4"><StatusControl projectId={id} status={project.status} /></div>}
          </header>

          <Section title="Besoins et contributions" hint="Chaque contribution est acceptée explicitement par son propriétaire. Seul un propriétaire peut confirmer sa ressource.">
            <NeedsPanel projectId={id} needs={detail.needs} suggestions={detail.suggestions} isOrganizer={viewer.isOrganizer} open={project.status === "ouvert"} startsAt={project.startsAt} endsAt={project.endsAt} />
            {viewer.isOrganizer && <p className="mt-3 text-xs text-ink-3">Les réponses des propriétaires arrivent dans <Link className="underline" href="/espace">Mes liens → Échanges</Link>.</p>}
          </Section>

          <Section title="Programme"><ProgramEditor projectId={id} program={project.program} editable={viewer.isOrganizer} /></Section>

          {wedding && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-muted px-5 py-4">
              <div>
                <p className="text-sm font-bold text-ink">La page du jour J est prête</p>
                <p className="text-xs text-ink-3">Déroulé, plan de table, prestataires engagés et notes utiles, sur une page à imprimer pour les témoins.</p>
              </div>
              <Link href={`/le-monde-aime/projets/${id}/jour-j`} className="rounded-control bg-ink px-4 py-2.5 text-sm font-bold text-canvas hover:bg-ink">Ouvrir la page du jour J</Link>
            </div>
          )}

          {wedding && viewer.isOrganizer && (
            <Section title="Informations pratiques pour les invités" hint="Un partage explicite, indépendant du programme de travail.">
              <GuestInformationEditor projectId={id} information={wedding.guestInformation} editable={project.status === "ouvert"} />
            </Section>
          )}

          {wedding && viewer.isOrganizer && user && (
            <Section title="Partager avec un proche, sans compte" hint="Créez un lien temporaire à portée limitée pour les proches qui vous aident. Il peut être révoqué à tout moment.">
              <WeddingAccessLinksPanel projectId={id} links={weddingAccessLinks} open={project.status === "ouvert"} />
            </Section>
          )}

          {wedding && (
            <div id="invites" className="scroll-mt-24">
              <Section title="Invités du mariage" hint="La liste vit ici, partagée entre organisateurs : envois et réponses se notent au même endroit.">
                <WeddingGuestsPanel projectId={id} guests={wedding.guests} stats={wedding.guestStats} invitesEstimes={wedding.invitesEstimes} weddingDate={wedding.weddingDate} weddingLieu={wedding.weddingLieu} apresMariage={project.status === "termine" || weddingDayPassed(wedding.weddingDate, new Date())} isOrganizer={viewer.isOrganizer} open={project.status === "ouvert"} />
              </Section>
            </div>
          )}

          {wedding && (
            <div id="plan-de-table" className="scroll-mt-24">
              <Section title="Plan de table" hint="Il se dresse une fois le nombre de convives figé : les foyers confirmés, table par table, partageables avec les témoins qui accueilleront vos invités.">
                <WeddingTablesPanel projectId={id} tables={wedding.tables} guests={wedding.guests} stats={wedding.tableStats} isOrganizer={viewer.isOrganizer} open={project.status === "ouvert"} />
              </Section>
            </div>
          )}

          {wedding && (
            <div id="budget" className="scroll-mt-24">
              <Section title="Budget du mariage" hint={wedding.envelopeFromJourney ? "L’enveloppe vient de la réponse donnée dans votre parcours ; elle s’ajuste ici à tout moment." : "Prévu, devis confirmés et déjà réglé, poste par poste. Aucun paiement ne transite par AIME®."}>
                <WeddingBudgetPanel projectId={id} items={wedding.budgetItems} stats={wedding.budgetStats} isOrganizer={viewer.isOrganizer} open={project.status === "ouvert"} />
              </Section>
            </div>
          )}

          <Section title="Participants">
            {viewer.isMember ? <ul className="flex flex-wrap gap-2">{detail.members.map((m) => <li key={m.userId} className="rounded-full bg-muted px-3 py-1 text-sm">{m.name}{m.role === "organisateur" ? " · organisateur" : ""}</li>)}</ul> : <p className="text-sm text-ink-3">La liste des participants est réservée aux participants du projet.</p>}
            {viewer.isOrganizer && <PendingMembers projectId={id} pendingMembers={detail.pendingMembers} />}
          </Section>

          <Section title="Échanges du projet">
            {viewer.isMember && user ? <ProjectChat projectId={id} messages={detail.messages} userId={user.id} /> : <p className="text-sm text-ink-3">Les échanges sont réservés aux participants acceptés.</p>}
          </Section>

          <Section title="Documents" hint="Selon les rôles : certains documents sont réservés aux organisateurs.">
            {viewer.isMember ? <DocumentsPanel projectId={id} documents={detail.documents} canUpload isOrganizer={viewer.isOrganizer} /> : <p className="text-sm text-ink-3">Les documents sont réservés aux participants acceptés.</p>}
          </Section>
        </div>
      </div>
    </PublicPage>
  );
}
