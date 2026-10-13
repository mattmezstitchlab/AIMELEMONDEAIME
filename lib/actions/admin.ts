"use server";

import { db } from "@/db";
import { users, offices, articles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireRole, hashPassword } from "@/lib/auth";
import { officeSchema, articleSchema, parseOrError } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export type ActionResult = { ok: true; id?: number } | { ok: false; error: string };

export async function updateUserRole(userId: number, role: "membre" | "gestionnaire" | "administrateur", officeId?: number): Promise<ActionResult> {
  try {
    const admin = await requireRole(["administrateur"]);
    if (!["membre", "gestionnaire", "administrateur"].includes(role)) return { ok: false, error: "Rôle invalide." };
    if (userId === admin.id && role !== "administrateur") {
      return { ok: false, error: "Vous ne pouvez pas retirer votre propre rôle administrateur." };
    }
    if (role === "gestionnaire" && !officeId) {
      return { ok: false, error: "Un gestionnaire doit être rattaché à un bureau." };
    }
    await db
      .update(users)
      .set({ role, officeId: officeId ?? null })
      .where(eq(users.id, userId));
    await logAudit({ actorId: admin.id, action: "maj_role", entityType: "user", entityId: userId, metadata: { role } });
    revalidatePath("/admin/utilisateurs");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

export async function toggleUserActive(userId: number, isActive: boolean): Promise<ActionResult> {
  try {
    const admin = await requireRole(["administrateur"]);
    await db.update(users).set({ isActive }).where(eq(users.id, userId));
    await logAudit({ actorId: admin.id, action: isActive ? "activation_compte" : "desactivation_compte", entityType: "user", entityId: userId });
    revalidatePath("/admin/utilisateurs");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

export async function createStaffUser(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireRole(["administrateur"]);
    const fullName = String(formData.get("fullName") || "");
    const email = String(formData.get("email") || "").toLowerCase();
    const password = String(formData.get("password") || "");
    const role = String(formData.get("role") || "gestionnaire") as "gestionnaire" | "administrateur";
    const officeId = formData.get("officeId") ? Number(formData.get("officeId")) : null;

    if (!fullName || !email || password.length < 12) {
      return { ok: false, error: "Formulaire incomplet (mot de passe : 12 caractères minimum)." };
    }
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) return { ok: false, error: "Un compte existe déjà avec cet e-mail." };

    const passwordHash = await hashPassword(password);
    const [created] = await db
      .insert(users)
      .values({ fullName, email, passwordHash, role, officeId, onboardingCompleted: true })
      .returning();

    await logAudit({ actorId: admin.id, action: "creation_staff", entityType: "user", entityId: created.id });
    revalidatePath("/admin/utilisateurs");
    return { ok: true, id: created.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

export async function upsertOffice(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireRole(["administrateur"]);
    const id = formData.get("id") ? Number(formData.get("id")) : null;
    const parsed = parseOrError(officeSchema, {
      name: String(formData.get("name") || ""),
      code: String(formData.get("code") || ""),
      address: String(formData.get("address") || ""),
      city: String(formData.get("city") || ""),
      postalCode: String(formData.get("postalCode") || ""),
      phone: String(formData.get("phone") || ""),
      hours: String(formData.get("hours") || ""),
      region: String(formData.get("region") || ""),
    });
    if (!parsed.ok) return { ok: false, error: parsed.error };

    if (id) {
      await db.update(offices).set(parsed.data).where(eq(offices.id, id));
    } else {
      await db.insert(offices).values(parsed.data);
    }
    await logAudit({ actorId: admin.id, action: id ? "maj_bureau" : "creation_bureau", entityType: "office", entityId: id });
    revalidatePath("/admin/bureaux");
    revalidatePath("/annuaire");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

export async function deleteOffice(id: number): Promise<ActionResult> {
  try {
    const admin = await requireRole(["administrateur"]);
    await db.delete(offices).where(eq(offices.id, id));
    await logAudit({ actorId: admin.id, action: "suppression_bureau", entityType: "office", entityId: id });
    revalidatePath("/admin/bureaux");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Impossible de supprimer ce bureau (dossiers liés)." };
  }
}

export async function upsertArticle(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireRole(["administrateur"]);
    const id = formData.get("id") ? Number(formData.get("id")) : null;
    const title = String(formData.get("title") || "");
    const parsed = parseOrError(articleSchema, {
      title,
      category: String(formData.get("category") || ""),
      audience: String(formData.get("audience") || ""),
      summary: String(formData.get("summary") || ""),
      content: String(formData.get("content") || ""),
      kind: String(formData.get("kind") || "article"),
    });
    if (!parsed.ok) return { ok: false, error: parsed.error };

    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (id) {
      await db.update(articles).set({ ...parsed.data, slug }).where(eq(articles.id, id));
    } else {
      await db.insert(articles).values({ ...parsed.data, slug });
    }
    await logAudit({ actorId: admin.id, action: id ? "maj_article" : "creation_article", entityType: "article", entityId: id });
    revalidatePath("/admin/contenus");
    revalidatePath("/guides");
    revalidatePath("/informations");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

export async function toggleArticlePublished(id: number, isPublished: boolean): Promise<ActionResult> {
  try {
    const admin = await requireRole(["administrateur"]);
    await db.update(articles).set({ isPublished }).where(eq(articles.id, id));
    await logAudit({ actorId: admin.id, action: isPublished ? "publication_article" : "depublication_article", entityType: "article", entityId: id });
    revalidatePath("/admin/contenus");
    revalidatePath("/guides");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

export async function deleteArticle(id: number): Promise<ActionResult> {
  try {
    const admin = await requireRole(["administrateur"]);
    await db.delete(articles).where(eq(articles.id, id));
    await logAudit({ actorId: admin.id, action: "suppression_article", entityType: "article", entityId: id });
    revalidatePath("/admin/contenus");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}
