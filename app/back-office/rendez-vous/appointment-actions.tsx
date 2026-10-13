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
        <button onClick={() => update("confirmee")} disabled={isPending} className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900">
          Confirmer
        </button>
      )}
      {(status === "demandee" || status === "confirmee") && (
        <button onClick={() => update("annulee")} disabled={isPending} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          Annuler
        </button>
      )}
      {status === "confirmee" && (
        <button onClick={() => update("terminee")} disabled={isPending} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          Marquer terminé
        </button>
      )}
    </div>
  );
}
