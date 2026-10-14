"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCaseStatus } from "@/lib/actions/cases";
import { PrimaryButton } from "@/components/ui";
import { CASE_STATUS_LABELS } from "@/lib/constants";
import type { CaseStatus } from "@/db/schema";

const STATUS_OPTIONS: CaseStatus[] = ["envoyee", "en_cours", "piece_manquante", "terminee"];

export function StatusForm({ caseId, currentStatus, currentRequested }: { caseId: number; currentStatus: string; currentRequested: string[] }) {
  const [status, setStatus] = useState<CaseStatus>((currentStatus as CaseStatus) ?? "en_cours");
  const [message, setMessage] = useState("");
  const [requested, setRequested] = useState(currentRequested.join(", "));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const docs = status === "piece_manquante"
      ? requested.split(",").map((d) => d.trim()).filter(Boolean)
      : [];
    startTransition(async () => {
      const result = await updateCaseStatus(caseId, status, message.trim() || undefined, docs);
      if (result.ok) {
        setSuccess(true);
        setMessage("");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-slate-700">Nouveau statut</label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as CaseStatus)}
          className="mt-1 w-full rounded-control ring-1 ring-slate-300 px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{CASE_STATUS_LABELS[s]}</option>)}
        </select>
      </div>
      {status === "piece_manquante" && (
        <div>
          <label htmlFor="requested" className="block text-sm font-medium text-slate-700">Pièce(s) demandée(s) (séparées par une virgule)</label>
          <input
            id="requested"
            value={requested}
            onChange={(e) => setRequested(e.target.value)}
            className="mt-1 w-full rounded-control ring-1 ring-slate-300 px-3 py-2 text-sm"
            placeholder="Ex : Attestation de salaire, Justificatif de domicile"
          />
        </div>
      )}
      <div>
        <label htmlFor="statusMessage" className="block text-sm font-medium text-slate-700">Message associé (visible par l&apos;adhérent)</label>
        <textarea
          id="statusMessage"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-control ring-1 ring-slate-300 px-3 py-2 text-sm"
        />
      </div>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      {success && <p role="status" className="text-sm text-ink-2">Statut mis à jour.</p>}
      <PrimaryButton type="submit" disabled={isPending} className="self-start">
        {isPending ? "Mise à jour…" : "Mettre à jour le statut"}
      </PrimaryButton>
    </form>
  );
}
