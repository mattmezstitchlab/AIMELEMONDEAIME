import { db } from "@/db";
import type { Metadata } from "next";
import { users, offices } from "@/db/schema";
import { asc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { Card, SectionTitle } from "@/components/ui";
import { CreateStaffForm, UserRow } from "../admin-forms";

export const metadata: Metadata = { title: "Utilisateurs — Administration AIME®" };

export const dynamic = "force-dynamic";

export default async function UtilisateursPage() {
  const me = (await getCurrentUser())!;
  const list = await db
    .select({ id: users.id, fullName: users.fullName, email: users.email, role: users.role, officeId: users.officeId, isActive: users.isActive })
    .from(users)
    .orderBy(asc(users.role), asc(users.fullName));
  const officeList = await db.select({ id: offices.id, name: offices.name }).from(offices);

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle eyebrow="Administration" title="Utilisateurs et rôles" description="Attribuez les rôles et les bureaux autorisés. Les gestionnaires ne voient que les dossiers de leur bureau." />
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Créer un compte agent</h2>
        <CreateStaffForm offices={officeList} />
      </Card>
      <div className="overflow-x-auto rounded-2xl border border-black/[0.06] bg-white shadow-sm">
        <table data-assistant-id="admin-users-table" className="w-full text-left text-sm">
          <caption className="sr-only">Liste des utilisateurs</caption>
          <thead className="bg-[#fafaf9] text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3">Utilisateur</th>
              <th scope="col" className="px-4 py-3">Rôle</th>
              <th scope="col" className="px-4 py-3">Bureau</th>
              <th scope="col" className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((u) => <UserRow key={u.id} user={u} offices={officeList} isSelf={u.id === me.id} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
