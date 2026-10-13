"use server";

import { db } from "@/db";
import { cases, caseEvents, procedureTypes, users, notifications } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUser, requireRole } from "@/lib/auth";
import { generateCaseReference } from "@/lib/reference";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CASE_STATUS_LABELS } from "@/lib/constants";
import type { CaseStatus } from "@/db/schema";

export type ActionResult = { ok: true; id?: number } | { ok: false; error: string };

async function assertCaseAccess(caseId: number) {
  const user = await requireUser();
  const [item] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
  if (!item) throw new Error("Dossier introuvable.");

  if (user.role === "membre") {
    if (item.memberId !== user.id) throw new Error("Accès refusé.");
  } else if (user.role === "gestionnaire") {
    if (item.officeId !== user.officeId) throw new Error("Accès refusé à ce bureau.");
  }
  return { user, item };
}

export async function startProcedure(formData: FormData) {
  const procedureTypeId = Number(formData.get("procedureTypeId"));
  const result = await createDraftCase(procedureTypeId);
  if (result.ok && result.id) {
    redirect(`/espace/demarches/${result.id}`);
  }
  redirect(`/espace/demarches/nouvelle?erreur=${encodeURIComponent(!result.ok ? result.error : "Erreur inattendue.")}`);
}

export async function createDraftCase(procedureTypeId: number): Promise<ActionResult> {
  try {
    const user = await requireRole(["membre"]);
    const [proc] = await db.select().from(procedureTypes).where(eq(procedureTypes.id, procedureTypeId)).limit(1);
    if (!proc) return { ok: false, error: "Démarche inconnue." };

    const prefill: Record<string, string> = {};
    for (const field of proc.fields) {
      if (field.prefillFrom) {
        const val = (user as unknown as Record<string, unknown>)[field.prefillFrom];
        if (typeof val === "string") prefill[field.name] = val;
      }
    }

    const [created] = await db
      .insert(cases)
      .values({
        reference: generateCaseReference(),
        memberId: user.id,
        procedureTypeId: proc.id,
        officeId: user.officeId ?? null,
        status: "brouillon",
        title: proc.title,
        data: prefill,
        requestedDocuments: [],
      })
      .returning();

    await db.insert(caseEvents).values({
      caseId: created.id,
      actorId: user.id,
      type: "creation",
      message: "Brouillon créé à partir de la démarche « " + proc.title + " ».",
    });

    await logAudit({ actorId: user.id, action: "creation_dossier", entityType: "case", entityId: created.id });
    revalidatePath("/espace/demarches");
    return { ok: true, id: created.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

export async function saveDraftData(caseId: number, data: Record<string, string>): Promise<ActionResult> {
  try {
    const { user, item } = await assertCaseAccess(caseId);
    if (user.role !== "membre") return { ok: false, error: "Accès refusé." };
    if (item.status !== "brouillon" && item.status !== "piece_manquante") {
      return { ok: false, error: "Ce dossier ne peut plus être modifié." };
    }
    await db
      .update(cases)
      .set({ data: { ...item.data, ...data }, updatedAt: new Date() })
      .where(eq(cases.id, caseId));
    revalidatePath(`/espace/demarches/${caseId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

export async function submitCase(caseId: number): Promise<ActionResult> {
  try {
    const { user, item } = await assertCaseAccess(caseId);
    if (user.role !== "membre") return { ok: false, error: "Accès refusé." };
    if (item.status !== "brouillon") return { ok: false, error: "Ce dossier a déjà été envoyé." };

    // auto-assign least loaded caseworker of the member's office
    let assigned: number | null = null;
    if (item.officeId) {
      const caseworkers = await db
        .select()
        .from(users)
        .where(and(eq(users.role, "gestionnaire"), eq(users.officeId, item.officeId)));
      if (caseworkers.length > 0) {
        assigned = caseworkers[Math.floor(Math.random() * caseworkers.length)].id;
      }
    }

    await db
      .update(cases)
      .set({ status: "envoyee", submittedAt: new Date(), updatedAt: new Date(), assignedCaseworkerId: assigned })
      .where(eq(cases.id, caseId));

    await db.insert(caseEvents).values({
      caseId,
      actorId: user.id,
      type: "soumission",
      message: "Dossier envoyé pour instruction.",
    });
    if (assigned) {
      await db.insert(caseEvents).values({
        caseId,
        actorId: user.id,
        type: "affectation",
        message: "Dossier affecté à un membre de l'équipe d'accompagnement.",
      });
      await db.insert(notifications).values({
        userId: assigned,
        title: "Nouveau dossier à instruire",
        body: `Le dossier ${item.reference} a été envoyé et vous a été affecté.`,
        link: `/back-office/dossiers/${caseId}`,
      });
    }
    await db.insert(notifications).values({
      userId: user.id,
      title: "Dossier envoyé",
      body: `Votre dossier ${item.reference} a bien été envoyé à l'équipe d'accompagnement (démonstration).`,
      link: `/espace/demarches/${caseId}`,
    });

    await logAudit({ actorId: user.id, action: "soumission_dossier", entityType: "case", entityId: caseId });
    revalidatePath("/espace/demarches");
    revalidatePath(`/espace/demarches/${caseId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

export async function deleteDraftCase(caseId: number): Promise<ActionResult> {
  try {
    const { user, item } = await assertCaseAccess(caseId);
    if (user.role !== "membre") return { ok: false, error: "Accès refusé." };
    if (item.status !== "brouillon") return { ok: false, error: "Seul un brouillon peut être supprimé." };
    await db.delete(cases).where(eq(cases.id, caseId));
    revalidatePath("/espace/demarches");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

export async function respondToMissingDocument(caseId: number, message: string): Promise<ActionResult> {
  try {
    const { user, item } = await assertCaseAccess(caseId);
    if (user.role !== "membre") return { ok: false, error: "Accès refusé." };
    await db.insert(caseEvents).values({
      caseId,
      actorId: user.id,
      type: "message",
      message,
    });
    if (item.assignedCaseworkerId) {
      await db.insert(notifications).values({
        userId: item.assignedCaseworkerId,
        title: "Réponse du membre",
        body: `Le membre a répondu sur le dossier ${item.reference}.`,
        link: `/back-office/dossiers/${caseId}`,
      });
    }
    revalidatePath(`/espace/demarches/${caseId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

// ---- Caseworker actions ----

export async function assignCaseToSelf(caseId: number): Promise<ActionResult> {
  try {
    const user = await requireRole(["gestionnaire", "administrateur"]);
    const { item } = await assertCaseAccess(caseId);
    await db.update(cases).set({ assignedCaseworkerId: user.id, updatedAt: new Date() }).where(eq(cases.id, caseId));
    await db.insert(caseEvents).values({
      caseId,
      actorId: user.id,
      type: "affectation",
      message: `Dossier pris en charge par ${user.fullName}.`,
    });
    await logAudit({ actorId: user.id, action: "affectation_dossier", entityType: "case", entityId: caseId });
    revalidatePath(`/back-office/dossiers/${caseId}`);
    revalidatePath("/back-office/dossiers");
    void item;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

export async function updateCaseStatus(
  caseId: number,
  status: CaseStatus,
  message?: string,
  requestedDocuments?: string[]
): Promise<ActionResult> {
  try {
    const user = await requireRole(["gestionnaire", "administrateur"]);
    const { item } = await assertCaseAccess(caseId);

    await db
      .update(cases)
      .set({
        status,
        requestedDocuments: requestedDocuments ?? item.requestedDocuments,
        updatedAt: new Date(),
      })
      .where(eq(cases.id, caseId));

    await db.insert(caseEvents).values({
      caseId,
      actorId: user.id,
      type: "changement_statut",
      message: message || `Statut mis à jour : ${CASE_STATUS_LABELS[status]}.`,
    });

    await db.insert(notifications).values({
      userId: item.memberId,
      title: "Mise à jour de votre dossier",
      body: `Votre dossier ${item.reference} est maintenant « ${CASE_STATUS_LABELS[status]} ».`,
      link: `/espace/demarches/${caseId}`,
    });

    await logAudit({ actorId: user.id, action: "changement_statut", entityType: "case", entityId: caseId, metadata: { status } });
    revalidatePath(`/back-office/dossiers/${caseId}`);
    revalidatePath(`/espace/demarches/${caseId}`);
    revalidatePath("/back-office/dossiers");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

export async function caseworkerReply(caseId: number, message: string): Promise<ActionResult> {
  try {
    const user = await requireRole(["gestionnaire", "administrateur"]);
    const { item } = await assertCaseAccess(caseId);
    await db.insert(caseEvents).values({
      caseId,
      actorId: user.id,
      type: "message",
      message,
    });
    await db.insert(notifications).values({
      userId: item.memberId,
      title: "Nouveau message de l'équipe d'accompagnement",
      body: `Vous avez reçu une réponse sur le dossier ${item.reference}.`,
      link: `/espace/demarches/${caseId}`,
    });
    revalidatePath(`/back-office/dossiers/${caseId}`);
    revalidatePath(`/espace/demarches/${caseId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

// linkDocumentEvent vit dans "@/lib/case-events" (module serveur interne) :
// ne jamais exporter d'helper sans contrôle d'accès depuis un fichier "use server",
// chaque export devient un endpoint Server Action publiquement invocable.
