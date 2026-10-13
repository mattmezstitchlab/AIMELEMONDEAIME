import Link from "next/link";
import { PublicPage } from "@/components/public-shell";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ARTICLE_CATEGORY_LABELS } from "@/lib/constants";
import { SInformClient } from "./s-informer-client";

export const dynamic = "force-dynamic";

export default async function SInformPage() {
  const rows = await db.select().from(articles).where(eq(articles.isPublished, true));
  return (
    <PublicPage>
      <section className="border-b border-black/[0.08] bg-[#F6F1E8]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">S&apos;informer</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-[-0.03em] text-[#1a1a1a] sm:text-5xl">
            Tout ce qu&apos;il faut savoir, au même endroit.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            Santé, famille, logement, retraite, cotisations, emploi : les articles et guides pratiques, regroupés par thématique.
          </p>
        </div>
      </section>
      <SInformClient articles={rows} categories={ARTICLE_CATEGORY_LABELS} />
    </PublicPage>
  );
}
