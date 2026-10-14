"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAppointmentStatus } from "@/lib/actions/appointments";

export function AppointmentActions({ appointmentId, status }: { appointmentId: number; status: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function update(newStatus: string) {
    startTransition(async () => {
      const result = await updateAppointmentStatus(appointmentId, newStatus);
      if (result.ok) router.refresh();
      else alert(result.error);
    });
  }

  return (
    <div className="flex gap-2">
      {status === "demandee" && (
        <button onClick={() => update("confirmee")} disabled={isPending} className="rounded-control bg-ink px-3 py-1.5 text-xs font-semibold text-canvas hover:bg-ink-2">
          Confirmer
        </button>
      )}
      {(status === "demandee" || status === "confirmee") && (
        <button onClick={() => update("annulee")} disabled={isPending} className="rounded-control ring-1 ring-line px-3 py-1.5 text-xs font-semibold text-ink-2 hover:bg-muted">
          Annuler
        </button>
      )}
      {status === "confirmee" && (
        <button onClick={() => update("terminee")} disabled={isPending} className="rounded-control ring-1 ring-line px-3 py-1.5 text-xs font-semibold text-ink-2 hover:bg-muted">
          Marquer terminé
        </button>
      )}
    </div>
  );
}
