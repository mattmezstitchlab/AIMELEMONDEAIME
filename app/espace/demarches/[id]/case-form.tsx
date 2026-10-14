"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveDraftData, submitCase, deleteDraftCase } from "@/lib/actions/cases";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import type { FormFieldDef } from "@/db/schema";

export function CaseForm({
  caseId,
  fields,
  initialData,
  canSubmit,
  requiredDocuments,
  hasUploadedDocument,
}: {
  caseId: number;
  fields: FormFieldDef[];
  initialData: Record<string, string>;
  canSubmit: boolean;
  requiredDocuments: string[];
  hasUploadedDocument: boolean;
}) {
  const [values, setValues] = useState<Record<string, string>>(initialData);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isFirstRender = useRef(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaveState("saving");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const result = await saveDraftData(caseId, values);
      setSaveState(result.ok ? "saved" : "error");
    }, 800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  function update(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit() {
    setSubmitError(null);
    startTransition(async () => {
      const result = await submitCase(caseId);
      if (!result.ok) {
        setSubmitError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleDeleteDraft() {
    if (!confirm("Supprimer définitivement ce brouillon ?")) return;
    startTransition(async () => {
      const result = await deleteDraftCase(caseId);
      if (result.ok) {
        router.push("/espace/demarches");
      } else {
        setSubmitError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
            <label htmlFor={field.name} className="block text-sm font-medium text-slate-700">
              {field.label}
              {field.required && <span aria-hidden="true" className="text-rose-600"> *</span>}
            </label>
            {field.type === "textarea" ? (
              <textarea
                id={field.name}
                required={field.required}
                value={values[field.name] ?? ""}
                onChange={(e) => update(field.name, e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg ring-1 ring-slate-300 px-3 py-2 text-sm focus:ring-ink"
              />
            ) : field.type === "select" ? (
              <select
                id={field.name}
                required={field.required}
                value={values[field.name] ?? ""}
                onChange={(e) => update(field.name, e.target.value)}
                className="mt-1 w-full rounded-lg ring-1 ring-slate-300 px-3 py-2 text-sm focus:ring-ink"
              >
                <option value="" disabled>Choisissez une option</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                id={field.name}
                type={field.type}
                required={field.required}
                value={values[field.name] ?? ""}
                onChange={(e) => update(field.name, e.target.value)}
                className="mt-1 w-full rounded-lg ring-1 ring-slate-300 px-3 py-2 text-sm focus:ring-ink"
              />
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500" role="status">
        {saveState === "saving" && "Enregistrement du brouillon…"}
        {saveState === "saved" && "Brouillon enregistré automatiquement."}
        {saveState === "error" && "Erreur lors de l'enregistrement automatique."}
      </p>

      {requiredDocuments.length > 0 && (
        <div className="rounded-control ring-1 ring-line bg-slate-50 p-4 text-sm">
          <p className="font-semibold text-slate-800">Pièces justificatives nécessaires</p>
          <ul className="mt-1 list-inside list-disc text-slate-600">
            {requiredDocuments.map((doc) => <li key={doc}>{doc}</li>)}
          </ul>
          {!hasUploadedDocument && (
            <p className="mt-2 text-xs font-medium text-amber-700">
              Pensez à joindre au moins un justificatif ci-dessous avant l&apos;envoi.
            </p>
          )}
        </div>
      )}

      {submitError && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{submitError}</p>}

      {canSubmit && (
        <div className="flex flex-wrap gap-3">
          <PrimaryButton onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Envoi en cours…" : "Envoyer le dossier"}
          </PrimaryButton>
          <SecondaryButton onClick={handleDeleteDraft} disabled={isPending}>
            Supprimer le brouillon
          </SecondaryButton>
        </div>
      )}
    </div>
  );
}
