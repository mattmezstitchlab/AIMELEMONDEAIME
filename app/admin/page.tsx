import { db } from "@/db";
import type { Metadata } from "next";
import { auditLogs, cases, users, offices, articles } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Card, SectionTitle, Stat, formatDateTime } from "@/components/ui";
import { Icon, type IconName } from "@/components/icon";
import { requireRolePage } from "@/lib/auth";

export const metadata: Metadata = { title: "Administration — AIME®" };

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireRolePage(["administrateur"]);
  const [allUsers, allCases, allOffices, allArticles] = await Promise.all([
    db.select({ id: users.id, role: users.role, fullName: users.fullName }).from(users),
    db.select({ id: cases.id, status: cases.status }).from(cases),
    db.select({ id: offices.id }).from(offices),
    db.select({ id: articles.id }).from(articles),
  ]);
  const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(40);
  const nameMap = new Map(allUsers.map((u) => [u.id, u.fullName]));

  const stats: { label: string; value: number; icon: IconName }[] = [
    { label: "Adhérents", value: allUsers.filter((u) => u.role === "membre").length, icon: "users" },
    { label: "Gestionnaires", value: allUsers.filter((u) => u.role === "gestionnaire").length, icon: "user" },
    { label: "Dossiers", value: allCases.length, icon: "dossiers" },
    { label: "Bureaux", value: allOffices.length, icon: "building" },
    { label: "Contenus", value: allArticles.length, icon: "news" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle eyebrow="Administration" title="Pilotage de la plateforme" description="Rôles, bureaux, contenus publics et journal d’audit." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((s) => (
          <Stat key={s.label} label={s.label} value={s.value} icon={s.icon} />
        ))}
      </div>
      <Card>
        <h2 className="flex items-center gap-2 text-lg text-ink"><Icon name="shield" className="h-4 w-4 text-ink-3" /> Journal d&apos;audit</h2>
        <div className="mt-4 overflow-x-auto">
          <table data-assistant-id="admin-audit" className="w-full text-left text-sm">
            <caption className="sr-only">Dernières actions enregistrées</caption>
            <thead className="border-b border-line text-[11px] uppercase tracking-[0.1em] text-ink-4">
              <tr>
                <th scope="col" className="py-2 pr-4">Date</th>
                <th scope="col" className="py-2 pr-4">Acteur</th>
                <th scope="col" className="py-2 pr-4">Action</th>
                <th scope="col" className="py-2">Objet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {logs.map((l) => (
                <tr key={l.id} className="transition hover:bg-subtle">
                  <td className="whitespace-nowrap py-2.5 pr-4 text-ink-4">{formatDateTime(l.createdAt)}</td>
                  <td className="py-2.5 pr-4 text-ink-2">{l.actorId ? nameMap.get(l.actorId) ?? `#${l.actorId}` : "Système"}</td>
                  <td className="py-2.5 pr-4 font-medium text-ink">{l.action.replace(/_/g, " ")}</td>
                  <td className="py-2.5 text-ink-3">{l.entityType}{l.entityId ? ` #${l.entityId}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
