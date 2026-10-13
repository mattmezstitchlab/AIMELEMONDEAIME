"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { circlePosts, contentReports, projects } from "@/db/schema";
import { AuthError, requireRole, requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export type ModerationResult = { ok: true; message: string } | { ok: false; error: string };
const REASONS = ["contenu_inapproprie", "contenu_trompeur", "atteinte_vie_privee", "mineur_en_danger", "autre"];

/** Signalement d'un projet ou d'un récit publié (les annonces ont leur propre signalement). */
export async function reportPublicContent(targetType: "projet" | "recit", targetId: number, reason: string, details: string): Promise<ModerationResult> {
  try {
    const user = await requireUser();
    if (!["projet", "recit"].includes(targetType) || !Number.isSafeInteger(targetId)) return { ok: false, error: "Contenu introuvable." };
    if (!REASONS.includes(reason)) return { ok: false, error: "Choisissez un motif." };
    const exists = targetType === "projet"
      ? (await db.select({ id: projects.id }).from(projects).where(eq(projects.id, targetId)).limit(1)).length
      : (await db.select({ id: circlePosts.id }).from(circlePosts).where(and(eq(circlePosts.id, targetId), eq(circlePosts.visibility, "publie"))).limit(1)).length;
    if (!exists) return { ok: false, error: "Contenu introuvable." };
    const [dup] = await db.select({ id: contentReports.id }).from(contentReports)
      .where(and(eq(contentReports.targetType, targetType), eq(contentReports.targetId, targetId), eq(contentReports.reporterId, user.id), eq(contentReports.status, "en_attente"))).limit(1);
    if (dup) return { ok: false, error: "Vous avez déjà signalé ce contenu." };
    await db.insert(contentReports).values({ targetType, targetId, reporterId: user.id, reason, details: details.trim().slice(0, 500) });
    await logAudit({ actorId: user.id, action: "signalement_contenu", entityType: targetType, entityId: String(targetId) });
    return { ok: true, message: "Signalement transmis à la modération." };
  } catch (error) {
    return error instanceof AuthError ? { ok: false, error: "Connectez-vous pour signaler." } : { ok: false, error: "Signalement impossible." };
  }
}

export async function moderateContentReport(reportId: number, decision: "masquer" | "maintenir"): Promise<ModerationResult> {
  try {
    const admin = await requireRole(["administrateur"]);
    const [report] = await db.select().from(contentReports).where(eq(contentReports.id, reportId)).limit(1);
    if (!report || report.status !== "en_attente") return { ok: false, error: "Signalement déjà traité." };
    await db.transaction(async (tx) => {
      await tx.update(contentReports).set({ status: decision === "masquer" ? "traite_masque" : "traite_maintenu", reviewedBy: admin.id }).where(eq(contentReports.id, reportId));
      if (decision === "masquer") {
        if (report.targetType === "projet") await tx.update(projects).set({ status: "suspendu" }).where(eq(projects.id, report.targetId));
        else await tx.update(circlePosts).set({ visibility: "prive" }).where(eq(circlePosts.id, report.targetId));
      }
    });
    await logAudit({ actorId: admin.id, action: `moderation_contenu_${decision}`, entityType: report.targetType, entityId: String(report.targetId) });
    revalidatePath("/admin/le-monde-aime");
    revalidatePath("/le-monde-aime");
    return { ok: true, message: decision === "masquer" ? "Contenu retiré de l'affichage public." : "Signalement classé sans suite." };
  } catch (error) {
    return error instanceof AuthError ? { ok: false, error: "Réservé à l'administration." } : { ok: false, error: "Modération impossible." };
  }
}
