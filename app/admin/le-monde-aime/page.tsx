import { getCommunityModerationQueue } from "@/lib/community-queries";
import type { Metadata } from "next";
import { getContentModerationQueue } from "@/lib/lma-queries";
import { ContentModerationActions } from "./content-actions";
import { SectionTitle, Card, EmptyState } from "@/components/ui";
import { ModerationActions } from "./moderation-actions";

export const metadata: Metadata = { title: "Modération — Administration AIME®" };

export const dynamic = "force-dynamic";

export default async function CommunityModerationPage() {
  const reports = await getCommunityModerationQueue();
  const contentReports = await getContentModerationQueue();
  return <div className="flex flex-col gap-6">
    <SectionTitle eyebrow="Le Monde Aime · Administration" title="Signalements locaux" description="Examinez les annonces, projets et récits signalés. Retirer suspend le contenu ; maintenir le laisse publié. Chaque décision est auditée." />
    <div className="rounded-card border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">La modération intervient sur les contenus publics de Le Monde Aime (annonces, projets, récits publiés). Les cercles privés ne sont jamais consultés sans signalement d&apos;un membre. Elle ne garantit pas la qualité d&apos;un échange et ne concerne pas les organismes externes comme la MSA.</div>
    {reports.length ? <div className="grid gap-4">{reports.map((report) => <Card key={report.id}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-rose-700">Signalement · {report.reason.replaceAll("_", " ")}</p><h2 className="mt-1 text-lg font-bold text-slate-900">{report.title}</h2><p className="text-xs text-slate-500">Annonce #{report.listingId} · propriétaire #{report.listingOwnerId} · {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(report.createdAt)}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">À examiner</span></div>
      {report.details && <p className="mt-3 rounded-control bg-slate-50 p-3 text-sm text-slate-700">{report.details}</p>}
      <ModerationActions reportId={report.id} />
    </Card>)}</div> : <EmptyState title="Aucun signalement en attente" description="Les annonces signalées apparaîtront ici pour examen." />}

    {contentReports.length > 0 && <div className="grid gap-4"><h2 className="text-lg font-bold text-slate-900">Projets et récits signalés</h2>{contentReports.map((r) => <Card key={`c${r.id}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Signalement · {r.targetType} · {r.reason.replaceAll("_", " ")}</p>
      <h3 className="mt-1 text-lg font-bold text-slate-900">{r.title}</h3>
      {r.excerpt && <p className="mt-2 rounded-control bg-slate-50 p-3 text-sm text-slate-700">{r.excerpt}</p>}
      {r.details && <p className="mt-2 text-sm text-slate-600">Précision : {r.details}</p>}
      <ContentModerationActions reportId={r.id} />
    </Card>)}</div>}
  </div>;
}
