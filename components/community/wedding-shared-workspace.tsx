"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { leaveWeddingAccess, updateSharedWeddingGuestStatus, updateSharedWeddingProgram } from "@/lib/actions/wedding-access";
import { GUEST_STATUSES, guestStatusLabel } from "@/lib/wedding";
import type { WeddingAccessRole } from "@/db/schema";

type ProgramItem = { time: string; label: string };
type SharedGuest = { id: number; name: string; persons: number; status: string; tableId: number | null };
type SharedTable = { id: number; name: string; capacity: number | null };

type Feedback = { ok: boolean; text: string } | null;
const button = "rounded-lg px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50";
const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";

function fmtDate(value: string) {
  if (!value) return "Date à confirmer";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date);
}

export function WeddingSharedWorkspace({
  linkId,
  role,
  projectTitle,
  city,
  weddingDate,
  expiresAt,
  program: initialProgram,
  guests,
  tables,
  canEdit,
}: {
  linkId: number;
  role: WeddingAccessRole;
  projectTitle: string;
  city: string;
  weddingDate: string;
  expiresAt: Date;
  program: ProgramItem[];
  guests: SharedGuest[];
  tables: SharedTable[];
  canEdit: boolean;
}) {
  const [program, setProgram] = useState<ProgramItem[]>(initialProgram.map((item) => ({ time: item.time, label: item.label })));
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const isCoordinator = role === "coordination";

  function saveProgram() {
    startTransition(async () => {
      const result = await updateSharedWeddingProgram(linkId, program);
      setFeedback({ ok: result.ok, text: result.ok ? result.message : result.error });
      if (result.ok) router.refresh();
    });
  }

  function updateGuest(guestId: number, status: string) {
    startTransition(async () => {
      const result = await updateSharedWeddingGuestStatus(linkId, guestId, status);
      setFeedback({ ok: result.ok, text: result.ok ? result.message : result.error });
      if (result.ok) router.refresh();
    });
  }

  const assigned = (tableId: number) => guests.filter((guest) => guest.tableId === tableId && guest.status === "confirme");
  const unassignedCount = guests.filter((guest) => guest.status === "confirme" && guest.tableId === null).length;
  const roleText = isCoordinator
    ? "Coordination — programme et réponses des foyers"
    : "Témoin — programme et plan de table, lecture seule";

  return (
    <main className="min-h-[70vh] bg-[#fafaf9] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-700">Espace mariage partagé</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">{projectTitle}</h1>
              <p className="mt-2 text-sm text-slate-600">{fmtDate(weddingDate)} · {city}</p>
            </div>
            <form action={leaveWeddingAccess}>
              <button type="submit" className={`${button} border border-slate-300 bg-white text-slate-700`}>Quitter cet accès</button>
            </form>
          </div>
          <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-950">
            <p className="font-bold">Votre rôle : {roleText}</p>
            <p className="mt-1">Accès limité à ce mariage, jusqu&apos;au {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(expiresAt)}. Les documents, messages privés, budget, notes d&apos;invités et espaces personnels ne sont pas partagés.</p>
          </div>
        </header>

        <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Déroulé</h2>
          <p className="mt-1 text-xs text-slate-500">Horaires et étapes partagés avec les personnes qui organisent.</p>
          {program.length === 0 && <p className="mt-4 text-sm text-slate-500">Aucune étape ajoutée pour le moment.</p>}
          <ol className="mt-3 space-y-2">
            {program.map((item, index) => (
              <li key={index} className="grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-[130px_1fr_auto]">
                {isCoordinator && canEdit ? (
                  <>
                    <label className="sr-only" htmlFor={`shared-time-${index}`}>Heure de l&apos;étape {index + 1}</label>
                    <input id={`shared-time-${index}`} value={item.time} onChange={(event) => setProgram((previous) => previous.map((row, i) => i === index ? { ...row, time: event.target.value } : row))} placeholder="Heure" maxLength={30} className={input} />
                    <label className="sr-only" htmlFor={`shared-label-${index}`}>Étape {index + 1}</label>
                    <input id={`shared-label-${index}`} value={item.label} onChange={(event) => setProgram((previous) => previous.map((row, i) => i === index ? { ...row, label: event.target.value } : row))} placeholder="Ex. Cérémonie" maxLength={160} className={input} />
                    <button type="button" onClick={() => setProgram((previous) => previous.filter((_, i) => i !== index))} className="text-xs font-semibold text-rose-700 underline">Retirer</button>
                  </>
                ) : (
                  <>
                    <time className="font-bold text-slate-800">{item.time || "—"}</time>
                    <span className="text-sm text-slate-700">{item.label}</span>
                  </>
                )}
              </li>
            ))}
          </ol>
          {isCoordinator && canEdit && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" disabled={pending || program.length >= 25} onClick={() => setProgram((previous) => [...previous, { time: "", label: "" }])} className={`${button} border border-slate-300 bg-white text-slate-700`}>Ajouter une étape</button>
              <button type="button" disabled={pending} onClick={saveProgram} className={`${button} bg-emerald-800 text-white hover:bg-emerald-900`}>{pending ? "Enregistrement…" : "Enregistrer le déroulé"}</button>
            </div>
          )}
        </section>

        {isCoordinator ? (
          <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Réponses des foyers</h2>
            <p className="mt-1 text-xs text-slate-500">Vous pouvez mettre à jour le statut d&apos;une réponse. Les notes privées et coordonnées ne sont jamais montrées à travers ce lien.</p>
            {guests.length === 0 ? <p className="mt-4 text-sm text-slate-500">Aucun foyer sur la liste pour le moment.</p> : (
              <ul className="mt-3 space-y-2">
                {guests.map((guest) => (
                  <li key={guest.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                    <span className="text-sm font-semibold text-slate-800">{guest.name} <span className="font-normal text-slate-500">· {guest.persons} personne(s)</span></span>
                    {canEdit ? (
                      <label className="text-xs font-semibold text-slate-600">Réponse
                        <select value={guest.status} disabled={pending} onChange={(event) => updateGuest(guest.id, event.target.value)} className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800">
                          {guest.status === "a_inviter" && <option value="a_inviter" disabled>À inviter</option>}
                          {GUEST_STATUSES.filter((status) => status.value !== "a_inviter").map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                        </select>
                      </label>
                    ) : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{guestStatusLabel(guest.status)}</span>}
                  </li>
                ))}
              </ul>
            )}
            {!canEdit && <p className="mt-3 text-xs text-slate-500">Projet fermé : les réponses ne peuvent plus être modifiées.</p>}
          </section>
        ) : (
          <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Plan de table</h2>
            <p className="mt-1 text-xs text-slate-500">Seuls les foyers confirmés et placés apparaissent ici. Aucune note personnelle n&apos;est partagée.</p>
            {tables.length === 0 ? <p className="mt-4 text-sm text-slate-500">Le plan de table n&apos;est pas encore préparé.</p> : (
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {tables.map((table) => (
                  <li key={table.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="font-bold text-slate-900">{table.name}{table.capacity ? <span className="ml-2 text-xs font-normal text-slate-500">· {table.capacity} places</span> : null}</h3>
                    {assigned(table.id).length ? (
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">{assigned(table.id).map((guest) => <li key={guest.id}>{guest.name} · {guest.persons} personne(s)</li>)}</ul>
                    ) : <p className="mt-2 text-xs text-slate-500">Aucun foyer confirmé affecté.</p>}
                  </li>
                ))}
              </ul>
            )}
            {unassignedCount > 0 && <p className="mt-3 text-xs text-slate-600">{unassignedCount} foyer(s) confirmé(s) restent à placer. Les personnes qui organisent peuvent encore ajuster le plan.</p>}
          </section>
        )}

        {feedback && <p role={feedback.ok ? "status" : "alert"} className={`rounded-lg px-3 py-2 text-sm ${feedback.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>{feedback.text}</p>}
        <p className="text-center text-xs text-slate-500">Un accès révocable et limité — sans compte AIME®.</p>
      </div>
    </main>
  );
}
