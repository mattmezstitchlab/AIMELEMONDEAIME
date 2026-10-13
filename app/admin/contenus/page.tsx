import { db } from "@/db";
import type { Metadata } from "next";
import { articles } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Card, SectionTitle } from "@/components/ui";
import { ArticleForm, ArticleRow } from "../admin-forms";

export const metadata: Metadata = { title: "Contenus — Administration AIME®" };

export const dynamic = "force-dynamic";

export default async function ContenusPage() {
  const list = await db.select().from(articles).orderBy(desc(articles.publishedAt));
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle image="/images/hero-famille.jpg" eyebrow="Administration" title="Contenus publics" description="Rédigez, publiez ou retirez les articles et guides pratiques du site public." />
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Nouveau contenu</h2>
        <ArticleForm />
      </Card>
      <ul className="flex flex-col gap-3">
        {list.map((a) => <ArticleRow key={a.id} article={a} />)}
      </ul>
    </div>
  );
}
