"use server";

import { validateGuestReplyDetails } from "@/lib/wedding-portal";
import { randomBytes } from "node:crypto";
import { SignJWT } from "jose";
import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { journeys, projectMembers, projects, weddingAccessLinks, weddingGuests, type WeddingAccessRole } from "@/db/schema";
import { AuthError, requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { clientIp, hitRateLimit } from "@/lib/rate-limit";
import { getAuthSecret } from "@/lib/secret";
import { getWeddingAccessInvite, getWeddingAccessSession, hashWeddingToken, isWeddingToken, WEDDING_ACCESS_COOKIE } from "@/lib/wedding-access";

export type WeddingAccessResult = { ok: true; message: string } | { ok: false; error: string };
export type CreateWeddingLinkResult =
  | { ok: true; message: string; token: string; expiresAt: string }
  | { ok: false; error: string };
export type RsvpActionState = { ok: boolean; message: string };

const ROLE_VALUES: readonly string[] = ["coordination", "temoin"];
const fail = (error: unknown): { ok: false; error: string } =>
  error instanceof AuthError ? { ok: false, error: "Connectez-vous avec un compte organisateur." } : { ok: false, error: "Cette action n'a pas pu aboutir." };

async function organizerWeddingProject(projectId: number, userId: number) {
  const [project] = await db
    .select({ id: projects.id, status: projects.status, startsAt: projects.startsAt })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  if (!project) return null;
  const [member] = await db
    .select({ id: projectMembers.id })
    .from(projectMembers)
    .where(and(
      eq(projectMembers.projectId, projectId),
      eq(projectMembers.userId, userId),
      eq(projectMembers.role, "organisateur"),
      eq(projectMembers.status, "accepte"),
    ))
    .limit(1);
  if (!member) return null;
  const [journey] = await db
    .select({ id: journeys.id })
    .from(journeys)
    .where(and(eq(journeys.projectId, projectId), eq(journeys.situation, "mariage")))
    .limit(1);
  return journey ? project : null;
}

async function editableOrganizerProject(projectId: number, userId: number) {
  const project = await organizerWeddingProject(projectId, userId);
  if (!project || project.status !== "ouvert") return null;
  return project;
}

function revalidateWedding(projectId: number) {
  revalidatePath(`/le-monde-aime/projets/${projectId}`);
  revalidatePath("/partage-mariage/[id]", "page");
}

/** Create a revocable, project-scoped link; the raw bearer token is returned once only. */
export async function createWeddingAccessLink(projectId: number, roleRaw: string, labelRaw: string, durationDays: number): Promise<CreateWeddingLinkResult> {
  try {
    const user = await requireRole(["membre"]);
    const project = await editableOrganizerProject(projectId, user.id);
    if (!project) return { ok: false, error: "Projet de mariage introuvable ou non modifiable." };
    if (!ROLE_VALUES.includes(roleRaw)) return { ok: false, error: "Rôle inconnu." };
    if (![7, 30, 90].includes(durationDays)) return { ok: false, error: "Durée de validité inconnue." };

    const now = new Date();
    const activeLinks = await db
      .select({ id: weddingAccessLinks.id })
      .from(weddingAccessLinks)
      .where(and(
        eq(weddingAccessLinks.projectId, projectId),
        isNull(weddingAccessLinks.revokedAt),
        gt(weddingAccessLinks.expiresAt, now),
      ));
    if (activeLinks.length >= 25) return { ok: false, error: "25 liens actifs maximum. Révoquez un lien inutilisé avant d'en créer un autre." };

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const label = String(labelRaw ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 80) || "Proche";
    const role = roleRaw as WeddingAccessRole;
    const [link] = await db.insert(weddingAccessLinks).values({
      projectId,
      createdById: user.id,
      label,
      role,
      tokenHash: hashWeddingToken(token),
      expiresAt,
    }).returning({ id: weddingAccessLinks.id });
    await logAudit({ actorId: user.id, action: "mariage_lien_acces_cree", entityType: "project", entityId: String(projectId), metadata: { role, op: "creation" } });
    revalidateWedding(projectId);
    return { ok: true, message: "Lien créé. Copiez-le maintenant : il ne sera plus affiché après avoir quitté cette page.", token, expiresAt: expiresAt.toISOString() };
  } catch (error) {
    return fail(error);
  }
}

export async function revokeWeddingAccessLink(linkId: number): Promise<WeddingAccessResult> {
  try {
    const user = await requireRole(["membre"]);
    const [link] = await db.select().from(weddingAccessLinks).where(eq(weddingAccessLinks.id, linkId)).limit(1);
    if (!link) return { ok: false, error: "Lien introuvable." };
    const project = await organizerWeddingProject(link.projectId, user.id);
    if (!project) return { ok: false, error: "Lien introuvable ou réservé aux organisateurs." };
    if (link.revokedAt) return { ok: true, message: "Ce lien est déjà révoqué." };
    await db.update(weddingAccessLinks).set({ revokedAt: new Date() }).where(eq(weddingAccessLinks.id, linkId));
    await logAudit({ actorId: user.id, action: "mariage_lien_acces_revoque", entityType: "project", entityId: String(link.projectId), metadata: { role: link.role, op: "revocation" } });
    revalidateWedding(link.projectId);
    return { ok: true, message: "Lien révoqué : il ne donne plus accès, même si le proche l'avait déjà ouvert." };
  } catch (error) {
    return fail(error);
  }
}

/** One household only. Regeneration invalidates the household's previous RSVP URL. */
export async function createWeddingRsvpLink(guestId: number): Promise<CreateWeddingLinkResult> {
  try {
    const user = await requireRole(["membre"]);
    const [guest] = await db.select({ id: weddingGuests.id, projectId: weddingGuests.projectId }).from(weddingGuests).where(eq(weddingGuests.id, guestId)).limit(1);
    if (!guest) return { ok: false, error: "Foyer introuvable." };
    const project = await editableOrganizerProject(guest.projectId, user.id);
    if (!project) return { ok: false, error: "Projet de mariage introuvable ou non modifiable." };

    const now = new Date();
    const defaultExpiry = now.getTime() + 90 * 24 * 60 * 60 * 1000;
    const weddingExpiry = project.startsAt.getTime() + 14 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Math.min(now.getTime() + 365 * 24 * 60 * 60 * 1000, Math.max(defaultExpiry, weddingExpiry)));
    const token = randomBytes(32).toString("base64url");
    await db.update(weddingGuests)
      .set({ rsvpTokenHash: hashWeddingToken(token), rsvpExpiresAt: expiresAt, updatedAt: now })
      .where(eq(weddingGuests.id, guestId));
    await logAudit({ actorId: user.id, action: "mariage_lien_rsvp_cree", entityType: "project", entityId: String(guest.projectId), metadata: { op: "creation" } });
    revalidateWedding(guest.projectId);
    return { ok: true, message: "Lien RSVP créé. Il ne donne accès qu'à la réponse de ce foyer ; copiez-le maintenant.", token, expiresAt: expiresAt.toISOString() };
  } catch (error) {
    return fail(error);
  }
}

export async function revokeWeddingRsvpLink(guestId: number): Promise<WeddingAccessResult> {
  try {
    const user = await requireRole(["membre"]);
    const [guest] = await db.select({ id: weddingGuests.id, projectId: weddingGuests.projectId }).from(weddingGuests).where(eq(weddingGuests.id, guestId)).limit(1);
    if (!guest) return { ok: false, error: "Foyer introuvable." };
    const project = await organizerWeddingProject(guest.projectId, user.id);
    if (!project) return { ok: false, error: "Projet de mariage introuvable ou réservé aux organisateurs." };
    await db.update(weddingGuests).set({ rsvpTokenHash: null, rsvpExpiresAt: null, updatedAt: new Date() }).where(eq(weddingGuests.id, guestId));
    await logAudit({ actorId: user.id, action: "mariage_lien_rsvp_revoque", entityType: "project", entityId: String(guest.projectId), metadata: { op: "revocation" } });
    revalidateWedding(guest.projectId);
    return { ok: true, message: "Lien RSVP révoqué." };
  } catch (error) {
    return fail(error);
  }
}

const RSVP_STATUSES = ["confirme", "peut_etre", "decline"] as const;
const INVALID_RSVP = "Ce lien n'est plus valide. Demandez un nouveau lien aux personnes qui organisent le mariage.";

/** Public action: changes only the single guest row tied to the unguessable token. */
export async function submitWeddingRsvp(_previous: RsvpActionState, formData: FormData): Promise<RsvpActionState> {
  const token = String(formData.get("token") ?? "");
  if (!isWeddingToken(token)) return { ok: false, message: INVALID_RSVP };
  try {
    const ip = await clientIp();
    if (hitRateLimit(`wedding-rsvp:${ip}`, 30, 15 * 60_000)) {
      return { ok: false, message: "Trop de tentatives. Réessayez dans quelques minutes." };
    }
    const tokenHash = hashWeddingToken(token);
    const [guest] = await db
      .select({ id: weddingGuests.id, projectId: weddingGuests.projectId, expiresAt: weddingGuests.rsvpExpiresAt })
      .from(weddingGuests)
      .where(eq(weddingGuests.rsvpTokenHash, tokenHash))
      .limit(1);
    if (!guest?.expiresAt || guest.expiresAt.getTime() <= Date.now()) return { ok: false, message: INVALID_RSVP };

    const [project] = await db.select({ status: projects.status }).from(projects).where(eq(projects.id, guest.projectId)).limit(1);
    if (!project || project.status !== "ouvert") return { ok: false, message: INVALID_RSVP };

    const status = String(formData.get("status") ?? "");
    const persons = Number(formData.get("persons"));
    if (!RSVP_STATUSES.includes(status as (typeof RSVP_STATUSES)[number])) {
      return { ok: false, message: "Choisissez une réponse parmi les options proposées." };
    }
    if (!Number.isInteger(persons) || persons < 1 || persons > 20) {
      return { ok: false, message: "Le nombre de personnes doit être compris entre 1 et 20." };
    }

    const detailed = formData.get("detailed") === "1";
    const details = detailed && status !== "decline" ? validateGuestReplyDetails({ adults: formData.get("adults"), children: formData.get("children"), ceremony: formData.get("ceremony") === "on", meal: formData.get("meal") === "on", nextDay: formData.get("nextDay") === "on" }, persons) : null;
    if (detailed && status !== "decline" && !details) return { ok: false, message: "Le total adultes + enfants doit correspondre au nombre de personnes de votre foyer." };
    await db.update(weddingGuests)
      .set({ replyDetails: details, status: status as (typeof weddingGuests.$inferInsert)["status"], ...(status === "decline" ? {} : { persons }), ...(status === "confirme" ? {} : { tableId: null }), updatedAt: new Date() })
      .where(and(eq(weddingGuests.id, guest.id), eq(weddingGuests.projectId, guest.projectId), eq(weddingGuests.rsvpTokenHash, tokenHash)));
    await logAudit({ actorId: null, action: "mariage_rsvp_reponse", entityType: "project", entityId: String(guest.projectId), metadata: { op: "reponse" } });
    revalidatePath("/rsvp/[token]", "page");
    revalidatePath(`/le-monde-aime/projets/${guest.projectId}`);
    return { ok: true, message: "Votre réponse est enregistrée. Vous pouvez revenir sur ce lien pour la modifier tant qu'il reste valide." };
  } catch {
    return { ok: false, message: "La réponse n'a pas pu être enregistrée. Réessayez dans quelques instants." };
  }
}

/** Accept explicitly via POST/form (not GET), then exchange the URL token for a revocable HttpOnly cookie. */
export async function acceptWeddingAccessLink(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  if (!isWeddingToken(token)) redirect("/");
  const invite = await getWeddingAccessInvite(token);
  if (!invite) redirect(`/invitation/mariage/${encodeURIComponent(token)}?expired=1`);

  const expiresIn = Math.max(1, Math.floor((invite.expiresAt.getTime() - Date.now()) / 1000));
  const signed = await new SignJWT({
    type: "wedding-access",
    linkId: invite.id,
    projectId: invite.projectId,
    role: invite.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(invite.expiresAt.getTime() / 1000))
    .sign(getAuthSecret());
  const store = await cookies();
  store.set(WEDDING_ACCESS_COOKIE, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/partage-mariage",
    maxAge: expiresIn,
  });
  redirect(`/partage-mariage/${invite.id}`);
}

export async function leaveWeddingAccess(): Promise<void> {
  const store = await cookies();
  store.set(WEDDING_ACCESS_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/partage-mariage",
    expires: new Date(0),
  });
  redirect("/");
}

/** Scoped collaborator mutation: schedule only, with no access to documents, chat, budget or personal spaces. */
export async function updateSharedWeddingProgram(linkId: number, items: Array<{ time: string; label: string }>): Promise<WeddingAccessResult> {
  try {
    const session = await getWeddingAccessSession(linkId);
    if (!session || session.role !== "coordination") return { ok: false, error: "Ce lien ne permet pas de modifier le programme, ou il a expiré." };
    if (!Array.isArray(items)) return { ok: false, error: "Programme invalide." };
    const clean = items.slice(0, 25).flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const time = String(item.time ?? "").trim().slice(0, 30);
      const label = String(item.label ?? "").trim().slice(0, 160);
      return label ? [{ time, label }] : [];
    });
    const [project] = await db.select({ status: projects.status }).from(projects).where(eq(projects.id, session.projectId)).limit(1);
    if (!project || project.status !== "ouvert") return { ok: false, error: "Ce projet n'est plus modifiable." };
    const [journey] = await db.select({ id: journeys.id }).from(journeys).where(and(eq(journeys.projectId, session.projectId), eq(journeys.situation, "mariage"))).limit(1);
    if (!journey) return { ok: false, error: "Projet de mariage introuvable." };
    await db.update(projects).set({ program: clean }).where(eq(projects.id, session.projectId));
    await logAudit({ actorId: null, action: "mariage_partage_programme", entityType: "project", entityId: String(session.projectId), metadata: { op: "programme", lien: String(linkId) } });
    revalidateWedding(session.projectId);
    revalidatePath(`/partage-mariage/${linkId}`);
    return { ok: true, message: "Programme enregistré." };
  } catch {
    return { ok: false, error: "Enregistrement du programme impossible." };
  }
}

/** Scoped collaborator mutation: RSVP status only, and only for a guest in this exact project. */
export async function updateSharedWeddingGuestStatus(linkId: number, guestId: number, status: string): Promise<WeddingAccessResult> {
  try {
    const session = await getWeddingAccessSession(linkId);
    if (!session || session.role !== "coordination") return { ok: false, error: "Ce lien ne permet pas de modifier les réponses, ou il a expiré." };
    if (!(status === "invite" || status === "confirme" || status === "peut_etre" || status === "decline")) {
      return { ok: false, error: "Réponse inconnue." };
    }
    const [project] = await db.select({ status: projects.status }).from(projects).where(eq(projects.id, session.projectId)).limit(1);
    if (!project || project.status !== "ouvert") return { ok: false, error: "Ce projet n'est plus modifiable." };
    const [journey] = await db.select({ id: journeys.id }).from(journeys).where(and(eq(journeys.projectId, session.projectId), eq(journeys.situation, "mariage"))).limit(1);
    if (!journey) return { ok: false, error: "Projet de mariage introuvable." };
    const [guest] = await db.select({ id: weddingGuests.id }).from(weddingGuests)
      .where(and(eq(weddingGuests.id, guestId), eq(weddingGuests.projectId, session.projectId)))
      .limit(1);
    if (!guest) return { ok: false, error: "Foyer introuvable dans ce projet." };
    await db.update(weddingGuests)
      .set({ status, ...(status === "confirme" ? {} : { tableId: null }), updatedAt: new Date() })
      .where(and(eq(weddingGuests.id, guestId), eq(weddingGuests.projectId, session.projectId)));
    await logAudit({ actorId: null, action: "mariage_partage_statut_invite", entityType: "project", entityId: String(session.projectId), metadata: { op: "statut", lien: String(linkId) } });
    revalidateWedding(session.projectId);
    revalidatePath(`/partage-mariage/${linkId}`);
    return { ok: true, message: "Réponse mise à jour." };
  } catch {
    return { ok: false, error: "Mise à jour de la réponse impossible." };
  }
}
