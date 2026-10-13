import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCaseDetail } from "@/lib/queries";
import { Card, SectionTitle, StatusBadge, Tag, formatDateTime, formatDate } from "@/components/ui";
import { CASE_EVENT_LABELS, SITUATION_LABELS } from "@/lib/constants";
import { StatusForm } from "./status-form";
import { AssignButton } from "./assign-button";
import { DocumentUploader } from "@/components/document-uploader";
import { CaseMessageForm } from "@/components/case-message-form";
import { caseworkerReply } from "@/lib/actions/cases";
import { RemindButton } from "../remind-button";

export const metadata: Metadata = { title: "Dossier — Back-office AIME®" };

export const dynamic = "force-dynamic";

export default async function CaseworkerCaseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caseId = Number(id);
  if (!Number.isFinite(caseId)) notFound();

  const user = (await getCurrentUser())!;
  const detail = await getCaseDetail(caseId);
  if (!detail) notFound();
  if (user.role === "gestionnaire" && detail.item.officeId !== user.officeId) {
    redirect("/back-office/dossiers");
  }

  const { item, procedureType, events, actorMap, caseDocuments, member } = detail;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/back-office/dossiers" className="text-sm font-medium text-emerald-800 hover:underline">← Dossiers</Link>
      <SectionTitle
        eyebrow={`Dossier ${item.reference} · ${member?.fullName ?? ""}`}
        title={item.title}
        description={detail.caseworker ? `Gestionnaire : ${detail.caseworker.fullName}` : "Dossier non affecté"}
        actions={<StatusBadge status={item.status} onDark />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Adhérent</h2>
              {!item.assignedCaseworkerId && <AssignButton caseId={item.id} />}
            </div>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Nom</dt><dd className="font-medium text-slate-900">{member?.fullName}</dd></div>
              <div><dt className="text-slate-500">Situation</dt><dd className="font-medium text-slate-900">{SITUATION_LABELS[member?.situation ?? ""] ?? "—"}</dd></div>
              <div><dt className="text-slate-500">Téléphone</dt><dd className="font-medium text-slate-900">{member?.phone ?? "—"}</dd></div>
              <div><dt className="text-slate-500">Adresse</dt><dd className="font-medium text-slate-900">{member?.address}, {member?.postalCode} {member?.city}</dd></div>
            </dl>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Informations transmises</h2>
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
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Documents du dossier</h2>
            {caseDocuments.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">Aucun document déposé.</p>
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
            <div className="mt-4">
              <DocumentUploader caseId={item.id} />
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Répondre à l&apos;adhérent</h2>
            <div className="mt-3">
              <div data-assistant-id="case-message"><CaseMessageForm caseId={item.id} sendMessage={caseworkerReply} label="Message à l'adhérent" /></div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Gérer le dossier</h2>
            <div className="mt-3">
              <div data-assistant-id="case-status-form"><StatusForm caseId={item.id} currentStatus={item.status} currentRequested={item.requestedDocuments} /></div>
              {item.status === "piece_manquante" && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-sm text-slate-600">Le membre doit fournir : {item.requestedDocuments.length ? item.requestedDocuments.join(", ") : "une pièce demandée"}.</p>
                  <div className="mt-2"><RemindButton caseId={item.id} /></div>
                  <p className="mt-1 text-xs text-slate-400">Une relance tous les 7 jours au maximum.</p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Historique</h2>
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

          <Card>
            <h2 className="text-sm font-semibold text-slate-900">Créé le</h2>
            <p className="text-sm text-slate-600">{formatDate(item.createdAt)}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
