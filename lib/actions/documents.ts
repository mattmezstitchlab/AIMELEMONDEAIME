"use server";

import { db } from "@/db";
import { documents, cases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { linkDocumentEvent } from "@/lib/case-events";

export type ActionResult = { ok: true; id?: number } | { ok: false; error: string };

const MAX_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function uploadDocument(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const file = formData.get("file");
    const category = String(formData.get("category") || "autre");
    const caseIdRaw = formData.get("caseId");
    const caseId = caseIdRaw ? Number(caseIdRaw) : null;

    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Veuillez sélectionner un fichier." };
    }
    if (file.size > MAX_SIZE) {
      return { ok: false, error: "Fichier trop volumineux (8 Mo maximum)." };
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { ok: false, error: "Format non autorisé (PDF, JPG, PNG ou Word uniquement)." };
    }

    if (caseId) {
      const [item] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
      if (!item) return { ok: false, error: "Dossier introuvable." };
      if (user.role === "membre" && item.memberId !== user.id) {
        return { ok: false, error: "Accès refusé." };
      }
      if (user.role === "gestionnaire" && item.officeId !== user.officeId) {
        return { ok: false, error: "Accès refusé." };
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const [created] = await db
      .insert(documents)
      .values({
        ownerId: user.role === "membre" ? user.id : (caseId ? (await db.select().from(cases).where(eq(cases.id, caseId)).limit(1))[0].memberId : user.id),
        caseId: caseId,
        category,
        filename: file.name.slice(0, 190),
        mimeType: file.type,
        sizeBytes: file.size,
        content: buffer,
        isSpecimen: false,
        uploadedById: user.id,
      })
      .returning();

    if (caseId) {
      await linkDocumentEvent(caseId, created.filename, user.id);
    }

    await logAudit({ actorId: user.id, action: "depot_document", entityType: "document", entityId: created.id });
    revalidatePath("/espace/documents");
    if (caseId) {
      revalidatePath(`/espace/demarches/${caseId}`);
      revalidatePath(`/back-office/dossiers/${caseId}`);
    }
    return { ok: true, id: created.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

export async function deleteOwnDraftDocument(documentId: number): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const [doc] = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
    if (!doc) return { ok: false, error: "Document introuvable." };
    if (doc.ownerId !== user.id) return { ok: false, error: "Accès refusé." };
    if (doc.caseId) {
      const [item] = await db.select().from(cases).where(eq(cases.id, doc.caseId)).limit(1);
      if (item && item.status !== "brouillon") {
        return { ok: false, error: "Un document lié à un dossier envoyé ne peut pas être supprimé." };
      }
    }
    await db.delete(documents).where(eq(documents.id, documentId));
    revalidatePath("/espace/documents");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}
