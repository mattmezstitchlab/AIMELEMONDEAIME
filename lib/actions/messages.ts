"use server";

import { db } from "@/db";
import { messages, users, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireRole, requireUser } from "@/lib/auth";
import { messageSchema, parseOrError } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function sendOfficeMessage(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(["membre"]);
    const parsed = parseOrError(messageSchema, { body: String(formData.get("body") || "") });
    if (!parsed.ok) return { ok: false, error: parsed.error };
    if (!user.officeId) return { ok: false, error: "Aucun point d'accueil rattaché à votre profil." };

    await db.insert(messages).values({
      senderId: user.id,
      officeId: user.officeId,
      subject: "Message à l'équipe d'accompagnement",
      body: parsed.data.body,
    });

    const caseworkers = await db
      .select()
      .from(users)
      .where(and(eq(users.role, "gestionnaire"), eq(users.officeId, user.officeId)));
    for (const cw of caseworkers) {
      await db.insert(notifications).values({
        userId: cw.id,
        title: "Nouveau message d'un adhérent",
        body: `${user.fullName} : ${parsed.data.body.slice(0, 80)}`,
        link: "/back-office",
      });
    }

    await logAudit({ actorId: user.id, action: "message_bureau", entityType: "message" });
    revalidatePath("/espace/echanges");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

export async function replyToMember(recipientId: number, body: string): Promise<ActionResult> {
  try {
    const user = await requireRole(["gestionnaire", "administrateur"]);
    const parsed = parseOrError(messageSchema, { body });
    if (!parsed.ok) return { ok: false, error: parsed.error };

    const [recipient] = await db.select().from(users).where(eq(users.id, recipientId)).limit(1);
    if (!recipient) return { ok: false, error: "Destinataire introuvable." };
    if (user.role === "gestionnaire" && recipient.officeId !== user.officeId) {
      return { ok: false, error: "Accès refusé." };
    }

    await db.insert(messages).values({
      senderId: user.id,
      recipientId,
      officeId: recipient.officeId,
      subject: "Réponse de l'équipe d'accompagnement",
      body: parsed.data.body,
    });
    await db.insert(notifications).values({
      userId: recipientId,
      title: "Réponse de l'équipe d'accompagnement",
      body: parsed.data.body.slice(0, 100),
      link: "/espace/echanges",
    });

    await logAudit({ actorId: user.id, action: "reponse_membre", entityType: "message", entityId: recipientId });
    revalidatePath("/espace/echanges");
    revalidatePath("/back-office");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

export async function markNotificationRead(id: number) {
  const user = await requireUser();
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));
  revalidatePath("/espace", "layout");
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, user.id));
  revalidatePath("/espace", "layout");
}
