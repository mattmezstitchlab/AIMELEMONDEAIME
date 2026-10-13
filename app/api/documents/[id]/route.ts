import { db } from "@/db";
import { documents, cases, documentShares, projectMembers } from "@/db/schema";
import { and, eq, isNull, or, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const docId = Number(id);
  if (!Number.isFinite(docId)) {
    return new Response("Introuvable", { status: 404 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return new Response("Authentification requise", { status: 401 });
  }

  const [doc] = await db.select().from(documents).where(eq(documents.id, docId)).limit(1);
  if (!doc) {
    return new Response("Introuvable", { status: 404 });
  }

  if (user.role === "membre" && doc.ownerId !== user.id) {
    // Accès uniquement via un partage explicite, actif (non révoqué), à la personne ou à un projet dont elle est membre acceptée.
    const memberOf = (await db.select({ id: projectMembers.projectId }).from(projectMembers)
      .where(and(eq(projectMembers.userId, user.id), eq(projectMembers.status, "accepte")))).map((m) => m.id);
    const [share] = await db.select({ id: documentShares.id }).from(documentShares).where(and(
      eq(documentShares.documentId, doc.id), isNull(documentShares.revokedAt),
      memberOf.length ? or(eq(documentShares.granteeUserId, user.id), inArray(documentShares.projectId, memberOf)) : eq(documentShares.granteeUserId, user.id),
    )).limit(1);
    if (!share) return new Response("Accès refusé", { status: 403 });
  }
  if (user.role === "gestionnaire") {
    let allowed = false;
    if (doc.caseId) {
      const [item] = await db.select().from(cases).where(eq(cases.id, doc.caseId)).limit(1);
      allowed = !!item && item.officeId === user.officeId;
    }
    if (!allowed) {
      return new Response("Accès refusé", { status: 403 });
    }
  }

  await logAudit({
    actorId: user.id,
    action: "telechargement_document",
    entityType: "document",
    entityId: doc.id,
  });

  // Affichage intégré uniquement pour les formats sûrs (images, PDF) ;
  // tout le reste est téléchargé, avec nosniff systématique.
  const INLINE_SAFE = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  const disposition = INLINE_SAFE.includes(doc.mimeType) ? "inline" : "attachment";
  return new Response(new Uint8Array(doc.content), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `${disposition}; filename="${encodeURIComponent(doc.filename)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
