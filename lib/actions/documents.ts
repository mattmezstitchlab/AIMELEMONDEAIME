"use server";

import { db } from "@/db";
import { documents, cases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { linkDocumentEvent } from "@/lib/case-events";
import { DOCUMENT_TYPES, readUpload } from "@/lib/uploads";

export type ActionResult = { ok: true; id?: number } | { ok: false; error: string };

const MAX_SIZE = 8 * 1024 * 1024;

export async function uploadDocument(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const category = String(formData.get("category") || "autre");
    const caseIdRaw = formData.get("caseId");
    const caseId = caseIdRaw ? Number(caseIdRaw) : null;

    const upload = await readUpload(formData, "file", DOCUMENT_TYPES, MAX_SIZE);
    if (!upload) return { ok: false, error: "Veuillez sélectionner un fichier." };
    if (!upload.ok) return upload;

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

    const [created] = await db
      .insert(documents)
      .values({
        ownerId: user.role === "membre" ? user.id : (caseId ? (await db.select().from(cases).where(eq(cases.id, caseId)).limit(1))[0].memberId : user.id),
        caseId: caseId,
        category,
        filename: upload.name,
        mimeType: upload.mime,
        sizeBytes: upload.size,
        content: upload.data,
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
