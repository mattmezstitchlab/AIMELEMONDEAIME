"use client";
import { useState } from "react";
import { buildProviderBrief } from "@/lib/wedding-portal";

export function ProviderBrief() {
  const [value, setValue] = useState({ service: "", date: "", city: "", persons: "", budget: "", details: "" });
  const [copied, setCopied] = useState(false);
  const text = buildProviderBrief(value);
  return <section id="demande" className="scroll-mt-24 rounded-card bg-subtle p-6 sm:p-10">
    <h2 className="text-3xl">Préparer ma demande.</h2>
    <p className="mt-4 text-sm leading-relaxed text-ink-3">Ce brouillon reste dans cette page : il n’est ni enregistré ni envoyé. Relisez-le, puis copiez-le dans votre échange avec le prestataire. Évitez les informations sensibles.</p>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {([["service", "Prestation recherchée", "text"], ["date", "Date souhaitée", "date"], ["city", "Commune", "text"], ["persons", "Nombre de participants", "text"], ["budget", "Budget indicatif", "text"]] as const).map(([key, label, type]) => <label key={key} className="text-sm font-semibold">{label}<input value={value[key]} type={type} maxLength={120} onChange={(e) => { setValue({ ...value, [key]: e.target.value }); setCopied(false); }} className="mt-2 min-h-11 w-full rounded-control bg-canvas p-3 ring-1 ring-line" /></label>)}
      <label className="text-sm font-semibold sm:col-span-2">Votre besoin<textarea rows={3} maxLength={800} value={value.details} onChange={(e) => { setValue({ ...value, details: e.target.value }); setCopied(false); }} className="mt-2 w-full rounded-control bg-canvas p-3 ring-1 ring-line" /></label>
    </div>
    <pre className="mt-6 whitespace-pre-wrap break-words rounded-control bg-canvas p-4 text-sm leading-relaxed">{text}</pre>
    <button disabled={!value.service.trim()} onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); } catch { setCopied(false); } }} className="mt-4 min-h-11 rounded-control bg-ink px-5 text-sm font-semibold text-canvas disabled:opacity-50">{copied ? "Demande copiée" : "Copier ma demande"}</button>
    <p role="status" className="mt-2 text-xs text-ink-3">{copied ? "Rien n’a été envoyé. Collez ce texte dans votre échange après relecture." : "Si la copie n’est pas disponible, sélectionnez le texte ci-dessus."}</p>
  </section>;
}
