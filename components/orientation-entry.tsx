"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { ArrowRight, MessageCircle, Search } from "lucide-react";
import { matchSituation } from "@/lib/orientation";

const QUICK = ["Je déménage", "Un proche est décédé", "J'organise un événement"];

/** Porte d'entrée commune : recherche explicable, sans IA générative ni traitement externe. */
export function OrientationEntry({ variant = "light" }: { variant?: "light" | "hero" }) {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const result = useMemo(() => matchSituation(query), [query]);
  const dark = variant === "hero";
  const show = (submitted || query.trim().length >= 5) && query.trim().length > 0;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  function openAssistant() {
    window.dispatchEvent(new CustomEvent("aime:assistant:open", { detail: { question: query.trim() } }));
  }

  return (
    <div data-assistant-id="orientation-entry" className={`rounded-2xl p-4 shadow-sm sm:p-5 ${dark ? "border border-white/20 bg-white/95 text-slate-900 backdrop-blur" : "border border-slate-200 bg-white text-slate-900"}`}>
      <p className="text-sm font-bold text-slate-900">Dites-nous ce que vous cherchez.</p>
      <p className="mt-1 text-xs text-slate-600">Une orientation par situations, pas un diagnostic ni une décision administrative.</p>
      <form role="search" onSubmit={onSubmit} className="mt-3 flex gap-2">
        <label htmlFor={`orientation-${variant}`} className="sr-only">Décrivez votre besoin en quelques mots</label>
        <span className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            id={`orientation-${variant}`}
            type="search"
            maxLength={120}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSubmitted(false); }}
            placeholder="Ex. je déménage, je prépare une fête…"
            aria-controls={`orientation-results-${variant}`}
            className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-slate-800"
          />
        </span>
        <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-bold text-white hover:bg-emerald-900">
          <span className="hidden sm:inline">Chercher</span><ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </form>
      <div id={`orientation-results-${variant}`}>
        {show && result.kind === "unknown" && (
          <div role="status" className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            Je n&apos;ai pas de parcours préparé pour cette demande. Je préfère ne pas inventer de réponse : <Link href="/informations" className="font-semibold underline">consultez les guides</Link> ou <Link href="/accompagnement" className="font-semibold underline">trouvez un interlocuteur humain</Link>.
          </div>
        )}
        {show && result.matches.length > 0 && (
          <div className="mt-3 space-y-2" role="status">
            <p className="text-xs font-semibold text-slate-600">{result.kind === "ambiguous" ? "Deux ou trois parcours pourraient vous convenir. Choisissez celui qui vous parle :" : "Ce parcours pourrait vous aider :"}</p>
            {result.matches.map((m) => (
              <div key={m.key} className="rounded-lg border border-slate-200 bg-[#fafaf9] p-3">
                <p className="text-sm font-bold text-slate-900">{m.label}</p>
                <p className="mt-1 text-xs text-slate-600">{m.explanation} {m.description}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold">
                  <Link href={`/espace/demarches/nouvelle?situation=${encodeURIComponent(m.key)}`} className="inline-flex items-center gap-1 rounded-lg bg-emerald-800 px-3 py-2 text-white hover:bg-emerald-900">Préparer dans Mon espace <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
                  <Link href={`/accompagnement?besoin=${encodeURIComponent(m.key)}`} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 hover:bg-slate-50">Comprendre avant de commencer</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] font-medium text-slate-500">Par exemple :</span>
        {QUICK.map((s) => <button key={s} type="button" onClick={() => { setQuery(s); setSubmitted(true); }} className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-slate-400">{s}</button>)}
      </div>
      <button type="button" onClick={openAssistant} className="mt-3 inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-950">
        <MessageCircle className="h-4 w-4" aria-hidden="true" />Demander à l&apos;assistant de navigation
      </button>
      <p className="mt-1 text-[11px] text-slate-500">Règles explicites, sans IA générative. N&apos;écrivez ni numéro de sécurité sociale ni information médicale.</p>
    </div>
  );
}
