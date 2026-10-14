"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";

/*
 * La liste des démarches, avec sa recherche et ses filtres.
 *
 * Deux moteurs alimentent cette liste — les parcours guidés et les dossiers
 * suivis par l'équipe — et le membre, lui, n'en voit qu'une. La recherche
 * filtre par titre, référence ou mot du détail ; les filtres, par statut.
 */

export type DemarcheItem = {
  key: string;
  href: string;
  kicker: string;
  title: string;
  kind: string;
  status: string;
  detail: string;
  progress: number | null;
  updatedLabel: string;
  isDemo: boolean;
};

const STATUS_STYLE: Record<string, string> = {
  "Questionnaire à terminer": "bg-muted text-ink",
  "Brouillon à compléter": "bg-muted text-ink-2",
  "Pièce manquante à fournir": "bg-muted text-ink",
  "En cours": "bg-muted text-ink",
  "En cours d’instruction": "bg-muted text-ink",
  "Transmis à l’équipe": "bg-muted text-ink",
  "Terminée": "bg-muted text-ink",
};

const field =
  "mt-1 w-full rounded-control ring-1 ring-line bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-4";

export function DemarchesList({ items }: { items: DemarcheItem[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("toutes");

  const statuses = useMemo(() => Array.from(new Set(items.map((item) => item.status))).sort(), [items]);

  const filtered = useMemo(() => {
    const words = query.trim().toLowerCase();
    return items.filter((item) => {
      if (words && !`${item.title} ${item.kicker} ${item.detail} ${item.kind}`.toLowerCase().includes(words)) return false;
      if (status !== "toutes" && item.status !== status) return false;
      return true;
    });
  }, [items, query, status]);

  return (
    <div>
      <div className="rounded-card bg-subtle p-4 ring-1 ring-line-soft">
        <label className="block text-xs font-semibold text-ink-2" htmlFor="demarche-search">
          Rechercher une démarche
        </label>
        <input
          id="demarche-search"
          data-assistant-id="demarches-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Un titre, une référence, un mot…"
          className={field}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2" data-assistant-id="demarches-filters">
          <span className="text-xs font-semibold text-ink-2">Statut :</span>
          {["toutes", ...statuses].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              aria-pressed={status === value}
              className={`h-9 rounded-full px-3.5 text-xs font-semibold transition ${
                status === value ? "bg-ink text-canvas" : "bg-canvas text-ink-2 ring-1 ring-line hover:text-ink"
              }`}
            >
              {value === "toutes" ? "Toutes" : value}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-3">
          {filtered.length} démarche(s) affichée(s){status !== "toutes" ? ` · filtre « ${status} »` : ""}.
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-card bg-muted p-5 text-sm text-ink-2">
          Aucune démarche ne correspond à cette recherche. Effacez le texte ou choisissez « Toutes » pour revoir la liste.
        </p>
      ) : (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {filtered.map((item) => (
            <Link key={item.key} href={item.href}>
              <Card className="h-full transition hover:bg-subtle">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-ink px-2.5 py-1 font-bold text-canvas">{item.kind}</span>
                  <span className={`rounded-full px-2.5 py-1 font-bold ${STATUS_STYLE[item.status] ?? "bg-muted text-ink-2"}`}>{item.status}</span>
                  {item.isDemo && <span className="font-bold uppercase text-ink-3">exemple fictif</span>}
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-2">{item.kicker}</p>
                <p className="mt-1 text-lg font-bold text-ink">{item.title}</p>
                <p className="text-sm text-ink-3">{item.detail}</p>
                {item.progress !== null && (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-ink-2" style={{ width: `${item.progress}%` }} />
                  </div>
                )}
                <p className="mt-2 text-xs text-ink-4">Mis à jour le {item.updatedLabel}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
