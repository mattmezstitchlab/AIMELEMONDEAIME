import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCaseDetail } from "@/lib/queries";
import { Card, SectionTitle, StatusBadge, Tag, formatDateTime } from "@/components/ui";
import { CASE_EVENT_LABELS, THEME_META } from "@/lib/constants";
import { CaseForm } from "./case-form";
import { DocumentUploader } from "@/components/document-uploader";
import { CaseMessageForm } from "@/components/case-message-form";
import { respondToMissingDocument } from "@/lib/actions/cases";

export const metadata: Metadata = { title: "Ma démarche — AIME®" };

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caseId = Number(id);
  if (!Number.isFinite(caseId)) notFound();

  const user = (await getCurrentUser())!;
  const detail = await getCaseDetail(caseId);
  if (!detail) notFound();
  if (detail.item.memberId !== user.id) redirect("/espace/demarches");

  const { item, procedureType, events, actorMap, caseDocuments } = detail;
  const editable = item.status === "brouillon" || item.status === "piece_manquante";

  return (
    <div className="flex flex-col gap-6">
      <Link href="/espace/demarches" className="text-sm font-medium text-emerald-800 hover:underline">← Mes démarches</Link>
      <SectionTitle
        image={THEME_META[procedureType?.category ?? ""]?.image ?? "/images/hero-campagne.jpg"}
        eyebrow={`Dossier ${item.reference}`}
        title={item.title}
        description={procedureType?.description}
        actions={<StatusBadge status={item.status} onDark />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {item.status === "piece_manquante" && item.requestedDocuments.length > 0 && (
            <Card className="border-rose-200 bg-rose-50">
              <p className="text-sm font-semibold text-rose-800">Pièce(s) manquante(s)</p>
              <ul className="mt-1 list-inside list-disc text-sm text-rose-800">
                {item.requestedDocuments.map((doc) => <li key={doc}>{doc}</li>)}
              </ul>
              <p className="mt-2 text-sm text-rose-700">Déposez le document demandé ci-dessous et/ou répondez à votre gestionnaire.</p>
            </Card>
          )}

          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Informations transmises</h2>
            {editable ? (
              <div className="mt-4">
                <CaseForm
                  caseId={item.id}
                  fields={procedureType?.fields ?? []}
                  initialData={item.data}
                  canSubmit={item.status === "brouillon"}
                  requiredDocuments={procedureType?.requiredDocuments ?? []}
                  hasUploadedDocument={caseDocuments.length > 0}
                />
              </div>
            ) : (
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {Object.entries(item.data).map(([key, value]) => {
                  const field = procedureType?.fields.find((f) => f.name === key);
                  return (
                    <div key={key}>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{field?.label ?? key}</dt>
                      <dd className="text-sm text-slate-800">{value || "—"}</dd>
                    </div>
                  );
                })}
              </dl>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Documents du dossier</h2>
            {caseDocuments.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">Aucun document déposé pour l&apos;instant.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {caseDocuments.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <span>{doc.filename} {doc.isSpecimen && <Tag>SPÉCIMEN</Tag>}</span>
                    <a href={`/api/documents/${doc.id}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-800 hover:underline">
                      Télécharger
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {(item.status === "brouillon" || item.status === "piece_manquante") && (
              <div className="mt-4">
                <DocumentUploader caseId={item.id} />
              </div>
            )}
          </Card>

          {item.status !== "brouillon" && (
            <Card>
              <h2 className="text-lg font-semibold text-slate-900">Échanger avec mon bureau</h2>
              <p className="mt-1 text-sm text-slate-600">Répondez directement sur ce dossier, par exemple pour confirmer l&apos;envoi d&apos;une pièce.</p>
              <div className="mt-3">
                <div data-assistant-id="case-message"><CaseMessageForm caseId={item.id} sendMessage={respondToMissingDocument} /></div>
              </div>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Historique du dossier</h2>
            <ol className="mt-3 flex flex-col gap-4 border-l-2 border-emerald-100 pl-4">
              {events.map((event) => (
                <li key={event.id} className="relative">
                  <span className="absolute -left-[22px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-600" aria-hidden="true" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">{CASE_EVENT_LABELS[event.type] ?? event.type}</p>
                  <p className="text-sm text-slate-700">{event.message}</p>
                  <p className="text-xs text-slate-500">
                    {event.actorId ? actorMap.get(event.actorId)?.fullName ?? "Utilisateur" : "Système"} · {formatDateTime(event.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
