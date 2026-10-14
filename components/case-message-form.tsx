"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui";

export function CaseMessageForm({
  caseId,
  sendMessage,
  label = "Répondre sur ce dossier",
  placeholder = "Votre message…",
}: {
  caseId: number;
  sendMessage: (caseId: number, message: string) => Promise<{ ok: boolean; error?: string }>;
  label?: string;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) {
      setError("Veuillez saisir un message.");
      return;
    }
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await sendMessage(caseId, value.trim());
      if (result.ok) {
        setValue("");
        setSuccess(true);
        router.refresh();
      } else {
        setError(result.error || "Erreur lors de l'envoi.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor={`msg-${caseId}`} className="text-sm font-medium text-slate-700">{label}</label>
      <textarea
        id={`msg-${caseId}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-lg ring-1 ring-slate-300 px-3 py-2 text-sm focus:ring-ink"
      />
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      {success && <p role="status" className="text-sm text-ink-2">Message envoyé.</p>}
      <PrimaryButton type="submit" disabled={isPending} className="self-start">
        {isPending ? "Envoi…" : "Envoyer"}
      </PrimaryButton>
    </form>
  );
}
