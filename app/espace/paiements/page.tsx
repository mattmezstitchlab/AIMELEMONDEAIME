import { requireRolePage } from "@/lib/auth";
import type { Metadata } from "next";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { and, desc, eq, ilike } from "drizzle-orm";
import { Card, SectionTitle, EmptyState, formatDate, formatAmount, Tag } from "@/components/ui";
import { PAYMENT_TYPE_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "Mes paiements — AIME®" };

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  verse: "Versé",
  preleve: "Prélevé",
  en_attente: "En attente",
  rejete: "Rejeté",
};

export default async function PaiementsPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const user = await requireRolePage(["membre"]);
  const { q, type } = await searchParams;

  const conditions = [eq(payments.memberId, user.id)];
  if (type) conditions.push(eq(payments.type, type));
  if (q) conditions.push(ilike(payments.label, `%${q}%`));

  const items = await db.select().from(payments).where(and(...conditions)).orderBy(desc(payments.date));

  const total = items.reduce((sum, p) => sum + Number(p.amount) * (p.type === "cotisation" ? -1 : 1), 0);

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle eyebrow="Paiements" title="Mes paiements" description="Historique fictif de vos prestations, remboursements et cotisations." />

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Solde net (prestations + remboursements − cotisations)</p>
          <p className="text-2xl font-bold text-slate-900">{formatAmount(total)}</p>
        </div>
        <form className="flex flex-wrap gap-2" role="search">
          <label htmlFor="q" className="sr-only">Rechercher un paiement</label>
          <input id="q" name="q" defaultValue={q} data-assistant-id="payments-search" placeholder="Rechercher un libellé" className="rounded-control ring-1 ring-slate-300 px-3 py-2 text-sm" />
          <select name="type" defaultValue={type || ""} className="rounded-control ring-1 ring-slate-300 px-3 py-2 text-sm">
            <option value="">Tous types</option>
            {Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button type="submit" className="rounded-control bg-ink px-4 py-2 text-sm font-semibold text-canvas hover:bg-ink-2">Filtrer</button>
        </form>
      </Card>

      {items.length === 0 ? (
        <EmptyState title="Aucun paiement trouvé" />
      ) : (
        <div className="overflow-hidden rounded-card ring-1 ring-line bg-canvas">
          <table data-assistant-id="payments-table" className="w-full text-left text-sm">
            <caption className="sr-only">Historique de mes paiements</caption>
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3">Date</th>
                <th scope="col" className="px-4 py-3">Libellé</th>
                <th scope="col" className="px-4 py-3">Type</th>
                <th scope="col" className="px-4 py-3">Référence</th>
                <th scope="col" className="px-4 py-3">Statut</th>
                <th scope="col" className="px-4 py-3 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-slate-700">{formatDate(p.date)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{p.label}</td>
                  <td className="px-4 py-3"><Tag>{PAYMENT_TYPE_LABELS[p.type] ?? p.type}</Tag></td>
                  <td className="px-4 py-3 text-slate-500">{p.reference}</td>
                  <td className="px-4 py-3 text-slate-700">{STATUS_LABELS[p.status] ?? p.status}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {p.type === "cotisation" ? "− " : ""}{formatAmount(p.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-slate-500">Données fictives à but de démonstration — aucun paiement réel n&apos;est effectué.</p>
    </div>
  );
}
