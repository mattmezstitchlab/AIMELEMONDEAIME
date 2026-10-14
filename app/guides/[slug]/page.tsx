import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { PublicPage } from "@/components/public-shell";
import { Container, Hero, LinkButton, Tag } from "@/components/ui";
import { Icon } from "@/components/icon";
import { db, isDatabaseConfigured } from "@/db";
import { articles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ARTICLE_CATEGORY_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [article] = isDatabaseConfigured
    ? await db.select({ title: articles.title, summary: articles.summary }).from(articles).where(eq(articles.slug, slug)).limit(1).catch(() => [])
    : [];
  if (!article) return { title: "Guide introuvable — AIME®" };
  return { title: `${article.title} — AIME®`, description: article.summary };
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [article] = isDatabaseConfigured
    ? await db.select().from(articles).where(eq(articles.slug, slug)).limit(1).catch(() => [])
    : [];
  if (!article || !article.isPublished) notFound();

  return (
    <PublicPage>
      <Hero
        size="md"
        eyebrow={`${ARTICLE_CATEGORY_LABELS[article.category] ?? article.category} · ${article.kind === "guide" ? "Guide pratique" : "Article"}`}
        title={article.title}
        subtitle={article.summary}
      />

      <div className="bg-canvas">
        <Container className="py-14 sm:py-16">
          <article className="mx-auto max-w-3xl">
            <Link
              href="/informations?vue=guides"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-3 transition hover:text-ink"
            >
              <Icon name="arrow" className="h-4 w-4 rotate-180" />
              Retour aux guides
            </Link>

            <div className="mt-7 flex flex-wrap items-center gap-3 border-y border-line py-4">
              <Tag tone="outline">Public concerné : {article.audience}</Tag>
              <span className="text-xs text-ink-4">
                Publié le{" "}
                {new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(article.publishedAt)}
              </span>
            </div>

            <div className="mt-8 whitespace-pre-line text-lg leading-relaxed text-ink-2">{article.content}</div>

            <div className="mt-14 rounded-card bg-muted p-8">
              <h2 className="text-2xl text-ink">Prêt à faire la démarche ?</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-3">
                Connectez-vous à votre espace pour démarrer une démarche guidée, garder vos réponses privées et reprendre plus tard.
              </p>
              <LinkButton href="/connexion" className="mt-6">
                Accéder à mon espace
                <Icon name="arrow" className="h-4 w-4" />
              </LinkButton>
            </div>

            <p className="mt-6 text-xs leading-relaxed text-ink-4">
              Ces repères sont informatifs : vérifiez toujours les modalités auprès des organismes et de votre mairie. AIME® n’effectue
              aucune déclaration à votre place.
            </p>
          </article>
        </Container>
      </div>
    </PublicPage>
  );
}
