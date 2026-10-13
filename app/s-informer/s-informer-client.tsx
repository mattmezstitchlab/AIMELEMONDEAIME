"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { Icon } from "@/components/icon";

type Article = {
  id: number; slug: string; title: string; summary: string; content: string;
  category: string; audience: string; kind: string; publishedAt: Date; isPublished: boolean;
};

function norm(s: string) { return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }

export function SInformClient({ articles, categories }: {
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
      <section className="sticky top-[65px] z-30 border-b border-black/[0.06] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-3">
          <label className="relative min-w-[220px] flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <span className="sr-only">Rechercher un article</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un article…"
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-800"
            />
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Thématiques">
            <button type="button" onClick={() => setTheme("")} className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${!theme ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700 hover:border-slate-500"}`}>Tout</button>
            {themes.map((t) => (
              <a key={t} href={`#theme-${t}`} onClick={() => setTheme(t)} className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${theme === t ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700 hover:border-slate-500"}`}>{categories[t]}</a>
            ))}
          </div>
          <select value={audience} onChange={(e) => setAudience(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700" aria-label="Public concerné">
          <option value="">Tous publics</option>
          {audiences.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        {grouped.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-[#faf8f4] p-12 text-center">
            <Search className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
            <p className="mt-3 text-lg font-semibold text-slate-900">Aucun article ne correspond</p>
            <p className="mt-1 text-sm text-slate-600">Essayez un autre mot-clé ou une autre thématique.</p>
          </div>
        ) : (
          grouped.map((g) => (
            <div key={g.theme} id={`theme-${g.theme}`} className="scroll-mt-28 border-t border-black/[0.08] py-12 first:border-t-0 first:pt-0">
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">{categories[g.theme]}</p>
                  <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-[#1a1a1a]">{categories[g.theme]}</h2>
                </div>
                <span className="text-sm text-slate-500">{g.items.length} article{g.items.length > 1 ? "s" : ""}</span>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {g.items.map((a) => (
                  <article key={a.id} className="flex flex-col rounded-xl border border-black/[0.08] bg-white p-6">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <span className="rounded-full bg-[#f6f1e8] px-2.5 py-1 text-slate-700">{a.audience}</span>
                      <span><span>{a.kind === "guide" ? "Guide" : "Article"}</span></span>
                    </div>
                    <h3 className="mt-3 text-xl font-bold leading-snug text-[#1a1a1a]">{a.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-slate-600">{a.summary}</p>
                    <button type="button" onClick={() => setOpened(a)} className="mt-4 inline-flex items-center gap-1 self-start text-sm font-bold text-emerald-800 hover:underline">
                      Lire le guide <ArrowUpRight size={14} />
                    </button>
                  </article>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {opened && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setOpened(null); }}>
          <article className="mx-auto my-4 w-full max-w-3xl rounded-xl bg-white p-8 sm:p-10" role="dialog" aria-modal="true" aria-labelledby="article-title">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="rounded-full bg-[#f6f1e8] px-2.5 py-1 text-xs font-semibold text-slate-700">{categories[opened.category] ?? opened.category}</span>
                <h2 id="article-title" className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[#1a1a1a]">{opened.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{opened.audience} · <span>{opened.kind === "guide" ? "Guide" : "Article"}</span></p>
              </div>
              <button type="button" onClick={() => setOpened(null)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label="Fermer"><XIcon /></button>
            </div>
            <div className="mt-6 whitespace-pre-line leading-7 text-[15px] text-slate-700">{opened.content}</div>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <Link href={`/informations/${opened.category}`} className="text-sm font-bold text-emerald-800 hover:underline">Plus d&apos;articles sur ce thème</Link>
              <Link href="/le-monde-aime" className="text-sm font-bold text-slate-900 hover:underline">Explorer la carte <ArrowUpRight size={13} className="inline" /></Link>
            </div>
          </article>
        </div>
      )}
    </main>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}
