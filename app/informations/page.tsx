import Link from "next/link";
import type { Metadata } from "next";
import { PublicPage } from "@/components/public-shell";
import { Container, Hero, SectionHeading } from "@/components/ui";
import { Icon } from "@/components/icon";
import { db, isDatabaseConfigured } from "@/db";
import { articles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ARTICLE_CATEGORY_LABELS, THEME_META } from "@/lib/constants";
import { InformClient } from "./inform-client";

export const metadata: Metadata = { title: "Informations par thématique — AIME®", description: "Santé, famille, logement, retraite, emploi : l’information classée par sujet de la vie quotidienne." };

export const dynamic = "force-dynamic";

/**
 * Porte unique « s’informer » : thématiques, recherche et lecture au même endroit.
 * `?vue=guides` ne montre que les guides pratiques (ancienne page /guides).
 * Le détail d’un guide reste sur /guides/[slug].
 */
export default async function InformationsHub({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const { vue } = await searchParams;
  const guidesOnly = vue === "guides";
  const rows = isDatabaseConfigured
    ? await db.select().from(articles).where(eq(articles.isPublished, true)).catch(() => [])
    : [];
  const visible = guidesOnly ? rows.filter((article) => article.kind === "guide") : rows;

  return (
    <PublicPage>
      <Hero
        size="md"
        eyebrow="Informations"
        title={guidesOnly ? "Guides pratiques" : "Tout ce qu’il faut savoir, au même endroit"}
        subtitle={guidesOnly
          ? "Les guides pas à pas, toutes thématiques confondues."
          : "Santé, famille, mariage, argent et difficultés, logement, retraite, cotisations, emploi : articles et guides pratiques, regroupés par thématique."}
      />

      <section className="bg-canvas">
        <Container className="pt-14 sm:pt-16">
          <SectionHeading eyebrow="Par thématique" title="Choisissez un sujet de vie." />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(THEME_META).map(([slug, meta]) => (
              <Link
                key={slug}
                href={`/informations/${slug}`}
                className="group flex items-start gap-4 rounded-card bg-muted p-6 transition hover:bg-canvas hover:shadow-hover hover:ring-1 hover:ring-line"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-canvas ring-1 ring-line">
                  <Icon name={meta.icon} className="h-5 w-5 text-ink" />
                </span>
                <span>
                  <span className="block text-base font-medium text-ink">{ARTICLE_CATEGORY_LABELS[slug]}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-3">{meta.desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <InformClient articles={visible} categories={ARTICLE_CATEGORY_LABELS} />
    </PublicPage>
  );
}
