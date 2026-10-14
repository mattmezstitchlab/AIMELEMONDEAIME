"use client";

import { useMemo, useState, type ReactNode } from "react";

/*
 * La liste des documents personnels, avec sa recherche.
 *
 * La carte de chaque document est rendue par la page (téléchargement, partage,
 * suppression) : ce composant ne fait qu'une chose, la filtrer.
 */

export type DocumentEntry = {
  id: number;
  filename: string;
  category: string;
  node: ReactNode;
};

export function DocumentsList({ items }: { items: DocumentEntry[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const words = query.trim().toLowerCase();
    if (!words) return items;
    return items.filter((item) => `${item.filename} ${item.category}`.toLowerCase().includes(words));
  }, [items, query]);

  return (
    <div>
      <div className="mt-3 rounded-card bg-subtle p-4 ring-1 ring-line-soft">
        <label className="block text-xs font-semibold text-ink-2" htmlFor="document-search">
          Rechercher un document
        </label>
        <input
          id="document-search"
          data-assistant-id="documents-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Un nom de fichier, une catégorie…"
          className="mt-1 w-full rounded-control ring-1 ring-line bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-4"
        />
        <p className="mt-2 text-xs text-ink-3">{filtered.length} document(s) affiché(s).</p>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-4 rounded-card bg-muted p-4 text-sm text-ink-2">
          Aucun document ne porte ce nom. Effacez la recherche pour revoir la liste complète.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {filtered.map((item) => (
            <div key={item.id}>{item.node}</div>
          ))}
        </div>
      )}
    </div>
  );
}
