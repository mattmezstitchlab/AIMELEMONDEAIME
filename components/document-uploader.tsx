"use client";

import { useActionState, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadDocument, type ActionResult } from "@/lib/actions/documents";
import { PrimaryButton } from "@/components/ui";

const initialState: ActionResult | null = null;

const CATEGORY_OPTIONS = [
  { value: "justificatif", label: "Justificatif" },
  { value: "identite", label: "Pièce d'identité" },
  { value: "revenu", label: "Justificatif de revenu" },
  { value: "logement", label: "Justificatif de logement" },
  { value: "arret_travail", label: "Arrêt de travail" },
  { value: "autre", label: "Autre" },
];

export function DocumentUploader({ caseId, onUploaded }: { caseId?: number; onUploaded?: () => void }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  async function action(_prev: ActionResult | null, formData: FormData) {
    const result = await uploadDocument(formData);
    if (result.ok) {
      formRef.current?.reset();
      router.refresh();
      onUploaded?.();
    }
    return result;
  }

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-4">
      {caseId && <input type="hidden" name="caseId" value={caseId} />}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor={`file-${caseId ?? "general"}`} className="block text-sm font-medium text-slate-700">
            Ajouter un document (PDF, JPG, PNG ou Word — 8 Mo max.)
          </label>
          <input
            id={`file-${caseId ?? "general"}`}
            name="file"
            type="file"
            required
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-800"
          />
        </div>
        <div>
          <label htmlFor={`category-${caseId ?? "general"}`} className="block text-sm font-medium text-slate-700">Catégorie</label>
          <select id={`category-${caseId ?? "general"}`} name="category" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>
      {state && !state.ok && <p role="alert" className="text-sm text-rose-700">{state.error}</p>}
      {state && state.ok && <p role="status" className="text-sm text-emerald-700">Document ajouté avec succès.</p>}
      <PrimaryButton type="submit" disabled={pending} className="self-start">
        {pending ? "Envoi…" : "Téléverser le document"}
      </PrimaryButton>
    </form>
  );
}
