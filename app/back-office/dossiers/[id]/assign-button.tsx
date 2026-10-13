"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignCaseToSelf } from "@/lib/actions/cases";
import { SecondaryButton } from "@/components/ui";

export function AssignButton({ caseId }: { caseId: number }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <SecondaryButton
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await assignCaseToSelf(caseId);
          if (result.ok) router.refresh();
          else alert(result.error);
        })
      }
    >
      {isPending ? "Affectation…" : "M'affecter ce dossier"}
    </SecondaryButton>
  );
}
