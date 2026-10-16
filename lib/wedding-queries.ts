import type { GuestInformation, GuestReplyDetails } from "@/lib/wedding-portal";
import { and, desc, eq, gt, isNotNull, isNull, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { artistEngagements, journeys, projectMembers, users, weddingAccessLinks, weddingBudgetItems, weddingGuests, weddingSettings, weddingTables, type WeddingAccessRole } from "@/db/schema";
import { computeBudgetStats, computeGuestStats, computeTableStats, parseEuroToCents, type BudgetStats, type GuestStats, type TableStats } from "@/lib/wedding";

export type WeddingWorkspace = {
  guestInformation: GuestInformation | null;
  journeyId: number;
  invitesEstimes: number;
  weddingDate: string;
  weddingLieu: string;
  envelopeCents: number | null;
  envelopeFromJourney: boolean;
  guests: Array<{ replyDetails: GuestReplyDetails | null; id: number; name: string; persons: number; groupe: string; status: string; note: string; thanked: boolean; tableId: number | null; rsvpExpiresAt: Date | null; rsvpLinkActive: boolean }>;
  tables: Array<{ id: number; name: string; capacity: number | null }>;
  budgetItems: Array<{ id: number; label: string; category: string; estimatedCents: number; actualCents: number | null; settled: boolean; note: string }>;
  guestStats: GuestStats;
  budgetStats: BudgetStats;
  tableStats: TableStats;
};

/** L'espace mariage d'un projet : présent seulement si le parcours « Nous nous marions » a créé ou choisi ce projet. */
export async function getWeddingWorkspace(projectId: number): Promise<WeddingWorkspace | null> {
  const [mj] = await db
    .select({ id: journeys.id, answers: journeys.answers, situation: journeys.situation })
    .from(journeys)
    .where(eq(journeys.projectId, projectId))
    .orderBy(desc(journeys.id))
    .limit(1);
  if (!mj || mj.situation !== "mariage") return null;

  const [settings] = await db.select().from(weddingSettings).where(eq(weddingSettings.projectId, projectId)).limit(1);
  const guestRows = await db.select({
    replyDetails: weddingGuests.replyDetails,
    id: weddingGuests.id,
    name: weddingGuests.name,
    persons: weddingGuests.persons,
    groupe: weddingGuests.groupe,
    status: weddingGuests.status,
    note: weddingGuests.note,
    thanked: weddingGuests.thanked,
    tableId: weddingGuests.tableId,
    rsvpExpiresAt: weddingGuests.rsvpExpiresAt,
  }).from(weddingGuests).where(eq(weddingGuests.projectId, projectId)).orderBy(weddingGuests.id);
  const tableRows = await db.select({ id: weddingTables.id, name: weddingTables.name, capacity: weddingTables.capacity }).from(weddingTables).where(eq(weddingTables.projectId, projectId)).orderBy(weddingTables.id);
  const itemRows = await db.select({ id: weddingBudgetItems.id, label: weddingBudgetItems.label, category: weddingBudgetItems.category, estimatedCents: weddingBudgetItems.estimatedCents, actualCents: weddingBudgetItems.actualCents, settled: weddingBudgetItems.settled, note: weddingBudgetItems.note }).from(weddingBudgetItems).where(eq(weddingBudgetItems.projectId, projectId)).orderBy(weddingBudgetItems.id);

  const fromJourney = parseEuroToCents(mj.answers.budget ?? "");
  const envelopeCents = settings ? settings.envelopeCents : fromJourney;
  const guests = guestRows.map((g) => ({
    replyDetails: g.replyDetails,
    id: g.id,
    name: g.name,
    persons: g.persons,
    groupe: g.groupe,
    status: g.status,
    note: g.note,
    thanked: g.thanked,
    tableId: g.tableId,
    rsvpExpiresAt: g.rsvpExpiresAt,
    rsvpLinkActive: Boolean(g.rsvpExpiresAt && g.rsvpExpiresAt.getTime() > Date.now()),
  }));
  const tables = tableRows.map((t) => ({ id: t.id, name: t.name, capacity: t.capacity }));
  const budgetItems = itemRows.map((i) => ({ id: i.id, label: i.label, category: i.category, estimatedCents: i.estimatedCents, actualCents: i.actualCents, settled: i.settled, note: i.note }));
  return {
    guestInformation: settings?.guestInformation ?? null,
    journeyId: mj.id,
    invitesEstimes: Number(mj.answers.invites ?? 0) || 0,
    weddingDate: mj.answers.date ?? "",
    weddingLieu: mj.answers.lieu ?? "",
    envelopeCents,
    envelopeFromJourney: !settings && fromJourney !== null,
    guests,
    tables,
    budgetItems,
    guestStats: computeGuestStats(guests),
    budgetStats: computeBudgetStats(budgetItems, envelopeCents),
    tableStats: computeTableStats(tables, guests),
  };
}

export type WeddingAccessLinkSummary = {
  id: number;
  label: string;
  role: WeddingAccessRole;
  expiresAt: Date;
  revokedAt: Date | null;
  active: boolean;
};

/** Only an accepted project organizer can list management metadata (never token hashes). */
export async function getWeddingAccessLinksForOrganizer(projectId: number, userId: number): Promise<WeddingAccessLinkSummary[]> {
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
  if (!member) return [];
  const selectLinkSummary = {
    id: weddingAccessLinks.id,
    label: weddingAccessLinks.label,
    role: weddingAccessLinks.role,
    expiresAt: weddingAccessLinks.expiresAt,
    revokedAt: weddingAccessLinks.revokedAt,
  };
  const now = new Date();
  const activeRows = await db
    .select(selectLinkSummary)
    .from(weddingAccessLinks)
    .where(and(eq(weddingAccessLinks.projectId, projectId), isNull(weddingAccessLinks.revokedAt), gt(weddingAccessLinks.expiresAt, now)))
    .orderBy(desc(weddingAccessLinks.createdAt));
  const inactiveRows = await db
    .select(selectLinkSummary)
    .from(weddingAccessLinks)
    .where(and(eq(weddingAccessLinks.projectId, projectId), or(isNotNull(weddingAccessLinks.revokedAt), lte(weddingAccessLinks.expiresAt, now))))
    .orderBy(desc(weddingAccessLinks.createdAt))
    .limit(25);
  return [
    ...activeRows.map((row) => ({ ...row, active: true })),
    ...inactiveRows.map((row) => ({ ...row, active: false })),
  ];
}

export type WeddingSharedWorkspace = {
  weddingDate: string;
  guests: Array<{ id: number; name: string; persons: number; status: string; tableId: number | null }>;
  tables: Array<{ id: number; name: string; capacity: number | null }>;
};

/** Minimal projection for passwordless collaborator pages; it never reads notes, budget or RSVP token hashes. */
export async function getWeddingSharedWorkspace(projectId: number): Promise<WeddingSharedWorkspace | null> {
  const [journey] = await db
    .select({ answers: journeys.answers })
    .from(journeys)
    .where(and(eq(journeys.projectId, projectId), eq(journeys.situation, "mariage")))
    .orderBy(desc(journeys.id))
    .limit(1);
  if (!journey) return null;
  const guests = await db
    .select({ id: weddingGuests.id, name: weddingGuests.name, persons: weddingGuests.persons, status: weddingGuests.status, tableId: weddingGuests.tableId })
    .from(weddingGuests)
    .where(eq(weddingGuests.projectId, projectId))
    .orderBy(weddingGuests.id);
  const tables = await db
    .select({ id: weddingTables.id, name: weddingTables.name, capacity: weddingTables.capacity })
    .from(weddingTables)
    .where(eq(weddingTables.projectId, projectId))
    .orderBy(weddingTables.id);
  return { weddingDate: journey.answers.date ?? "", guests, tables };
}

export type WeddingDayContacts = {
  organizers: string[];
  participants: number;
  engagements: Array<{ artistName: string; status: string }>;
};

const ENGAGED_STATES = ["devis_accepte", "contrat_signe_declare", "embauche_declaree"];

/** Contacts utiles de la page du jour J : organisateurs du projet et artistes dont l'engagement est confirmé. */
export async function getWeddingDayContacts(projectId: number, journeyId: number): Promise<WeddingDayContacts> {
  const memberRows = await db
    .select({ role: projectMembers.role, status: projectMembers.status, displayName: users.displayName, fullName: users.fullName })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.projectId, projectId));
  const accepted = memberRows.filter((m) => m.status === "accepte");
  const organizers = accepted.filter((m) => m.role === "organisateur").map((m) => m.displayName ?? m.fullName);
  const engRows = await db
    .select({ status: artistEngagements.status, displayName: users.displayName, fullName: users.fullName })
    .from(artistEngagements)
    .innerJoin(users, eq(artistEngagements.artistId, users.id))
    .where(eq(artistEngagements.journeyId, journeyId));
  return {
    organizers,
    participants: accepted.length,
    engagements: engRows
      .filter((e) => ENGAGED_STATES.includes(e.status))
      .map((e) => ({ artistName: e.displayName ?? e.fullName, status: e.status })),
  };
}
