"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { circleMembers, circlePosts, circles, users } from "@/db/schema";
import { AuthError, requireRole } from "@/lib/auth";
import { createNotification } from "@/lib/queries";
import { logAudit } from "@/lib/audit";
import { IMAGE_TYPES, readUpload } from "@/lib/uploads";

export type CircleResult = { ok: true; message: string; id?: number } | { ok: false; error: string };
const PATH = "/le-monde-aime";
const KINDS = ["famille", "association", "groupe"];
const POST_KINDS = ["projet", "photo", "recit", "recette", "savoir"];

const str = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
};
const fail = (error: unknown, fallback: string): CircleResult =>
  error instanceof AuthError ? { ok: false, error: "Connectez-vous avec un compte membre." } : { ok: false, error: fallback };

async function memberRow(circleId: number, userId: number) {
  const [row] = await db.select().from(circleMembers).where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))).limit(1);
  return row ?? null;
}

export async function createCircle(form: FormData): Promise<CircleResult> {
  try {
    const user = await requireRole(["membre"]);
    const name = str(form, "name");
    const kind = str(form, "kind");
    const description = str(form, "description").slice(0, 400);
    if (name.length < 3 || name.length > 120) return { ok: false, error: "Le nom du cercle doit contenir entre 3 et 120 caractères." };
    if (!KINDS.includes(kind)) return { ok: false, error: "Choisissez famille, association ou groupe local." };
    const created = await db.transaction(async (tx) => {
      const [circle] = await tx.insert(circles).values({ ownerId: user.id, name, kind, description }).returning({ id: circles.id });
      await tx.insert(circleMembers).values({ circleId: circle.id, userId: user.id, role: "responsable", status: "accepte" });
      return circle;
    });
    await logAudit({ actorId: user.id, action: "creation_cercle", entityType: "circle", entityId: String(created.id) });
    revalidatePath(PATH);
    return { ok: true, message: "Cercle créé. Invitez ensuite ses membres.", id: created.id };
  } catch (error) {
    return fail(error, "Le cercle n'a pas pu être créé.");
  }
}

/** Invitation par e-mail d'un adulte déjà inscrit ; l'accès n'existe qu'après acceptation. */
export async function inviteToCircle(circleId: number, emailRaw: string): Promise<CircleResult> {
  try {
    const user = await requireRole(["membre"]);
    const me = await memberRow(circleId, user.id);
    if (!me || me.status !== "accepte" || me.role !== "responsable") return { ok: false, error: "Réservé aux responsables du cercle." };
    const email = emailRaw.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Adresse e-mail invalide." };
    const [target] = await db.select({ id: users.id, role: users.role, isActive: users.isActive }).from(users).where(eq(users.email, email)).limit(1);
    if (!target || target.role !== "membre" || !target.isActive) return { ok: false, error: "Aucun compte membre n'est associé à cette adresse. Invitez la personne à s'inscrire d'abord." };
    if (await memberRow(circleId, target.id)) return { ok: false, error: "Cette personne est déjà invitée ou membre." };
    const [circle] = await db.select({ name: circles.name }).from(circles).where(eq(circles.id, circleId)).limit(1);
    await db.insert(circleMembers).values({ circleId, userId: target.id, role: "membre", status: "invite" });
    await createNotification({ userId: target.id, title: "Invitation à un cercle privé", body: `${user.displayName ?? user.fullName} vous invite à rejoindre « ${circle?.name ?? "un cercle"} ».`, link: "/espace" });
    revalidatePath(PATH);
    return { ok: true, message: "Invitation envoyée. Elle doit être acceptée pour donner accès au cercle." };
  } catch (error) {
    return fail(error, "Invitation impossible.");
  }
}

export async function respondToCircleInvite(circleId: number, accept: boolean): Promise<CircleResult> {
  try {
    const user = await requireRole(["membre"]);
    const row = await memberRow(circleId, user.id);
    if (!row || row.status !== "invite") return { ok: false, error: "Aucune invitation en attente." };
    await db.update(circleMembers).set({ status: accept ? "accepte" : "refuse" }).where(eq(circleMembers.id, row.id));
    revalidatePath(PATH);
    return { ok: true, message: accept ? "Vous avez rejoint le cercle." : "Invitation refusée." };
  } catch (error) {
    return fail(error, "Réponse impossible.");
  }
}

export async function createCirclePost(form: FormData): Promise<CircleResult> {
  try {
    const user = await requireRole(["membre"]);
    const circleId = Number(str(form, "circleId"));
    const me = await memberRow(circleId, user.id);
    if (!me || me.status !== "accepte") return { ok: false, error: "Réservé aux membres du cercle." };
    const kind = str(form, "kind");
    const title = str(form, "title");
    const body = str(form, "body").slice(0, 4000);
    if (!POST_KINDS.includes(kind)) return { ok: false, error: "Choisissez un type de partage." };
    if (title.length < 3 || title.length > 140) return { ok: false, error: "Le titre doit contenir entre 3 et 140 caractères." };
    const upload = await readUpload(form, "photo", IMAGE_TYPES, 3_000_000);
    if (upload && !upload.ok) return upload;
    const [post] = await db.insert(circlePosts).values({
      circleId, authorId: user.id, kind, title, body,
      photoData: upload?.ok ? upload.data : null, photoMime: upload?.ok ? upload.mime : null, visibility: "prive",
    }).returning({ id: circlePosts.id });
    revalidatePath(PATH);
    return { ok: true, message: "Partagé dans le cercle. Il reste privé tant que vous ne le publiez pas.", id: post.id };
  } catch (error) {
    return fail(error, "Publication impossible.");
  }
}

/** Seul l'auteur choisit de rendre un partage public ou de le remettre en privé. */
export async function setPostVisibility(postId: number, visibility: "prive" | "publie"): Promise<CircleResult> {
  try {
    const user = await requireRole(["membre"]);
    const [post] = await db.select().from(circlePosts).where(eq(circlePosts.id, postId)).limit(1);
    if (!post || post.authorId !== user.id) return { ok: false, error: "Seul l'auteur peut modifier la visibilité." };
    if (!["prive", "publie"].includes(visibility)) return { ok: false, error: "Visibilité invalide." };
    await db.update(circlePosts).set({ visibility }).where(eq(circlePosts.id, postId));
    await logAudit({ actorId: user.id, action: visibility === "publie" ? "publication_recit" : "retrait_recit", entityType: "circle_post", entityId: String(postId) });
    revalidatePath(PATH);
    return { ok: true, message: visibility === "publie" ? "Publié : visible par tous, sans le nom du cercle." : "Remis en privé." };
  } catch (error) {
    return fail(error, "Modification impossible.");
  }
}

export async function deleteCirclePost(postId: number): Promise<CircleResult> {
  try {
    const user = await requireRole(["membre"]);
    const [post] = await db.select().from(circlePosts).where(eq(circlePosts.id, postId)).limit(1);
    if (!post) return { ok: false, error: "Partage introuvable." };
    const me = await memberRow(post.circleId, user.id);
    const allowed = post.authorId === user.id || (me?.status === "accepte" && me.role === "responsable");
    if (!allowed) return { ok: false, error: "Suppression non autorisée." };
    await db.delete(circlePosts).where(eq(circlePosts.id, postId));
    revalidatePath(PATH);
    return { ok: true, message: "Partage supprimé." };
  } catch (error) {
    return fail(error, "Suppression impossible.");
  }
}
