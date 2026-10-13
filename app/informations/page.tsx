import Link from "next/link";
import type { Metadata } from "next";
import { PublicPage } from "@/components/public-shell";
import { Hero } from "@/components/ui";
import { Icon } from "@/components/icon";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ARTICLE_CATEGORY_LABELS, THEME_META } from "@/lib/constants";
import { InformClient } from "./inform-client";

export const metadata: Metadata = { title: "Informations par thématique — AIME®", description: "Santé, famille, logement, retraite, emploi : l'information classée par sujet de la vie quotidienne." };

export const dynamic = "force-dynamic";

/**
 * Porte unique « s'informer » : thématiques, recherche et lecture au même endroit.
 * `?vue=guides` ne montre que les guides pratiques (ancienne page /guides).
 * Le détail d'un guide reste sur /guides/[slug].
 */
export default async function InformationsHub({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const { vue } = await searchParams;
  const guidesOnly = vue === "guides";
  const rows = await db.select().from(articles).where(eq(articles.isPublished, true));
  const visible = guidesOnly ? rows.filter((a) => a.kind === "guide") : rows;

  return (
    <PublicPage>
      <Hero
        size="md"
        image="/images/hero-campagne.jpg"
        eyebrow="Informations"
        title={guidesOnly ? "Guides pratiques" : "Tout ce qu'il faut savoir, au même endroit"}
        subtitle={guidesOnly
          ? "Les guides pas à pas, toutes thématiques confondues."
          : "Santé, famille, logement, retraite, cotisations, emploi : articles et guides pratiques, regroupés par thématique."}
      />
      <div className="mx-auto grid max-w-6xl gap-5 px-6 pt-16 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(THEME_META).map(([slug, meta]) => (
          <Link key={slug} href={`/informations/${slug}`} className="flex items-center gap-4 rounded-2xl bg-[#fafaf9] p-7 transition hover:bg-emerald-50">
            <Icon name={meta.icon} className="h-10 w-10 text-emerald-500" />
            <span>
              <span className="block text-lg font-semibold text-[#1d1d1f]">{ARTICLE_CATEGORY_LABELS[slug]}</span>
              <span className="text-sm text-slate-600">{meta.desc}</span>
            </span>
          </Link>
        ))}
      </div>
      <InformClient articles={visible} categories={ARTICLE_CATEGORY_LABELS} />
    </PublicPage>
  );
}
