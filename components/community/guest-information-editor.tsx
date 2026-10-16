"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveGuestInformation } from "@/lib/actions/wedding";
import { EMPTY_GUEST_INFORMATION, GUEST_INFORMATION_FIELDS, type GuestInformation } from "@/lib/wedding-portal";

export function GuestInformationEditor({ projectId, information, editable }: { projectId: number; information: GuestInformation | null; editable: boolean }) {
  const [value, setValue] = useState(information ?? EMPTY_GUEST_INFORMATION);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  return <form className="space-y-5" onSubmit={(e) => {
    e.preventDefault();
    start(async () => {
      try { const result = await saveGuestInformation(projectId, value); setMessage(result.ok ? result.message : result.error); if (result.ok) router.refresh(); }
      catch { setMessage("Enregistrement impossible. Vos modifications restent affichées ; réessayez."); }
    });
  }}>
    <p className="text-sm leading-relaxed text-ink-3">Seules les informations saisies ici seront partagées aux détenteurs d’un lien RSVP valide. Le programme interne, le budget, les notes et les autres invités restent privés. N’indiquez que des coordonnées que vous êtes autorisé à partager.</p>
    {GUEST_INFORMATION_FIELDS.map(([key, label]) => <div key={key}><label htmlFor={`guest-info-${key}`} className="block text-sm font-semibold">{label}</label><textarea id={`guest-info-${key}`} maxLength={1200} rows={3} disabled={!editable || pending} value={value[key]} onChange={(e) => setValue({ ...value, [key]: e.target.value })} className="mt-2 w-full rounded-control p-3 ring-1 ring-line" /></div>)}
    <label className="flex items-start gap-3 text-sm"><input type="checkbox" disabled={!editable || pending} checked={value.published} onChange={(e) => setValue({ ...value, published: e.target.checked })} className="mt-1" /><span>Partager ces informations avec les invités. En décochant puis enregistrant, elles ne seront plus affichées lors des prochaines consultations.</span></label>
    {editable && <button disabled={pending} className="min-h-11 rounded-control bg-ink px-5 text-sm font-semibold text-canvas disabled:opacity-50">{pending ? "Enregistrement…" : "Enregistrer ce choix de partage"}</button>}
    {message && <p role="status" className="text-sm">{message}</p>}
  </form>;
}
