"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { replyToMember } from "@/lib/actions/messages";
import { PrimaryButton } from "@/components/ui";

export function ReplyForm({ recipientId }: { recipientId: number }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await replyToMember(recipientId, value);
          if (res.ok) {
            setValue("");
            setError(null);
            router.refresh();
          } else setError(res.error);
        });
      }}
      className="flex flex-col gap-2 border-t border-line pt-3"
    >
      <label htmlFor={`reply-${recipientId}`} className="text-sm font-medium text-ink-2">Répondre</label>
      <textarea id={`reply-${recipientId}`} value={value} onChange={(e) => setValue(e.target.value)} rows={2} required className="rounded-control ring-1 ring-line px-3 py-2 text-sm" />
      {error && <p role="alert" className="text-sm text-ink-2">{error}</p>}
      <PrimaryButton type="submit" disabled={pending || !value.trim()} className="self-start">{pending ? "Envoi…" : "Envoyer"}</PrimaryButton>
    </form>
  );
}
