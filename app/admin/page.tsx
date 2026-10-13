import { db } from "@/db";
import type { Metadata } from "next";
import { auditLogs, cases, users, offices, articles } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Card, SectionTitle, formatDateTime } from "@/components/ui";
import { Icon, type IconName } from "@/components/icon";

export const metadata: Metadata = { title: "Administration — AIME®" };

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
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
      <SectionTitle eyebrow="Administration" title="Pilotage de la plateforme" description="Rôles, bureaux, contenus publics et journal d'audit." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label} className="flex flex-col items-start">
            <Icon name={s.icon} className="h-8 w-8 text-emerald-500" />
            <p className="mt-3 text-3xl font-bold text-[#1d1d1f]">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </Card>
        ))}
      </div>
      <Card>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><Icon name="shield" className="h-5 w-5 text-emerald-500" /> Journal d&apos;audit</h2>
        <div className="mt-4 overflow-x-auto">
          <table data-assistant-id="admin-audit" className="w-full text-left text-sm">
            <caption className="sr-only">Dernières actions enregistrées</caption>
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="py-2 pr-4">Date</th>
                <th scope="col" className="py-2 pr-4">Acteur</th>
                <th scope="col" className="py-2 pr-4">Action</th>
                <th scope="col" className="py-2">Objet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap py-2 pr-4 text-slate-500">{formatDateTime(l.createdAt)}</td>
                  <td className="py-2 pr-4 text-slate-800">{l.actorId ? nameMap.get(l.actorId) ?? `#${l.actorId}` : "Système"}</td>
                  <td className="py-2 pr-4 font-medium text-slate-900">{l.action.replace(/_/g, " ")}</td>
                  <td className="py-2 text-slate-600">{l.entityType}{l.entityId ? ` #${l.entityId}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
