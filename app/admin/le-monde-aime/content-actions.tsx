"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moderateContentReport } from "@/lib/actions/moderation";
import { PrimaryButton, SecondaryButton } from "@/components/ui";

export function ContentModerationActions({ reportId }: { reportId: number }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();
  const decide = (d: "masquer" | "maintenir") => start(async () => { const r = await moderateContentReport(reportId, d); setMessage(r.ok ? r.message : r.error); if (r.ok) router.refresh(); });
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <PrimaryButton type="button" disabled={pending} onClick={() => decide("masquer")} className="!px-3 !py-2 text-xs">Retirer de l&apos;affichage public</PrimaryButton>
      <SecondaryButton type="button" disabled={pending} onClick={() => decide("maintenir")} className="!px-3 !py-2 text-xs">Maintenir</SecondaryButton>
      {message && <p role="status" className="text-xs text-ink-3">{message}</p>}
    </div>
  );
}
