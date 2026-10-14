"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Icon } from "@/components/icon";

type Article = {
  id: number; slug: string; title: string; summary: string; content: string;
  category: string; audience: string; kind: string; publishedAt: Date; isPublished: boolean;
};

function norm(s: string) { return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }

/** Recherche, filtres et lecture : la partie interactive du hub « informations ». */
export function InformClient({ articles, categories }: {
  articles: Article[];
  categories: Record<string, string>;
}) {
  const params = useSearchParams();
  const anchor = params.get("theme");
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [theme, setTheme] = useState(anchor ?? "");
  const [audience, setAudience] = useState("");
  const [opened, setOpened] = useState<Article | null>(null);

  const filtered = useMemo(() => articles.filter((a) => {
    const kw = norm(query);
    if (kw && !norm(`${a.title} ${a.summary} ${a.content}`).includes(kw)) return false;
    if (theme && a.category !== theme) return false;
    if (audience && a.audience !== audience && a.audience !== "Tous les publics") return false;
    return true;
  }), [articles, query, theme, audience]);

  const themes = Object.keys(categories);
  const audiences = useMemo(() => Array.from(new Set(articles.map((a) => a.audience))), [articles]);
  const grouped = useMemo(() => themes
    .map((t) => ({ theme: t, items: filtered.filter((a) => a.category === t) }))
    .filter((g) => g.items.length > 0), [filtered, themes]);

  return (
    <main id="contenu-principal">
      <section className="sticky top-16 z-30 border-y border-line bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-3 sm:px-8">
          <label className="relative min-w-[220px] flex-1 sm:max-w-sm">
            <span className="sr-only">Rechercher un article</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un article…"
              className="h-10 w-full rounded-control bg-canvas pl-9 pr-3 text-sm text-ink ring-1 ring-line transition placeholder:text-ink-4 focus:ring-2 focus:ring-ink"
            />
          </label>
          <div className="no-scrollbar flex max-w-full gap-1.5 overflow-x-auto" role="group" aria-label="Thématiques">
            <button
              type="button"
              onClick={() => setTheme("")}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                !theme ? "bg-ink text-white" : "text-ink-2 ring-1 ring-line hover:bg-muted"
              }`}
            >
              Tout
            </button>
            {themes.map((t) => (
              <a
                key={t}
                href={`#theme-${t}`}
                onClick={() => setTheme(t)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                  theme === t ? "bg-ink text-white" : "text-ink-2 ring-1 ring-line hover:bg-muted"
                }`}
              >
                {categories[t]}
              </a>
            ))}
          </div>
          <label className="ml-auto">
            <span className="sr-only">Public concerné</span>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="h-10 rounded-control bg-canvas px-3 text-xs font-medium text-ink-2 ring-1 ring-line transition focus:ring-2 focus:ring-ink"
            >
              <option value="">Tous publics</option>
              {audiences.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        {grouped.length === 0 ? (
          <div className="rounded-card border border-dashed border-slate-300 bg-subtle p-12 text-center">
            <Search className="mx-auto h-7 w-7 text-ink-4" aria-hidden="true" />
            <p className="mt-4 text-base font-medium text-ink">Aucun article ne correspond</p>
            <p className="mt-1 text-sm text-ink-3">Essayez un autre mot-clé ou une autre thématique.</p>
          </div>
        ) : (
          grouped.map((g) => (
            <div key={g.theme} id={`theme-${g.theme}`} className="scroll-mt-32 border-t border-line py-12 first:border-t-0 first:pt-0">
              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">{categories[g.theme]}</p>
                  <h2 className="mt-2 text-3xl text-ink">{categories[g.theme]}</h2>
                </div>
                <span className="shrink-0 text-sm text-ink-4">{g.items.length} article{g.items.length > 1 ? "s" : ""}</span>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {g.items.map((a) => (
                  <article key={a.id} className="flex flex-col rounded-card bg-canvas p-6 shadow-rested ring-1 ring-line">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-ink-2">{a.audience}</span>
                      <span className="text-xs text-ink-4">{a.kind === "guide" ? "Guide" : "Article"}</span>
                    </div>
                    <h3 className="mt-3 text-xl leading-snug text-ink">{a.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-3">{a.summary}</p>
                    <button
                      type="button"
                      onClick={() => setOpened(a)}
                      className="mt-5 inline-flex items-center gap-1.5 self-start text-sm font-medium text-ink hover:underline hover:underline-offset-4"
                    >
                      Lire {a.kind === "guide" ? "le guide" : "l’article"}
                      <Icon name="arrow" className="h-4 w-4" />
                    </button>
                  </article>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {opened && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-night/60 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget) setOpened(null); }}
        >
          <article className="mx-auto my-6 w-full max-w-3xl rounded-panel bg-canvas p-7 sm:p-10" role="dialog" aria-modal="true" aria-labelledby="article-title">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-ink-2">{categories[opened.category] ?? opened.category}</span>
                <h2 id="article-title" className="mt-4 text-3xl text-ink">{opened.title}</h2>
                <p className="mt-2 text-sm text-ink-4">
                  {opened.audience} · {opened.kind === "guide" ? "Guide" : "Article"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpened(null)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-control text-ink-3 ring-1 ring-line transition hover:bg-muted hover:text-ink"
                aria-label="Fermer"
              >
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 whitespace-pre-line text-[15px] leading-7 text-ink-2">{opened.content}</div>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <Link href={`/informations/${opened.category}`} className="text-sm font-medium text-ink hover:underline hover:underline-offset-4">
                Plus d’articles sur ce thème
              </Link>
              <Link href="/le-monde-aime" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:underline hover:underline-offset-4">
                Explorer la carte
                <Icon name="external" className="h-3.5 w-3.5" />
              </Link>
            </div>
          </article>
        </div>
      )}
    </main>
  );
}
