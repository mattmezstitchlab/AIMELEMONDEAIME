import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { projectDocuments, projectMembers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string; docId: string }> };

/** Document de projet : réservé aux participants acceptés ; certains documents sont limités aux organisateurs. */
export async function GET(_req: Request, { params }: Ctx) {
  const { id, docId } = await params;
  const projectId = Number(id);
  const documentId = Number(docId);
  if (!Number.isSafeInteger(projectId) || !Number.isSafeInteger(documentId)) return new Response("Introuvable", { status: 404 });
  const user = await getCurrentUser();
  if (!user) return new Response("Authentification requise", { status: 401 });
  const [member] = await db.select().from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, user.id), eq(projectMembers.status, "accepte"))).limit(1);
  if (!member) return new Response("Accès refusé", { status: 403 });
  const [doc] = await db.select().from(projectDocuments).where(and(eq(projectDocuments.id, documentId), eq(projectDocuments.projectId, projectId))).limit(1);
  if (!doc) return new Response("Introuvable", { status: 404 });
  if (doc.access === "organisateurs" && member.role !== "organisateur") return new Response("Accès refusé", { status: 403 });
  return new Response(new Uint8Array(doc.content), {
    headers: {
      "Content-Type": doc.mime,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.filename)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
