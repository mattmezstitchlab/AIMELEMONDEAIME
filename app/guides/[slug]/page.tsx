import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { PublicPage } from "@/components/public-shell";
import { Hero, LinkButton } from "@/components/ui";
import { Icon } from "@/components/icon";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ARTICLE_CATEGORY_LABELS, THEME_META } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [article] = await db.select({ title: articles.title, summary: articles.summary }).from(articles).where(eq(articles.slug, slug)).limit(1);
  if (!article) return { title: "Guide introuvable — AIME®" };
  return { title: `${article.title} — AIME®`, description: article.summary };
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [article] = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
  if (!article || !article.isPublished) notFound();

  return (
    <PublicPage>
      <Hero
        size="md"
        image={THEME_META[article.category]?.image ?? "/images/hero-campagne.jpg"}
        eyebrow={`${ARTICLE_CATEGORY_LABELS[article.category] ?? article.category} · ${article.kind === "guide" ? "Guide pratique" : "Article"}`}
        title={article.title}
        subtitle={article.summary}
      />
      <article className="mx-auto max-w-3xl px-6 py-20">
        <Link href="/informations?vue=guides" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline">
          <Icon name="arrow" className="h-4 w-4 rotate-180" /> Retour aux guides
        </Link>
        <p className="mt-6 text-sm font-medium text-slate-500">Public concerné : {article.audience}</p>
        <div className="mt-6 whitespace-pre-line text-xl leading-relaxed text-slate-700">{article.content}</div>
        <div className="mt-14 rounded-2xl bg-[#fafaf9] p-8">
          <h2 className="text-2xl font-bold text-[#1d1d1f]">Prêt à faire la démarche ?</h2>
          <p className="mt-2 text-slate-600">Connectez-vous à votre espace pour démarrer une démarche guidée.</p>
          <LinkButton href="/connexion" className="mt-5">Accéder à mon espace <Icon name="arrow" className="h-4 w-4" /></LinkButton>
        </div>
      </article>
    </PublicPage>
  );
}
