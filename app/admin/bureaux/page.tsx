import { db } from "@/db";
import type { Metadata } from "next";
import { offices } from "@/db/schema";
import { asc } from "drizzle-orm";
import { Card, SectionTitle } from "@/components/ui";
import { OfficeForm, OfficeCard } from "../admin-forms";

export const metadata: Metadata = { title: "Bureaux — Administration AIME®" };

export const dynamic = "force-dynamic";

export default async function BureauxPage() {
  const list = await db.select().from(offices).orderBy(asc(offices.name));
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle eyebrow="Administration" title="Bureaux locaux" description="Gérez l'annuaire public et le périmètre d'accès des gestionnaires." />
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Ajouter un bureau</h2>
        <OfficeForm />
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((o) => <OfficeCard key={o.id} office={o} />)}
      </div>
    </div>
  );
}
