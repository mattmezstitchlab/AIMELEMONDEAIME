"use client";

import { useActionState, useRef } from "react";
import { sendOfficeMessage, type ActionResult } from "@/lib/actions/messages";
import { PrimaryButton } from "@/components/ui";

const initialState: ActionResult | null = null;

export function OfficeMessageForm() {
  const formRef = useRef<HTMLFormElement>(null);

  async function action(prev: ActionResult | null, formData: FormData) {
    const result = await sendOfficeMessage(prev, formData);
    if (result.ok) formRef.current?.reset();
    return result;
  }

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2 border-t border-line pt-4">
      <label htmlFor="body" className="text-sm font-medium text-ink-2">Nouveau message</label>
      <textarea id="body" name="body" rows={3} required className="w-full rounded-control ring-1 ring-line px-3 py-2 text-sm focus:ring-ink" />
      {state && !state.ok && <p role="alert" className="text-sm text-ink-2">{state.error}</p>}
      <PrimaryButton type="submit" disabled={pending} className="self-start">
        {pending ? "Envoi…" : "Envoyer à l’équipe"}
      </PrimaryButton>
    </form>
  );
}
