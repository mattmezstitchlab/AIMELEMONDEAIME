"use server";

import { validateGuestInformation } from "@/lib/wedding-portal";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { journeys, projectMembers, projects, weddingBudgetItems, weddingGuests, weddingSettings, weddingTables } from "@/db/schema";
import { AuthError, requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import {
  GUEST_STATUS_VALUES,
  MAX_BUDGET_ITEMS,
  MAX_GUESTS,
  MAX_TABLES,
  parseEuroToCents,
  validateBudgetItemInput,
  validateGuestInput,
  validateTableInput,
} from "@/lib/wedding";

export type WeddingResult = { ok: true; message: string } | { ok: false; error: string };

const fail = (error: unknown, fallback: string): WeddingResult =>
  error instanceof AuthError ? { ok: false, error: "Connectez-vous avec un compte membre." } : { ok: false, error: fallback };

/**
 * Garde commune : membre organisateur d'un projet ouvert, né d'un parcours
 * mariage. Les noms d'invités et les montants ne sortent jamais d'ici :
 * ni dans l'audit, ni dans les messages d'erreur.
 */
async function weddingProject(projectId: number, userId: number) {
  const [project] = await db.select({ id: projects.id, status: projects.status }).from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) return null;
  const [member] = await db.select({ id: projectMembers.id }).from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId), eq(projectMembers.role, "organisateur"), eq(projectMembers.status, "accepte"))).limit(1);
  if (!member) return null;
  const [journey] = await db.select({ id: journeys.id }).from(journeys)
    .where(and(eq(journeys.projectId, projectId), eq(journeys.situation, "mariage"))).limit(1);
  if (!journey) return null;
  return project;
}

type Guard = { ok: true; project: { id: number; status: string } } | { ok: false; error: string };

async function editableProject(projectId: number, userId: number): Promise<Guard> {
  const project = await weddingProject(projectId, userId);
  if (!project) return { ok: false, error: "Projet de mariage introuvable, ou réservé à ses organisateurs." };
  if (project.status !== "ouvert") return { ok: false, error: "Ce projet n'est plus modifiable." };
  return { ok: true, project };
}

function refresh(projectId: number) {
  revalidatePath(`/le-monde-aime/projets/${projectId}`);
  revalidatePath("/le-monde-aime");
}

export async function addWeddingGuest(projectId: number, name: string, persons: number, groupe: string, note: string): Promise<WeddingResult> {
  try {
    const user = await requireRole(["membre"]);
    const guard = await editableProject(projectId, user.id);
    if (!guard.ok) return { ok: false, error: guard.error };
    const v = validateGuestInput({ name, persons, groupe, note });
    if (!v.ok) return v;
    const existing = await db.select({ id: weddingGuests.id }).from(weddingGuests).where(eq(weddingGuests.projectId, projectId));
    if (existing.length >= MAX_GUESTS) return { ok: false, error: `${MAX_GUESTS} foyers maximum sur la liste.` };
    await db.insert(weddingGuests).values({ projectId, name: v.name, persons: v.persons, groupe: v.groupe, note: v.note });
    await logAudit({ actorId: user.id, action: "mariage_invite_ajout", entityType: "project", entityId: String(projectId), metadata: { op: "ajout" } });
    refresh(projectId);
    return { ok: true, message: "Foyer ajouté à la liste. Pensez à noter l'envoi de l'invitation quand il partira." };
  } catch (error) {
    return fail(error, "Ajout impossible.");
  }
}

export async function updateWeddingGuest(guestId: number, name: string, persons: number, groupe: string, note: string): Promise<WeddingResult> {
  try {
    const user = await requireRole(["membre"]);
    const [guest] = await db.select().from(weddingGuests).where(eq(weddingGuests.id, guestId)).limit(1);
    if (!guest) return { ok: false, error: "Invité introuvable." };
    const guard = await editableProject(guest.projectId, user.id);
    if (!guard.ok) return { ok: false, error: guard.error };
    const v = validateGuestInput({ name, persons, groupe, note });
    if (!v.ok) return v;
    await db.update(weddingGuests).set({ ...(guest.persons !== v.persons ? { replyDetails: null } : {}), name: v.name, persons: v.persons, groupe: v.groupe, note: v.note, updatedAt: new Date() }).where(eq(weddingGuests.id, guestId));
    refresh(guest.projectId);
    return { ok: true, message: "Foyer mis à jour." };
  } catch (error) {
    return fail(error, "Mise à jour impossible.");
  }
}

export async function setWeddingGuestStatus(guestId: number, status: string): Promise<WeddingResult> {
  try {
    const user = await requireRole(["membre"]);
    if (!GUEST_STATUS_VALUES.includes(status)) return { ok: false, error: "Réponse inconnue." };
    const [guest] = await db.select().from(weddingGuests).where(eq(weddingGuests.id, guestId)).limit(1);
    if (!guest) return { ok: false, error: "Invité introuvable." };
    const guard = await editableProject(guest.projectId, user.id);
    if (!guard.ok) return { ok: false, error: guard.error };
    await db.update(weddingGuests)
      .set({ status: status as typeof guest.status, ...(status === "confirme" ? {} : { tableId: null }), updatedAt: new Date() })
      .where(eq(weddingGuests.id, guestId));
    await logAudit({ actorId: user.id, action: "mariage_invite_statut", entityType: "project", entityId: String(guest.projectId), metadata: { op: "statut" } });
    refresh(guest.projectId);
    return { ok: true, message: "Réponse notée. Le compteur des convives confirmés est à jour." };
  } catch (error) {
    return fail(error, "Mise à jour impossible.");
  }
}

export async function removeWeddingGuest(guestId: number): Promise<WeddingResult> {
  try {
    const user = await requireRole(["membre"]);
    const [guest] = await db.select().from(weddingGuests).where(eq(weddingGuests.id, guestId)).limit(1);
    if (!guest) return { ok: false, error: "Invité introuvable." };
    const guard = await editableProject(guest.projectId, user.id);
    if (!guard.ok) return { ok: false, error: guard.error };
    await db.delete(weddingGuests).where(eq(weddingGuests.id, guestId));
    refresh(guest.projectId);
    return { ok: true, message: "Foyer retiré de la liste." };
  } catch (error) {
    return fail(error, "Retrait impossible.");
  }
}

export async function addWeddingBudgetItem(projectId: number, label: string, category: string, estimatedRaw: string, note: string): Promise<WeddingResult> {
  try {
    const user = await requireRole(["membre"]);
    const guard = await editableProject(projectId, user.id);
    if (!guard.ok) return { ok: false, error: guard.error };
    const v = validateBudgetItemInput({ label, category, estimatedRaw, note });
    if (!v.ok) return v;
    const existing = await db.select({ id: weddingBudgetItems.id }).from(weddingBudgetItems).where(eq(weddingBudgetItems.projectId, projectId));
    if (existing.length >= MAX_BUDGET_ITEMS) return { ok: false, error: `${MAX_BUDGET_ITEMS} postes maximum dans le budget.` };
    await db.insert(weddingBudgetItems).values({ projectId, label: v.label, category: v.category, estimatedCents: v.estimatedCents, note: v.note });
    await logAudit({ actorId: user.id, action: "mariage_budget_ajout", entityType: "project", entityId: String(projectId), metadata: { op: "ajout" } });
    refresh(projectId);
    return { ok: true, message: "Poste ajouté au budget prévisionnel." };
  } catch (error) {
    return fail(error, "Ajout impossible.");
  }
}

/** Note le montant confirmé d'un devis (vide = pas encore connu) et s'il est réglé. Aucun paiement ne passe par AIME®. */
export async function setWeddingBudgetActual(itemId: number, actualRaw: string, settled: boolean): Promise<WeddingResult> {
  try {
    const user = await requireRole(["membre"]);
    const [item] = await db.select().from(weddingBudgetItems).where(eq(weddingBudgetItems.id, itemId)).limit(1);
    if (!item) return { ok: false, error: "Poste introuvable." };
    const guard = await editableProject(item.projectId, user.id);
    if (!guard.ok) return { ok: false, error: guard.error };
    const raw = String(actualRaw ?? "").trim();
    const actualCents = raw === "" ? null : parseEuroToCents(raw);
    if (raw !== "" && actualCents === null) return { ok: false, error: "Montant illisible : écrivez par exemple 1 200 ou 1 200,50." };
    await db.update(weddingBudgetItems)
      .set({ actualCents, settled: actualCents !== null && settled, updatedAt: new Date() })
      .where(eq(weddingBudgetItems.id, itemId));
    refresh(item.projectId);
    return { ok: true, message: actualCents === null ? "Montant confirmé effacé." : "Montant du devis noté." };
  } catch (error) {
    return fail(error, "Mise à jour impossible.");
  }
}

export async function removeWeddingBudgetItem(itemId: number): Promise<WeddingResult> {
  try {
    const user = await requireRole(["membre"]);
    const [item] = await db.select().from(weddingBudgetItems).where(eq(weddingBudgetItems.id, itemId)).limit(1);
    if (!item) return { ok: false, error: "Poste introuvable." };
    const guard = await editableProject(item.projectId, user.id);
    if (!guard.ok) return { ok: false, error: guard.error };
    await db.delete(weddingBudgetItems).where(eq(weddingBudgetItems.id, itemId));
    refresh(item.projectId);
    return { ok: true, message: "Poste retiré du budget." };
  } catch (error) {
    return fail(error, "Retrait impossible.");
  }
}

export async function setWeddingEnvelope(projectId: number, raw: string): Promise<WeddingResult> {
  try {
    const user = await requireRole(["membre"]);
    const guard = await editableProject(projectId, user.id);
    if (!guard.ok) return { ok: false, error: guard.error };
    const clean = String(raw ?? "").trim();
    const envelopeCents = clean === "" ? null : parseEuroToCents(clean);
    if (clean !== "" && envelopeCents === null) return { ok: false, error: "Enveloppe illisible : écrivez par exemple 12 000." };
    await db.insert(weddingSettings)
      .values({ projectId, envelopeCents })
      .onConflictDoUpdate({ target: weddingSettings.projectId, set: { envelopeCents, updatedAt: new Date() } });
    await logAudit({ actorId: user.id, action: "mariage_enveloppe", entityType: "project", entityId: String(projectId), metadata: { op: "enveloppe" } });
    refresh(projectId);
    return { ok: true, message: envelopeCents === null ? "Enveloppe retirée." : "Enveloppe enregistrée : l'écart se lit en direct sous le budget." };
  } catch (error) {
    return fail(error, "Enregistrement impossible.");
  }
}

export async function createWeddingTable(projectId: number, name: string, capacityRaw: string): Promise<WeddingResult> {
  try {
    const user = await requireRole(["membre"]);
    const guard = await editableProject(projectId, user.id);
    if (!guard.ok) return { ok: false, error: guard.error };
    const v = validateTableInput({ name, capacityRaw });
    if (!v.ok) return v;
    const existing = await db.select({ id: weddingTables.id }).from(weddingTables).where(eq(weddingTables.projectId, projectId));
    if (existing.length >= MAX_TABLES) return { ok: false, error: `${MAX_TABLES} tables maximum dans le plan.` };
    await db.insert(weddingTables).values({ projectId, name: v.name, capacity: v.capacity });
    await logAudit({ actorId: user.id, action: "mariage_table_creation", entityType: "project", entityId: String(projectId), metadata: { op: "creation" } });
    refresh(projectId);
    return { ok: true, message: "Table créée : placez-y les foyers confirmés." };
  } catch (error) {
    return fail(error, "Création impossible.");
  }
}

export async function updateWeddingTable(tableId: number, name: string, capacityRaw: string): Promise<WeddingResult> {
  try {
    const user = await requireRole(["membre"]);
    const [table] = await db.select().from(weddingTables).where(eq(weddingTables.id, tableId)).limit(1);
    if (!table) return { ok: false, error: "Table introuvable." };
    const guard = await editableProject(table.projectId, user.id);
    if (!guard.ok) return { ok: false, error: guard.error };
    const v = validateTableInput({ name, capacityRaw });
    if (!v.ok) return v;
    await db.update(weddingTables).set({ name: v.name, capacity: v.capacity, updatedAt: new Date() }).where(eq(weddingTables.id, tableId));
    refresh(table.projectId);
    return { ok: true, message: "Table mise à jour." };
  } catch (error) {
    return fail(error, "Mise à jour impossible.");
  }
}

export async function deleteWeddingTable(tableId: number): Promise<WeddingResult> {
  try {
    const user = await requireRole(["membre"]);
    const [table] = await db.select().from(weddingTables).where(eq(weddingTables.id, tableId)).limit(1);
    if (!table) return { ok: false, error: "Table introuvable." };
    const guard = await editableProject(table.projectId, user.id);
    if (!guard.ok) return { ok: false, error: guard.error };
    await db.delete(weddingTables).where(eq(weddingTables.id, tableId));
    await logAudit({ actorId: user.id, action: "mariage_table_suppression", entityType: "project", entityId: String(table.projectId), metadata: { op: "suppression" } });
    refresh(table.projectId);
    return { ok: true, message: "Table supprimée : ses foyers redeviennent « à placer », ils ne sont pas perdus." };
  } catch (error) {
    return fail(error, "Suppression impossible.");
  }
}

/** Place (ou retire) un foyer confirmé à une table du même projet. */
export async function assignWeddingGuestTable(guestId: number, tableId: number | null): Promise<WeddingResult> {
  try {
    const user = await requireRole(["membre"]);
    const [guest] = await db.select().from(weddingGuests).where(eq(weddingGuests.id, guestId)).limit(1);
    if (!guest) return { ok: false, error: "Invité introuvable." };
    const guard = await editableProject(guest.projectId, user.id);
    if (!guard.ok) return { ok: false, error: guard.error };
    if (tableId !== null) {
      if (guest.status !== "confirme") return { ok: false, error: "Seuls les foyers confirmés prennent place au plan de table." };
      const [table] = await db.select().from(weddingTables).where(eq(weddingTables.id, tableId)).limit(1);
      if (!table || table.projectId !== guest.projectId) return { ok: false, error: "Table introuvable dans ce projet." };
    }
    await db.update(weddingGuests).set({ tableId, updatedAt: new Date() }).where(eq(weddingGuests.id, guestId));
    await logAudit({ actorId: user.id, action: "mariage_place_assignation", entityType: "project", entityId: String(guest.projectId), metadata: { op: tableId === null ? "retrait" : "placement" } });
    refresh(guest.projectId);
    return { ok: true, message: tableId === null ? "Foyer retiré de sa table." : "Foyer placé." };
  } catch (error) {
    return fail(error, "Placement impossible.");
  }
}

/** Coche (ou décoche) le remerciement d'un foyer confirmé, après le mariage. Suivi personnel, aucun envoi. */
export async function setWeddingGuestThanked(guestId: number, thanked: boolean): Promise<WeddingResult> {
  try {
    const user = await requireRole(["membre"]);
    const [guest] = await db.select().from(weddingGuests).where(eq(weddingGuests.id, guestId)).limit(1);
    if (!guest) return { ok: false, error: "Invité introuvable." };
    const guard = await editableProject(guest.projectId, user.id);
    if (!guard.ok) return { ok: false, error: guard.error };
    await db.update(weddingGuests).set({ thanked, updatedAt: new Date() }).where(eq(weddingGuests.id, guestId));
    await logAudit({ actorId: user.id, action: "mariage_remerciement", entityType: "project", entityId: String(guest.projectId), metadata: { op: thanked ? "coche" : "decoche" } });
    refresh(guest.projectId);
    return { ok: true, message: thanked ? "Remerciement noté. Plus que quelques-uns !" : "Remerciement décoché." };
  } catch (error) {
    return fail(error, "Mise à jour impossible.");
  }
}


/** Seuls les organisateurs choisissent ce qui sera partagé avec les liens RSVP. */
export async function saveGuestInformation(projectId: number, raw: Record<string, unknown>): Promise<WeddingResult> {
  try {
    const user = await requireRole(["membre"]);
    const guard = await editableProject(projectId, user.id);
    if (!guard.ok) return { ok: false, error: guard.error };
    const information = validateGuestInformation(raw);
    if (!information) return { ok: false, error: "Informations invalides (1 200 caractères maximum par rubrique)." };
    const [journey] = await db.select({ answers: journeys.answers }).from(journeys)
      .where(and(eq(journeys.projectId, projectId), eq(journeys.situation, "mariage"))).limit(1);
    await db.insert(weddingSettings).values({ projectId, guestInformation: information, envelopeCents: parseEuroToCents(journey?.answers.budget ?? "") })
      .onConflictDoUpdate({ target: weddingSettings.projectId, set: { guestInformation: information, updatedAt: new Date() } });
    await logAudit({ actorId: user.id, action: "mariage_informations_invites", entityType: "project", entityId: String(projectId), metadata: { publie: information.published ? "oui" : "non" } });
    refresh(projectId);
    revalidatePath("/rsvp/[token]", "page");
    return { ok: true, message: information.published ? "Informations partagées avec les liens RSVP valides. Aucun message envoyé." : "Informations enregistrées en brouillon, non partagées." };
  } catch (error) { return fail(error, "Enregistrement impossible."); }
}
