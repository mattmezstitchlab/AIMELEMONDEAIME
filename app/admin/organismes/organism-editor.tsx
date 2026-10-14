"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrganism } from "@/lib/actions/journeys";
import { PrimaryButton } from "@/components/ui";

const input = "mt-1 w-full rounded-lg ring-1 ring-slate-300 px-3 py-2 text-sm";
export function OrganismEditor({ o }: { o: { id: number; name: string; role: string; audience: string; territory: string; url: string; source: string } }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="mt-2 text-sm font-semibold text-ink underline">Modifier ou vérifier</button>;
  return (
    <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); f.set("id", String(o.id)); start(async () => { const r = await updateOrganism(f); setMsg(r.ok ? r.message : r.error); if (r.ok) router.refresh(); }); }} className="mt-3 grid gap-3 sm:grid-cols-2">
      {([["name", "Nom", o.name], ["audience", "Public", o.audience], ["territory", "Territoire", o.territory], ["url", "Lien officiel", o.url], ["source", "Source de vérification", o.source]] as const).map(([k, l, v]) => <div key={k}><label htmlFor={`${k}-${o.id}`} className="text-xs font-semibold text-slate-600">{l}</label><input id={`${k}-${o.id}`} name={k} defaultValue={v} className={input} /></div>)}
      <div className="sm:col-span-2"><label htmlFor={`role-${o.id}`} className="text-xs font-semibold text-slate-600">Rôle</label><textarea id={`role-${o.id}`} name="role" defaultValue={o.role} rows={2} className={input} /></div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="verify" className="h-4 w-4 accent-ink" />J&apos;ai vérifié ce contenu sur le site officiel aujourd&apos;hui</label>
      <div className="sm:col-span-2 flex items-center gap-3"><PrimaryButton type="submit" disabled={pending}>Enregistrer</PrimaryButton>{msg && <span role="status" className="text-sm text-slate-600">{msg}</span>}</div>
    </form>
  );
}
