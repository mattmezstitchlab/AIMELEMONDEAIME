"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { remindMissingDocuments } from "@/lib/actions/cases";

/**
 * Relance « pièce manquante » en un clic, depuis la file du bureau.
 * Le serveur impose le délai de 7 jours entre deux relances ; le bouton
 * affiche son verdict (envoyée, ou trop récente) sans quitter la liste.
 */
export function RemindButton({ caseId, compact = false }: { caseId: number; compact?: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<{ kind: "idle" | "busy" | "done" | "error"; message?: string }>({ kind: "idle" });

  async function onClick() {
    if (state.kind === "busy") return;
    setState({ kind: "busy" });
    try {
      const result = await remindMissingDocuments(caseId);
      if (!result.ok) {
        setState({ kind: "error", message: result.error });
        return;
      }
      setState({ kind: "done" });
      router.refresh();
    } catch {
      setState({ kind: "error", message: "La relance n'a pas abouti." });
    }
  }

  if (state.kind === "done") {
    return <span className="text-xs font-semibold text-ink-2">Relance envoyée ✓</span>;
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={state.kind === "busy"}
        className={`rounded-lg bg-ink font-semibold text-white transition hover:bg-ink-2 disabled:opacity-50 ${compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-xs"}`}
      >
        {state.kind === "busy" ? "Envoi…" : "Relancer le membre"}
      </button>
      {state.kind === "error" && <span className="text-xs font-medium text-red-700">{state.message}</span>}
    </span>
  );
}
