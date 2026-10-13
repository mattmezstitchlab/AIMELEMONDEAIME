import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getOfficeCases } from "@/lib/queries";
import { Card, SectionTitle, StatusBadge, EmptyState, formatDate, daysSince } from "@/components/ui";
import { CASE_STATUS_LABELS } from "@/lib/constants";
import { RemindButton } from "./remind-button";

export const metadata: Metadata = { title: "Dossiers — Back-office AIME®" };

export const dynamic = "force-dynamic";

export default async function DossiersPage({ searchParams }: { searchParams: Promise<{ statut?: string; affectation?: string; q?: string }> }) {
  const user = (await getCurrentUser())!;
  const { statut, affectation, q } = await searchParams;
  const officeId = user.role === "administrateur" ? null : user.officeId;

  let items = await getOfficeCases(officeId, { status: statut });
  if (affectation === "moi") {
    items = items.filter((c) => c.assignedCaseworkerId === user.id);
  } else if (affectation === "non_affectes") {
    items = items.filter((c) => !c.assignedCaseworkerId);
  }
  const search = (q ?? "").trim().toLowerCase();
  if (search) {
    items = items.filter((c) =>
      [c.reference, c.title, c.memberName ?? ""].join(" ").toLowerCase().includes(search)
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle eyebrow="Back-office" title="Dossiers" description="Filtrez, affectez, inspectez et traitez les dossiers de votre bureau." />

      <Card>
        <form className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="q" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Recherche</label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q ?? ""}
              data-assistant-id="backoffice-search"
              placeholder="Référence, titre ou adhérent"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="statut" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Statut</label>
            <select id="statut" name="statut" data-assistant-id="backoffice-filters" defaultValue={statut || ""} className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Tous les statuts</option>
              {Object.entries(CASE_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="affectation" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Affectation</label>
            <select id="affectation" name="affectation" defaultValue={affectation || ""} className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Tous</option>
              <option value="moi">Mes dossiers</option>
              <option value="non_affectes">Non affectés</option>
            </select>
          </div>
          <button type="submit" className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900">Filtrer</button>
        </form>
      </Card>

      {items.length === 0 ? (
        <EmptyState title="Aucun dossier ne correspond aux filtres" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table data-assistant-id="backoffice-table" className="w-full text-left text-sm">
            <caption className="sr-only">Liste des dossiers</caption>
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3">Référence</th>
                <th scope="col" className="px-4 py-3">Adhérent</th>
                <th scope="col" className="px-4 py-3">Démarche</th>
                <th scope="col" className="px-4 py-3">Mis à jour</th>
                <th scope="col" className="px-4 py-3">Attente</th>
                <th scope="col" className="px-4 py-3">Statut</th>
                <th scope="col" className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((c) => (
                <tr key={c.id} className="hover:bg-emerald-50/40">
                  <td className="px-4 py-3">
                    <Link href={`/back-office/dossiers/${c.id}`} className="font-semibold text-emerald-800 hover:underline">{c.reference}</Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{c.memberName}</td>
                  <td className="px-4 py-3 text-slate-700">{c.title}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(c.updatedAt)}</td>
                  <td className="px-4 py-3">
                    {c.status === "terminee" || c.status === "brouillon" ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      <span className={`text-xs font-semibold ${daysSince(c.updatedAt) >= 14 ? "text-red-700" : daysSince(c.updatedAt) >= 7 ? "text-amber-700" : "text-slate-500"}`}>
                        {daysSince(c.updatedAt)} j sans mouvement
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">{c.status === "piece_manquante" ? <RemindButton caseId={c.id} compact /> : <span className="text-slate-400">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
