import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getDocumentsHub } from "@/lib/journey-queries";
import { Card, SectionTitle, Tag, EmptyState, formatDate } from "@/components/ui";
import { DocumentUploader } from "@/components/document-uploader";
import { ShareControls } from "@/components/espace/journey-ui";
import { DeleteDocumentButton } from "./delete-button";

export const metadata: Metadata = { title: "Mes documents — AIME®" };

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const user = (await getCurrentUser())!;
  const hub = await getDocumentsHub(user.id);
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle eyebrow="Mes documents" title="Vos pièces, au même endroit" description="Chaque document existe une seule fois. Vous choisissez précisément qui peut l'ouvrir, et vous pouvez révoquer l'accès à tout moment." />
      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Déposer un document</h2>
        <p className="mt-1 text-sm text-slate-600">Il reste privé. Vous pourrez ensuite le relier à une démarche ou le partager. Ne déposez ni numéro de sécurité sociale, ni document médical.</p>
        <div className="mt-4"><DocumentUploader /></div>
      </Card>
      <section>
        <h2 className="text-lg font-bold text-slate-900">Mes documents personnels</h2>
        {hub.own.length === 0 ? <div className="mt-3"><EmptyState title="Aucun document" /></div> : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">{hub.own.map((d) => (
            <Card key={d.id} className="!p-5">
              <div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold text-slate-900">{d.filename}</p><p className="text-xs text-slate-500">{d.category} · {formatDate(d.createdAt)}</p></div>{d.isSpecimen && <Tag>SPÉCIMEN</Tag>}</div>
              <div className="mt-2 flex items-center gap-4"><a href={`/api/documents/${d.id}`} className="text-sm font-semibold text-ink underline">Télécharger</a>{!d.caseId && d.shares.length === 0 && <DeleteDocumentButton documentId={d.id} />}</div>
              <ShareControls documentId={d.id} shares={d.shares} projects={hub.projectsForShare} />
            </Card>
          ))}</div>
        )}
      </section>
      <section>
        <h2 className="text-lg font-bold text-slate-900">Partagés avec moi</h2>
        {hub.sharedWithMe.length === 0 ? <p className="mt-2 text-sm text-slate-600">Aucun document partagé avec vous.</p> : <ul className="mt-3 space-y-2">{hub.sharedWithMe.map((d) => <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-card bg-white p-3 text-sm shadow-rested"><span>{d.filename} <span className="text-xs text-slate-500">· de {d.ownerName}</span></span><a href={`/api/documents/${d.id}`} className="text-xs font-bold text-ink underline">Télécharger</a></li>)}</ul>}
      </section>
      <section>
        <h2 className="text-lg font-bold text-slate-900">Documents de mes projets</h2>
        {hub.projectDocs.length === 0 ? <p className="mt-2 text-sm text-slate-600">Aucun document de projet.</p> : <ul className="mt-3 space-y-2">{hub.projectDocs.map((d) => <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-card bg-white p-3 text-sm shadow-rested"><span>{d.filename} <span className="text-xs text-slate-500">· <Link href={`/le-monde-aime/projets/${d.projectId}`} className="underline">{d.title}</Link> · {d.access === "organisateurs" ? "organisateurs" : "participants"}</span></span><a href={`/api/projets/${d.projectId}/documents/${d.id}`} className="text-xs font-bold text-ink underline">Télécharger</a></li>)}</ul>}
      </section>
      <p className="text-xs text-slate-500">Historique des paiements de démonstration : <Link href="/espace/paiements" className="underline">Mes paiements</Link>.</p>
    </div>
  );
}
