"use client";

import type { GuestReplyDetails } from "@/lib/wedding-portal";
import { useActionState } from "react";
import { submitWeddingRsvp } from "@/lib/actions/wedding-access";

export function WeddingRsvpForm({ token, status, persons, details }: { token: string; status: string; persons: number; details?: GuestReplyDetails | null }) {
  const [state, formAction, pending] = useActionState(submitWeddingRsvp, { ok: true, message: "" });
  const initialStatus = ["confirme", "peut_etre", "decline"].includes(status) ? status : "";
  return (
    <form action={formAction} className="space-y-5 rounded-card ring-1 ring-line bg-canvas p-5 shadow-rested">
      <input type="hidden" name="token" value={token} />
      <fieldset>
        <legend className="text-sm font-bold text-ink">Votre réponse</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            ["confirme", "Oui, avec plaisir"],
            ["peut_etre", "Peut-être"],
            ["decline", "Je ne pourrai pas venir"],
          ].map(([value, text]) => (
            <label key={value} className="flex cursor-pointer items-start gap-2 rounded-card ring-1 ring-line p-3 text-sm text-ink-2 has-[:checked]:ring-ink has-[:checked]:bg-muted">
              <input type="radio" name="status" value={value} defaultChecked={initialStatus === value} required className="mt-0.5 accent-ink" />
              <span>{text}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="rsvp-persons" className="block text-sm font-semibold text-ink-2">Nombre de personnes dans votre foyer</label>
        <input id="rsvp-persons" name="persons" type="number" min={1} max={20} defaultValue={persons} required className="mt-1 w-full max-w-xs rounded-control ring-1 ring-line bg-canvas px-3 py-2.5 text-sm text-ink" />
        <p className="mt-1 text-xs text-ink-3">Si vous déclinez, le nombre précédemment indiqué reste conservé pour le suivi des organisateurs.</p>
      </div>
      <details className="rounded-control p-4 ring-1 ring-line">
        <summary className="cursor-pointer text-sm font-semibold">Préciser les participants et les moments de présence (facultatif)</summary>
        <p className="mt-3 text-xs leading-relaxed text-ink-3">Les organisateurs verront ces précisions. Pour les retirer, décochez « Enregistrer ces précisions » puis enregistrez votre réponse. Ne cochez que les moments auxquels vous avez été invité ; cela ne crée pas une invitation supplémentaire.</p>
        <label className="mt-4 flex gap-2 text-sm"><input type="checkbox" name="detailed" value="1" defaultChecked={!!details} />Enregistrer ces précisions avec ma réponse</label>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="text-sm">Adultes<input type="number" name="adults" min={0} max={20} defaultValue={details?.adults ?? persons} className="mt-1 w-full rounded-control p-2 ring-1 ring-line" /></label>
          <label className="text-sm">Enfants<input type="number" name="children" min={0} max={20} defaultValue={details?.children ?? 0} className="mt-1 w-full rounded-control p-2 ring-1 ring-line" /></label>
        </div>
        <fieldset className="mt-4 space-y-3"><legend className="mb-2 text-sm font-semibold">Présence prévue</legend>
          {([["ceremony", "Cérémonie"], ["meal", "Repas"], ["nextDay", "Lendemain"]] as const).map(([key, label]) => <label key={key} className="flex gap-2 text-sm"><input type="checkbox" name={key} defaultChecked={details?.[key] ?? false} />{label}</label>)}
        </fieldset>
      </details>
      {state.message && <p role={state.ok ? "status" : "alert"} className={`rounded-control px-3 py-2 text-sm ${state.ok ? "bg-muted text-ink" : "bg-muted text-ink"}`}>{state.message}</p>}
      <button type="submit" disabled={pending} className="rounded-control bg-ink px-4 py-2.5 text-sm font-bold text-canvas hover:bg-ink-2 disabled:opacity-50">{pending ? "Enregistrement…" : "Enregistrer ma réponse"}</button>
      <p className="text-xs text-ink-3">Vous pourrez revenir sur ce lien pour modifier votre réponse jusqu&apos;à son expiration. Il ne donne accès qu&apos;à votre foyer.</p>
    </form>
  );
}
