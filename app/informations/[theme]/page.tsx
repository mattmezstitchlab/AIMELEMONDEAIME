import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicPage } from "@/components/public-shell";
import { CircuitLinks } from "@/components/marketing/tiles";
import { WEDDING_CIRCUITS, circuitFor } from "@/lib/circuits";
import { Container, EmptyState, Hero, LinkButton, SectionHeading, Tag } from "@/components/ui";
import { Icon } from "@/components/icon";
import { db, isDatabaseConfigured } from "@/db";
import { articles } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { ARTICLE_CATEGORY_LABELS, THEME_META } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ theme: string }> }): Promise<Metadata> {
  const { theme } = await params;
  const label = ARTICLE_CATEGORY_LABELS[theme];
  const meta = THEME_META[theme];
  if (!label || !meta) return { title: "Thématique introuvable — AIME®" };
  return { title: `${label} — Informations AIME®`, description: meta.tagline };
}

export default async function ThemePage({ params }: { params: Promise<{ theme: string }> }) {
  const { theme } = await params;
  const label = ARTICLE_CATEGORY_LABELS[theme];
  const meta = THEME_META[theme];
  if (!label || !meta) notFound();

  const items = isDatabaseConfigured
    ? await db.select().from(articles).where(and(eq(articles.category, theme), eq(articles.isPublished, true))).catch(() => [])
    : [];

  return (
    <PublicPage>
      <Hero
        size="md"
        eyebrow="Information par thématique"
        title={label}
        subtitle={meta.tagline}
        actions={
          <LinkButton href="/mon-espace" size="lg">
            Faire une démarche
            <Icon name="arrow" className="h-4 w-4" />
          </LinkButton>
        }
      />

      <section className="bg-canvas">
        <Container className="py-16 lg:py-20">
          <div className="flex items-center gap-4">
            <span className="grid h-11 w-11 place-items-center rounded-control bg-muted">
              <Icon name={meta.icon} className="h-5 w-5 text-ink" />
            </span>
            <SectionHeading title={`Articles et guides « ${label} »`} />
          </div>

          <div className="mt-10">
            {items.length === 0 ? (
              <EmptyState title="Aucun contenu publié pour le moment" description="Cette rubrique est enrichie régulièrement." />
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {items.map((article) => (
                  <Link
                    key={article.id}
                    href={`/guides/${article.slug}`}
                    className="group flex flex-col rounded-card bg-muted p-7 transition hover:bg-canvas hover:shadow-hover hover:ring-1 hover:ring-line"
                  >
                    <Tag>{article.kind === "guide" ? "Guide pratique" : "Article"}</Tag>
                    <h2 className="mt-4 text-xl leading-snug text-ink">{article.title}</h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-3">{article.summary}</p>
                    <p className="mt-5 flex items-center justify-between text-xs text-ink-4">
                      <span>Public : {article.audience}</span>
                      <Icon name="arrow" className="h-4 w-4 text-ink-2 transition group-hover:translate-x-1" />
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        {theme === "mariage" && (
          <div className="mt-12">
            <CircuitLinks
              title="Après le guide, les circuits."
              text="Ce que vous venez de lire se prépare ; les circuits, eux, trouvent les personnes : le repas, les retouches, les invités qui restent dormir, celles et ceux qui montent en voiture."
              items={WEDDING_CIRCUITS.map((item) => ({
                href: `/circuits/${item.key}`,
                label: circuitFor(item.key)?.label ?? item.key,
                why: item.why,
              }))}
            />
          </div>
        )}

        </Container>
      </section>
    </PublicPage>
  );
}
