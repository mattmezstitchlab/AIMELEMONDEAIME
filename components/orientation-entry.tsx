"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, MessageCircle, Search } from "lucide-react";

const QUICK = ["Je déménage", "Un proche est décédé", "J'organise un événement"];

/**
 * Porte d'entrée unique vers l'aide (chantier 4) : ce champ ne cherche plus
 * lui-même — il ouvre l'assistant de navigation avec la question pré-remplie.
 * Il n'existe donc qu'un seul moteur d'orientation à maintenir (celui de
 * l'assistant, règles explicites, aucun traitement externe).
 */
export function OrientationEntry({ variant = "light" }: { variant?: "light" | "hero" }) {
  const [query, setQuery] = useState("");
  const dark = variant === "hero";

  function openAssistant(question: string) {
    window.dispatchEvent(new CustomEvent("aime:assistant:open", { detail: { question: question.trim() } }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    openAssistant(query);
  }

  return (
    <div data-assistant-id="orientation-entry" className={`rounded-2xl p-4 shadow-sm sm:p-5 ${dark ? "border border-white/20 bg-white/95 text-slate-900 backdrop-blur" : "border border-slate-200 bg-white text-slate-900"}`}>
      <p className="text-sm font-bold text-slate-900">Dites-nous ce que vous cherchez.</p>
      <p className="mt-1 text-xs text-slate-600">L&apos;assistant de navigation s&apos;ouvre avec votre question et vous propose le bon parcours. Une orientation par situations, pas un diagnostic ni une décision administrative.</p>
      <form role="search" onSubmit={onSubmit} className="mt-3 flex gap-2">
        <label htmlFor={`orientation-${variant}`} className="sr-only">Décrivez votre besoin en quelques mots</label>
        <span className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            id={`orientation-${variant}`}
            type="search"
            maxLength={120}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex. je déménage, je prépare une fête…"
            className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-slate-800"
          />
        </span>
        <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-bold text-white hover:bg-emerald-900">
          <MessageCircle className="h-5 w-5" aria-hidden="true" /><span className="hidden sm:inline">Demander</span><ArrowRight className="h-5 w-5 sm:hidden" aria-hidden="true" />
        </button>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] font-medium text-slate-500">Par exemple :</span>
        {QUICK.map((s) => <button key={s} type="button" onClick={() => { setQuery(s); openAssistant(s); }} className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-slate-400">{s}</button>)}
      </div>
      <p className="mt-3 text-[11px] text-slate-500">Règles explicites, sans IA générative ni envoi à un tiers. N&apos;écrivez ni numéro de sécurité sociale ni information médicale.</p>
    </div>
  );
}
