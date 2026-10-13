import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getOfficeCases, getOfficeById } from "@/lib/queries";
import { Card, SectionTitle, StatusBadge, EmptyState, formatDate, daysSince } from "@/components/ui";
import { RemindButton } from "./dossiers/remind-button";

export const metadata: Metadata = { title: "Back-office — AIME®" };

export const dynamic = "force-dynamic";

export default async function BackOfficeDashboard() {
  const user = (await getCurrentUser())!;
  const officeId = user.role === "administrateur" ? null : user.officeId;
  const office = await getOfficeById(officeId);
  const allCases = await getOfficeCases(officeId);

  const toTriage = allCases.filter((c) => c.status === "envoyee");
  const mine = allCases.filter((c) => c.assignedCaseworkerId === user.id && (c.status === "en_cours" || c.status === "piece_manquante"));
  // File prioritaire : qui est bloqué, depuis quand. D'abord les membres
  // dont on attend une pièce, puis les dossiers à affecter, puis les
  // dossiers sans mouvement depuis 14 jours ou plus.
  const rank: Record<string, number> = { piece_manquante: 0, envoyee: 1, en_cours: 2 };
  const prioritaires = allCases
    .filter((c) => c.status === "piece_manquante" || c.status === "envoyee" || (c.status === "en_cours" && daysSince(c.updatedAt) >= 14))
    .map((c) => ({ ...c, attente: daysSince(c.updatedAt) }))
    .sort((a, b) => (rank[a.status] - rank[b.status]) || b.attente - a.attente)
    .slice(0, 8);

  const counts = {
    envoyee: allCases.filter((c) => c.status === "envoyee").length,
    en_cours: allCases.filter((c) => c.status === "en_cours").length,
    piece_manquante: allCases.filter((c) => c.status === "piece_manquante").length,
    terminee: allCases.filter((c) => c.status === "terminee").length,
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        eyebrow={office ? office.name : "Tous les bureaux"}
        title="Tableau de bord gestionnaire"
        description="Vue d'ensemble des dossiers de votre bureau et de vos dossiers en charge."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(counts).map(([status, count]) => (
          <Card key={status}>
            <p className="text-sm text-slate-500">
              {status === "envoyee" ? "À affecter" : status === "en_cours" ? "En cours" : status === "piece_manquante" ? "Pièce manquante" : "Terminés"}
            </p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{count}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">File prioritaire — qui est bloqué, depuis quand</h2>
          <Link href="/back-office/dossiers" className="text-sm font-semibold text-emerald-800 hover:underline">Tous les dossiers →</Link>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Dans l&apos;ordre : les membres dont vous attendez une pièce, les dossiers à affecter, puis les dossiers sans mouvement depuis 14 jours.
          L&apos;ancienneté se mesure depuis le dernier mouvement du dossier.
        </p>
        {prioritaires.length === 0 ? (
          <div className="mt-3"><EmptyState title="Aucun dossier bloqué" /></div>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {prioritaires.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:border-emerald-300">
                <span className="min-w-0 flex-1">
                  <Link href={`/back-office/dossiers/${c.id}`} className="font-semibold text-emerald-800 hover:underline">{c.reference}</Link>
                  <span className="text-slate-700"> — {c.memberName}</span>
                  <span className="block truncate text-xs text-slate-500">{c.title}</span>
                </span>
                <span className={`text-xs font-semibold ${c.attente >= 14 ? "text-red-700" : c.attente >= 7 ? "text-amber-700" : "text-slate-500"}`}>
                  sans mouvement depuis {c.attente} j
                </span>
                <StatusBadge status={c.status} />
                {c.status === "piece_manquante" && <RemindButton caseId={c.id} compact />}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Dossiers à affecter</h2>
            <Link href="/back-office/dossiers?statut=envoyee" className="text-sm font-semibold text-emerald-800 hover:underline">Voir tout →</Link>
          </div>
          {toTriage.length === 0 ? (
            <EmptyState title="Aucun dossier en attente" />
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {toTriage.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link href={`/back-office/dossiers/${c.id}`} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm hover:border-emerald-300">
                    <span>
                      <span className="font-semibold text-slate-900">{c.reference}</span> — {c.memberName}
                    </span>
                    <StatusBadge status={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Mes dossiers en cours</h2>
            <Link href="/back-office/dossiers" className="text-sm font-semibold text-emerald-800 hover:underline">Voir tout →</Link>
          </div>
          {mine.length === 0 ? (
            <EmptyState title="Aucun dossier affecté actuellement" />
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {mine.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link href={`/back-office/dossiers/${c.id}`} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm hover:border-emerald-300">
                    <span>
                      <span className="font-semibold text-slate-900">{c.reference}</span> — {c.memberName}
                      <span className="block text-xs text-slate-500">Mis à jour le {formatDate(c.updatedAt)}</span>
                    </span>
                    <StatusBadge status={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
