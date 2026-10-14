"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  communityEventPlans,
  communityRequests,
  projectDocuments,
  projectMembers,
  projectMessages,
  projectNeeds,
  projects,
  universeEnum,
} from "@/db/schema";
import { AuthError, requireRole } from "@/lib/auth";
import { createNotification } from "@/lib/queries";
import { logAudit } from "@/lib/audit";
import { DOCUMENT_TYPES, readUpload } from "@/lib/uploads";
import { LISTING_CATEGORIES } from "@/lib/lma";
import { communeLabel, pointFromCommune } from "@/lib/point";

export type ProjectResult = { ok: true; message: string; id?: number } | { ok: false; error: string };

const PATH = "/le-monde-aime";
const NEED_CATEGORIES = [...LISTING_CATEGORIES.map((c) => c.value), "trajets_livraisons"];

function str(form: FormData, key: string) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}
function num(form: FormData, key: string) {
  const n = Number(str(form, key).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}
function inFrance(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= 41 && lat <= 51.5 && lng >= -5.5 && lng <= 9.8;
}
const round2 = (v: number) => Number(v.toFixed(2)).toFixed(2);
const fail = (error: unknown, fallback: string): ProjectResult =>
  error instanceof AuthError ? { ok: false, error: "Connectez-vous avec un compte membre." } : { ok: false, error: fallback };

async function organizerRow(projectId: number, userId: number) {
  const [row] = await db.select().from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId), eq(projectMembers.role, "organisateur"), eq(projectMembers.status, "accepte"))).limit(1);
  return row ?? null;
}
async function acceptedRow(projectId: number, userId: number) {
  const [row] = await db.select().from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId), eq(projectMembers.status, "accepte"))).limit(1);
  return row ?? null;
}

export async function createProject(form: FormData): Promise<ProjectResult> {
  try {
    const user = await requireRole(["membre"]);
    const title = str(form, "title");
    const intention = str(form, "intention").slice(0, 800);
    const city = str(form, "city");
    const postalCode = str(form, "postalCode");
    const explicitLat = num(form, "lat");
    const explicitLng = num(form, "lng");
    const resolved = inFrance(explicitLat, explicitLng)
      ? { lat: explicitLat, lng: explicitLng }
      : pointFromCommune(city, postalCode);
    const startsAt = new Date(str(form, "startsAt"));
    const endsRaw = str(form, "endsAt");
    const endsAt = endsRaw ? new Date(endsRaw) : null;
    const universes = form.getAll("universes").map(String).filter((u) => (universeEnum as readonly string[]).includes(u));
    if (title.length < 4 || title.length > 140) return { ok: false, error: "Le titre du projet doit contenir entre 4 et 140 caractères." };
    if (intention.length < 10) return { ok: false, error: "Décrivez en quelques mots l'intention du projet." };
    if (city.length < 2) return { ok: false, error: "Indiquez la commune." };
    if (!resolved) return { ok: false, error: "Indiquez la commune et un code postal de France métropolitaine (01000 à 95999)." };
    if (Number.isNaN(startsAt.getTime())) return { ok: false, error: "Indiquez la date de début." };
    if (endsAt && (Number.isNaN(endsAt.getTime()) || endsAt < startsAt)) return { ok: false, error: "La date de fin doit suivre la date de début." };
    const created = await db.transaction(async (tx) => {
      const [project] = await tx.insert(projects).values({
        ownerId: user.id, title, intention, city: communeLabel(city, postalCode), lat: round2(resolved.lat), lng: round2(resolved.lng), startsAt, endsAt,
        universes: universes.length ? universes : ["terre"],
      }).returning({ id: projects.id });
      await tx.insert(projectMembers).values({ projectId: project.id, userId: user.id, role: "organisateur", status: "accepte" });
      return project;
    });
    await logAudit({ actorId: user.id, action: "creation_projet", entityType: "project", entityId: String(created.id) });
    revalidatePath(PATH);
    return { ok: true, message: "Projet créé. Ajoutez maintenant vos besoins.", id: created.id };
  } catch (error) {
    return fail(error, "Le projet n'a pas pu être créé.");
  }
}

/** Transforme une ancienne liste « Préparer mon événement » en projet, sans supprimer la liste. */
export async function createProjectFromEventPlan(planId: number): Promise<ProjectResult> {
  try {
    const user = await requireRole(["membre"]);
    const [plan] = await db.select().from(communityEventPlans).where(and(eq(communityEventPlans.id, planId), eq(communityEventPlans.ownerId, user.id))).limit(1);
    if (!plan) return { ok: false, error: "Liste introuvable." };
    const created = await db.transaction(async (tx) => {
      const [project] = await tx.insert(projects).values({
        ownerId: user.id, title: plan.title.replace(/^Exemple fictif · /, ""), intention: `Projet issu de la préparation « ${plan.title} » (${plan.participants} participants attendus).`,
        city: plan.city, lat: plan.lat, lng: plan.lng, startsAt: plan.eventDate, universes: ["terre"],
      }).returning({ id: projects.id });
      await tx.insert(projectMembers).values({ projectId: project.id, userId: user.id, role: "organisateur", status: "accepte" });
      if (plan.needs.length) await tx.insert(projectNeeds).values(plan.needs.slice(0, 30).map((n) => ({ projectId: project.id, text: n.text.slice(0, 160), quantity: n.quantity, category: NEED_CATEGORIES.includes(n.category) ? n.category : "objets_materiel" })));
      return project;
    });
    revalidatePath(PATH);
    return { ok: true, message: "Projet créé à partir de votre liste.", id: created.id };
  } catch (error) {
    return fail(error, "La transformation a échoué.");
  }
}

export async function addProjectNeed(projectId: number, text: string, quantity: number, category: string): Promise<ProjectResult> {
  try {
    const user = await requireRole(["membre"]);
    if (!(await organizerRow(projectId, user.id))) return { ok: false, error: "Réservé aux organisateurs du projet." };
    const clean = text.trim();
    if (clean.length < 2 || clean.length > 160) return { ok: false, error: "Décrivez le besoin en quelques mots." };
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) return { ok: false, error: "Quantité entre 1 et 999." };
    if (!NEED_CATEGORIES.includes(category)) return { ok: false, error: "Catégorie invalide." };
    const existing = await db.select({ id: projectNeeds.id }).from(projectNeeds).where(eq(projectNeeds.projectId, projectId));
    if (existing.length >= 30) return { ok: false, error: "30 besoins maximum par projet." };
    await db.insert(projectNeeds).values({ projectId, text: clean, quantity, category });
    revalidatePath(PATH);
    return { ok: true, message: "Besoin ajouté : il apparaît comme « Recherché »." };
  } catch (error) {
    return fail(error, "Ajout impossible.");
  }
}

export async function removeProjectNeed(needId: number): Promise<ProjectResult> {
  try {
    const user = await requireRole(["membre"]);
    const [need] = await db.select().from(projectNeeds).where(eq(projectNeeds.id, needId)).limit(1);
    if (!need || !(await organizerRow(need.projectId, user.id))) return { ok: false, error: "Besoin introuvable." };
    if (need.requestId) {
      const [req] = await db.select({ status: communityRequests.status }).from(communityRequests).where(eq(communityRequests.id, need.requestId)).limit(1);
      if (req && !["refusee", "annulee"].includes(req.status)) return { ok: false, error: "Une contribution est en cours : annulez-la avant de retirer ce besoin." };
    }
    await db.delete(projectNeeds).where(eq(projectNeeds.id, needId));
    revalidatePath(PATH);
    return { ok: true, message: "Besoin retiré." };
  } catch (error) {
    return fail(error, "Suppression impossible.");
  }
}

export async function requestToJoinProject(projectId: number): Promise<ProjectResult> {
  try {
    const user = await requireRole(["membre"]);
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!project || project.status !== "ouvert") return { ok: false, error: "Ce projet n'accepte plus de participants." };
    const [existing] = await db.select().from(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, user.id))).limit(1);
    if (existing) return { ok: false, error: existing.status === "accepte" ? "Vous participez déjà à ce projet." : "Votre demande est déjà enregistrée." };
    await db.insert(projectMembers).values({ projectId, userId: user.id, role: "participant", status: "demande" });
    const organizers = await db.select({ userId: projectMembers.userId }).from(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.role, "organisateur"), eq(projectMembers.status, "accepte")));
    for (const o of organizers) await createNotification({ userId: o.userId, title: "Demande de participation", body: `${user.displayName ?? user.fullName} souhaite participer à « ${project.title} ».`, link: `/le-monde-aime/projets/${projectId}` });
    revalidatePath(PATH);
    return { ok: true, message: "Demande envoyée. Les organisateurs doivent l'accepter." };
  } catch (error) {
    return fail(error, "Demande impossible.");
  }
}

export async function decideProjectMember(projectId: number, userId: number, accept: boolean): Promise<ProjectResult> {
  try {
    const user = await requireRole(["membre"]);
    if (!(await organizerRow(projectId, user.id))) return { ok: false, error: "Réservé aux organisateurs du projet." };
    const [member] = await db.select().from(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId))).limit(1);
    if (!member || member.status !== "demande") return { ok: false, error: "Demande déjà traitée." };
    await db.update(projectMembers).set({ status: accept ? "accepte" : "refuse" }).where(eq(projectMembers.id, member.id));
    await createNotification({ userId, title: accept ? "Participation acceptée" : "Participation non retenue", body: accept ? "Vous pouvez désormais suivre le projet et ses échanges." : "Les organisateurs n'ont pas pu retenir votre demande.", link: `/le-monde-aime/projets/${projectId}` });
    revalidatePath(PATH);
    return { ok: true, message: accept ? "Participant accepté." : "Demande refusée." };
  } catch (error) {
    return fail(error, "Décision impossible.");
  }
}

export async function saveProjectProgram(projectId: number, items: Array<{ time: string; label: string }>): Promise<ProjectResult> {
  try {
    const user = await requireRole(["membre"]);
    if (!(await organizerRow(projectId, user.id))) return { ok: false, error: "Réservé aux organisateurs du projet." };
    const clean = items.map((i) => ({ time: String(i.time ?? "").trim().slice(0, 30), label: String(i.label ?? "").trim().slice(0, 160) })).filter((i) => i.label).slice(0, 25);
    await db.update(projects).set({ program: clean }).where(eq(projects.id, projectId));
    revalidatePath(PATH);
    return { ok: true, message: "Programme enregistré." };
  } catch (error) {
    return fail(error, "Enregistrement impossible.");
  }
}

export async function postProjectMessage(projectId: number, bodyRaw: string): Promise<ProjectResult> {
  try {
    const user = await requireRole(["membre"]);
    const body = bodyRaw.trim();
    if (body.length < 2 || body.length > 1200) return { ok: false, error: "Le message doit contenir entre 2 et 1 200 caractères." };
    if (!(await acceptedRow(projectId, user.id))) return { ok: false, error: "Réservé aux participants acceptés." };
    await db.insert(projectMessages).values({ projectId, senderId: user.id, body });
    revalidatePath(PATH);
    return { ok: true, message: "Message envoyé." };
  } catch (error) {
    return fail(error, "Message non envoyé.");
  }
}

export async function uploadProjectDocument(form: FormData): Promise<ProjectResult> {
  try {
    const user = await requireRole(["membre"]);
    const projectId = Number(str(form, "projectId"));
    const access = str(form, "access") === "organisateurs" ? "organisateurs" : "membres";
    if (!(await acceptedRow(projectId, user.id))) return { ok: false, error: "Réservé aux participants acceptés." };
    const upload = await readUpload(form, "file", DOCUMENT_TYPES, 3_000_000);
    if (!upload) return { ok: false, error: "Choisissez un fichier." };
    if (!upload.ok) return upload;
    await db.insert(projectDocuments).values({ projectId, uploaderId: user.id, filename: upload.name, mime: upload.mime, sizeBytes: upload.size, content: upload.data, access });
    await logAudit({ actorId: user.id, action: "document_projet", entityType: "project", entityId: String(projectId) });
    revalidatePath(PATH);
    return { ok: true, message: access === "organisateurs" ? "Document ajouté (visible des organisateurs)." : "Document ajouté (visible des participants)." };
  } catch (error) {
    return fail(error, "Dépôt impossible.");
  }
}

export async function setProjectStatus(projectId: number, status: "ouvert" | "termine" | "annule"): Promise<ProjectResult> {
  try {
    const user = await requireRole(["membre"]);
    if (!["ouvert", "termine", "annule"].includes(status)) return { ok: false, error: "Statut invalide." };
    if (!(await organizerRow(projectId, user.id))) return { ok: false, error: "Réservé aux organisateurs du projet." };
    const [project] = await db.select({ status: projects.status }).from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!project || project.status === "suspendu") return { ok: false, error: "Ce projet est suspendu par la modération." };
    await db.update(projects).set({ status }).where(eq(projects.id, projectId));
    revalidatePath(PATH);
    return { ok: true, message: "Statut du projet mis à jour." };
  } catch (error) {
    return fail(error, "Mise à jour impossible.");
  }
}
