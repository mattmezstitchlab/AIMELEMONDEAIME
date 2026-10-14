"use client";

import { useActionState, useRef } from "react";
import { requestAppointment, type ActionResult } from "@/lib/actions/appointments";
import { PrimaryButton } from "@/components/ui";

const initialState: ActionResult | null = null;

export function AppointmentForm({ offices }: { offices: { id: number; name: string; city: string }[] }) {
  const formRef = useRef<HTMLFormElement>(null);

  async function action(prev: ActionResult | null, formData: FormData) {
    const result = await requestAppointment(prev, formData);
    if (result.ok) formRef.current?.reset();
    return result;
  }

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <div>
        <label htmlFor="officeId" className="block text-sm font-medium text-slate-700">Bureau</label>
        <select id="officeId" name="officeId" required defaultValue="" className="mt-1 w-full rounded-control ring-1 ring-slate-300 px-3 py-2 text-sm">
          <option value="" disabled>Choisissez un bureau</option>
          {offices.map((o) => <option key={o.id} value={o.id}>{o.name} — {o.city}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-slate-700">Motif</label>
        <input id="reason" name="reason" required className="mt-1 w-full rounded-control ring-1 ring-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label htmlFor="requestedSlot" className="block text-sm font-medium text-slate-700">Date et heure souhaitées</label>
        <input id="requestedSlot" name="requestedSlot" type="datetime-local" required className="mt-1 w-full rounded-control ring-1 ring-slate-300 px-3 py-2 text-sm" />
      </div>
      {state && !state.ok && <p role="alert" className="text-sm text-rose-700">{state.error}</p>}
      {state && state.ok && <p role="status" className="text-sm text-ink-2">Demande envoyée.</p>}
      <PrimaryButton type="submit" disabled={pending} className="self-start">
        {pending ? "Envoi…" : "Demander un rendez-vous"}
      </PrimaryButton>
    </form>
  );
}
