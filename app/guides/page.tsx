import Link from "next/link";
import type { Metadata } from "next";
import { PublicPage } from "@/components/public-shell";
import { Hero, Tag, EmptyState } from "@/components/ui";
import { Icon } from "@/components/icon";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { and, eq, ilike, or } from "drizzle-orm";
import { ARTICLE_CATEGORY_LABELS, THEME_META } from "@/lib/constants";

export const metadata: Metadata = { title: "Guides pratiques — AIME®", description: "Des guides pas à pas pour vos démarches du quotidien." };

export const dynamic = "force-dynamic";

export default async function GuidesPage({ searchParams }: { searchParams: Promise<{ q?: string; categorie?: string }> }) {
  const { q, categorie } = await searchParams;

  const conditions = [eq(articles.isPublished, true)];
  if (categorie) conditions.push(eq(articles.category, categorie));
  if (q) conditions.push(or(ilike(articles.title, `%${q}%`), ilike(articles.summary, `%${q}%`), ilike(articles.content, `%${q}%`))!);

  const items = await db.select().from(articles).where(and(...conditions));

  return (
    <PublicPage>
      <Hero image="/images/hero-campagne.jpg" eyebrow="Ressources" title="Articles et guides pratiques" subtitle="Des réponses claires, rédigées pour accompagner vos démarches pas à pas.">
        <form className="mt-9 flex max-w-xl flex-col overflow-hidden rounded-lg bg-white shadow-xl sm:flex-row" role="search">
          <label htmlFor="q" className="sr-only">Rechercher un article</label>
          <div className="flex flex-1 items-center gap-2 px-4">
            <Icon name="search" className="h-5 w-5 text-slate-400" />
            <input id="q" name="q" type="search" defaultValue={q} placeholder="Arrêt de travail, retraite…" className="w-full py-4 text-base text-slate-900 outline-none" />
          </div>
          <label htmlFor="categorie" className="sr-only">Thématique</label>
          <select id="categorie" name="categorie" defaultValue={categorie || ""} className="border-t border-slate-200 px-4 py-4 text-sm text-slate-700 sm:border-l sm:border-t-0">
            <option value="">Toutes</option>
            {Object.entries(ARTICLE_CATEGORY_LABELS).map(([slug, label]) => (
              <option key={slug} value={slug}>{label}</option>
            ))}
          </select>
          <button type="submit" className="bg-emerald-800 px-6 py-4 text-base font-semibold text-white hover:bg-emerald-900">Rechercher</button>
        </form>
      </Hero>

      <div className="mx-auto max-w-6xl px-6 py-20">
        <p className="mb-8 text-sm text-slate-500" role="status">{items.length} résultat{items.length > 1 ? "s" : ""}</p>
        {items.length === 0 ? (
          <EmptyState title="Aucun résultat" description="Essayez un autre mot-clé ou changez de thématique." />
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((article) => (
              <li key={article.id}>
                <Link href={`/guides/${article.slug}`} className="group block h-full overflow-hidden rounded-2xl bg-[#fafaf9] transition hover:shadow-lg">
                  <div className="h-40 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={THEME_META[article.category]?.image ?? "/images/hero-campagne.jpg"} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  </div>
                  <div className="p-6">
                    <Tag>{ARTICLE_CATEGORY_LABELS[article.category] ?? article.category}</Tag>
                    <h2 className="mt-3 text-lg font-semibold text-[#1d1d1f]">{article.title}</h2>
                    <p className="mt-2 text-sm text-slate-600">{article.summary}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PublicPage>
  );
}
