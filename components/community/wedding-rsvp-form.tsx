"use client";

import { useActionState } from "react";
import { submitWeddingRsvp } from "@/lib/actions/wedding-access";

export function WeddingRsvpForm({ token, status, persons }: { token: string; status: string; persons: number }) {
  const [state, formAction, pending] = useActionState(submitWeddingRsvp, { ok: true, message: "" });
  const initialStatus = ["confirme", "peut_etre", "decline"].includes(status) ? status : "";
  return (
    <form action={formAction} className="space-y-5 rounded-card ring-1 ring-line bg-white p-5 shadow-rested">
      <input type="hidden" name="token" value={token} />
      <fieldset>
        <legend className="text-sm font-bold text-slate-900">Votre réponse</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            ["confirme", "Oui, avec plaisir"],
            ["peut_etre", "Peut-être"],
            ["decline", "Je ne pourrai pas venir"],
          ].map(([value, text]) => (
            <label key={value} className="flex cursor-pointer items-start gap-2 rounded-card ring-1 ring-line p-3 text-sm text-slate-700 has-[:checked]:ring-ink has-[:checked]:bg-muted">
              <input type="radio" name="status" value={value} defaultChecked={initialStatus === value} required className="mt-0.5 accent-ink" />
              <span>{text}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="rsvp-persons" className="block text-sm font-semibold text-slate-700">Nombre de personnes dans votre foyer</label>
        <input id="rsvp-persons" name="persons" type="number" min={1} max={20} defaultValue={persons} required className="mt-1 w-full max-w-xs rounded-control ring-1 ring-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900" />
        <p className="mt-1 text-xs text-slate-500">Si vous déclinez, le nombre précédemment indiqué reste conservé pour le suivi des organisateurs.</p>
      </div>
      {state.message && <p role={state.ok ? "status" : "alert"} className={`rounded-control px-3 py-2 text-sm ${state.ok ? "bg-muted text-ink" : "bg-rose-50 text-rose-800"}`}>{state.message}</p>}
      <button type="submit" disabled={pending} className="rounded-control bg-ink px-4 py-2.5 text-sm font-bold text-white hover:bg-ink-2 disabled:opacity-50">{pending ? "Enregistrement…" : "Enregistrer ma réponse"}</button>
      <p className="text-xs text-slate-500">Vous pourrez revenir sur ce lien pour modifier votre réponse jusqu&apos;à son expiration. Il ne donne accès qu&apos;à votre foyer.</p>
    </form>
  );
}
