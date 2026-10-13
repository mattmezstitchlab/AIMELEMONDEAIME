"use server";

import { db } from "@/db";
import { appointments, notifications, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser, requireRole } from "@/lib/auth";
import { appointmentSchema, parseOrError } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function requestAppointment(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(["membre"]);
    const raw = {
      officeId: String(formData.get("officeId") || ""),
      reason: String(formData.get("reason") || ""),
      requestedSlot: String(formData.get("requestedSlot") || ""),
      caseId: formData.get("caseId") ? String(formData.get("caseId")) : undefined,
    };
    const parsed = parseOrError(appointmentSchema, raw);
    if (!parsed.ok) return { ok: false, error: parsed.error };

    const slotDate = new Date(parsed.data.requestedSlot);
    if (Number.isNaN(slotDate.getTime())) return { ok: false, error: "Date invalide." };

    await db.insert(appointments).values({
      memberId: user.id,
      officeId: parsed.data.officeId,
      reason: parsed.data.reason,
      requestedSlot: slotDate,
      caseId: parsed.data.caseId ? Number(parsed.data.caseId) : null,
      status: "demandee",
    });

    const caseworkers = await db
      .select()
      .from(users)
      .where(and(eq(users.role, "gestionnaire"), eq(users.officeId, parsed.data.officeId)));
    for (const cw of caseworkers) {
      await db.insert(notifications).values({
        userId: cw.id,
        title: "Nouvelle demande de rendez-vous",
        body: `${user.fullName} souhaite un rendez-vous : ${parsed.data.reason}.`,
        link: "/back-office/rendez-vous",
      });
    }

    await logAudit({ actorId: user.id, action: "demande_rdv", entityType: "appointment" });
    revalidatePath("/espace/echanges");
    revalidatePath("/back-office/rendez-vous");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

export async function updateAppointmentStatus(appointmentId: number, status: string): Promise<ActionResult> {
  try {
    const user = await requireRole(["gestionnaire", "administrateur"]);
    const [appt] = await db.select().from(appointments).where(eq(appointments.id, appointmentId)).limit(1);
    if (!appt) return { ok: false, error: "Rendez-vous introuvable." };
    if (user.role === "gestionnaire" && appt.officeId !== user.officeId) {
      return { ok: false, error: "Accès refusé." };
    }
    await db
      .update(appointments)
      .set({ status, caseworkerId: user.id })
      .where(eq(appointments.id, appointmentId));

    await db.insert(notifications).values({
      userId: appt.memberId,
      title: "Mise à jour de votre rendez-vous",
      body: `Votre demande de rendez-vous est désormais « ${status === "confirmee" ? "confirmée" : status === "annulee" ? "annulée" : "terminée"} ».`,
      link: "/espace/echanges",
    });

    await logAudit({ actorId: user.id, action: "maj_rdv", entityType: "appointment", entityId: appointmentId });
    revalidatePath("/back-office/rendez-vous");
    revalidatePath("/espace/echanges");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}
