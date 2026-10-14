"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, MessageCircle, Search } from "lucide-react";

const QUICK = ["Je déménage", "Un proche est décédé", "J’organise un événement"];

/**
 * Porte d’entrée unique vers l’aide (chantier 4) : ce champ ne cherche plus
 * lui-même — il ouvre l’assistant de navigation avec la question pré-remplie.
 * Il n’existe donc qu’un seul moteur d’orientation à maintenir (celui de
 * l’assistant, règles explicites, aucun traitement externe).
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
    <div
      data-assistant-id="orientation-entry"
      className={`rounded-card p-5 sm:p-6 ${dark ? "bg-canvas/95 text-ink ring-1 ring-white/20" : "bg-canvas shadow-rested ring-1 ring-line"}`}
    >
      <p className="text-base font-medium text-ink">Dites-nous ce que vous cherchez.</p>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-3">
        L’assistant de navigation s’ouvre avec votre question et vous propose le bon parcours. Une orientation par situations, pas un
        diagnostic ni une décision administrative.
      </p>
      <form role="search" onSubmit={onSubmit} className="mt-4 flex gap-2">
        <label htmlFor={`orientation-${variant}`} className="sr-only">Décrivez votre besoin en quelques mots</label>
        <span className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" aria-hidden="true" />
          <input
            id={`orientation-${variant}`}
            type="search"
            maxLength={120}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex. je déménage, je prépare une fête…"
            className="h-11 w-full rounded-control bg-canvas pl-9 pr-3 text-sm text-ink ring-1 ring-line transition placeholder:text-ink-4 focus:ring-2 focus:ring-ink"
          />
        </span>
        <button
          type="submit"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-control bg-ink px-4 text-sm font-medium text-canvas shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition hover:bg-ink-2"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Demander</span>
          <ArrowRight className="h-4 w-4 sm:hidden" aria-hidden="true" />
        </button>
      </form>
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] text-ink-4">Par exemple :</span>
        {QUICK.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => { setQuery(s); openAssistant(s); }}
            className="rounded-full px-2.5 py-1 text-[11px] font-medium text-ink-2 ring-1 ring-line transition hover:bg-muted hover:text-ink"
          >
            {s}
          </button>
        ))}
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-ink-4">
        Règles explicites, sans IA générative ni envoi à un tiers. N’écrivez ni numéro de sécurité sociale ni information médicale.
      </p>
    </div>
  );
}
