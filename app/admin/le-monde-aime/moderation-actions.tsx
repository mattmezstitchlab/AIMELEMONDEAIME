"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moderateCommunityReport } from "@/lib/actions/community";
import { PrimaryButton, SecondaryButton } from "@/components/ui";

export function ModerationActions({ reportId }: { reportId: number }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();
  function decide(action: "masquer" | "maintenir") {
    start(async () => {
      const result = await moderateCommunityReport(reportId, action);
      setMessage(result.ok ? result.message : result.error);
      if (result.ok) router.refresh();
    });
  }
  return <div className="mt-4 flex flex-wrap items-center gap-2">
    <PrimaryButton type="button" disabled={pending} onClick={() => decide("masquer")} className="!px-3 !py-2 text-xs">{pending ? "Traitement…" : "Masquer l'annonce"}</PrimaryButton>
    <SecondaryButton type="button" disabled={pending} onClick={() => decide("maintenir")} className="!px-3 !py-2 text-xs">Maintenir l&apos;annonce</SecondaryButton>
    {message && <p role="status" className="text-xs text-slate-600">{message}</p>}
  </div>;
}
