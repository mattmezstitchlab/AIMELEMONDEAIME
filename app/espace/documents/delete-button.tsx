"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteOwnDraftDocument } from "@/lib/actions/documents";

export function DeleteDocumentButton({ documentId }: { documentId: number }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm("Supprimer ce document ?")) return;
    startTransition(async () => {
      const result = await deleteOwnDraftDocument(documentId);
      if (result.ok) {
        router.refresh();
      } else {
        alert(result.error);
      }
    });
  }

  return (
    <button type="button" onClick={handleDelete} disabled={isPending} className="text-sm font-semibold text-ink-2 hover:underline disabled:opacity-60">
      {isPending ? "Suppression…" : "Supprimer"}
    </button>
  );
}
