import { getCurrentUser } from "@/lib/auth";
import type { Metadata } from "next";
import { db } from "@/db";
import { messages, users } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { Card, SectionTitle, EmptyState, formatDateTime } from "@/components/ui";
import { ReplyForm } from "./reply-form";

export const metadata: Metadata = { title: "Messages — Back-office AIME®" };

export const dynamic = "force-dynamic";

export default async function BackOfficeMessages() {
  const user = (await getCurrentUser())!;
  const base = db.select().from(messages);
  const rows = user.role === "administrateur" ? await base.orderBy(asc(messages.createdAt)) : await base.where(eq(messages.officeId, user.officeId ?? -1)).orderBy(asc(messages.createdAt));

  const allUsers = await db.select({ id: users.id, fullName: users.fullName, role: users.role }).from(users);
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  // Regroupement par adhérent
  const threads = new Map<number, typeof rows>();
  for (const m of rows) {
    const sender = userMap.get(m.senderId);
    const memberId = sender?.role === "membre" ? m.senderId : m.recipientId;
    if (!memberId) continue;
    threads.set(memberId, [...(threads.get(memberId) ?? []), m]);
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle eyebrow="Messagerie" title="Messages des adhérents" description="Questions générales adressées à votre bureau (hors dossiers)." />
      {threads.size === 0 ? (
        <EmptyState title="Aucun message" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from(threads.entries()).map(([memberId, list]) => (
            <Card key={memberId} className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-slate-900">{userMap.get(memberId)?.fullName ?? "Adhérent"}</h2>
              <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
                {list.map((m) => (
                  <li key={m.id} className={`rounded-card px-3 py-2 text-sm ${m.senderId === memberId ? "mr-6 bg-subtle" : "ml-6 bg-muted"}`}>
                    <p className="text-slate-800">{m.body}</p>
                    <p className="mt-1 text-xs text-slate-500">{userMap.get(m.senderId)?.fullName} · {formatDateTime(m.createdAt)}</p>
                  </li>
                ))}
              </ul>
              <ReplyForm recipientId={memberId} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
