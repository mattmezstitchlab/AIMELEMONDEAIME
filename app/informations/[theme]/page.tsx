import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPage } from "@/components/public-shell";
import { Hero, Tag, EmptyState, LinkButton } from "@/components/ui";
import { Icon } from "@/components/icon";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { ARTICLE_CATEGORY_LABELS, THEME_META } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ThemePage({ params }: { params: Promise<{ theme: string }> }) {
  const { theme } = await params;
  const label = ARTICLE_CATEGORY_LABELS[theme];
  const meta = THEME_META[theme];
  if (!label || !meta) notFound();

  const items = await db.select().from(articles).where(and(eq(articles.category, theme), eq(articles.isPublished, true)));

  return (
    <PublicPage>
      <Hero
        image={meta.image}
        eyebrow="Information par thématique"
        title={label}
        subtitle={meta.tagline}
        actions={<LinkButton href="/connexion">Faire une démarche <Icon name="arrow" className="h-4 w-4" /></LinkButton>}
      />
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 flex items-center gap-4">
            <Icon name={meta.icon} className="h-12 w-12 text-emerald-500" />
            <h2 className="text-3xl font-bold text-[#1d1d1f]">Articles &amp; guides « {label} »</h2>
          </div>
          {items.length === 0 ? (
            <EmptyState title="Aucun contenu publié pour le moment" description="Cette rubrique est enrichie régulièrement." />
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {items.map((article) => (
                <Link key={article.id} href={`/guides/${article.slug}`} className="group rounded-2xl bg-[#fafaf9] p-8 transition hover:bg-emerald-50">
                  <Tag>{article.kind === "guide" ? "Guide pratique" : "Article"}</Tag>
                  <h3 className="mt-4 text-xl font-semibold text-[#1d1d1f]">{article.title}</h3>
                  <p className="mt-2 text-slate-600">{article.summary}</p>
                  <p className="mt-5 flex items-center justify-between text-sm text-slate-500">
                    <span>Public : {article.audience}</span>
                    <Icon name="arrow" className="h-4 w-4 text-emerald-700 transition group-hover:translate-x-1" />
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicPage>
  );
}
