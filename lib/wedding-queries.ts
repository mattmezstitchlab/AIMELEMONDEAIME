import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { journeys, weddingBudgetItems, weddingGuests, weddingSettings, weddingTables } from "@/db/schema";
import { computeBudgetStats, computeGuestStats, computeTableStats, parseEuroToCents, type BudgetStats, type GuestStats, type TableStats } from "@/lib/wedding";

export type WeddingWorkspace = {
  journeyId: number;
  invitesEstimes: number;
  weddingDate: string;
  weddingLieu: string;
  envelopeCents: number | null;
  envelopeFromJourney: boolean;
  guests: Array<{ id: number; name: string; persons: number; groupe: string; status: string; note: string; tableId: number | null }>;
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
  const guestRows = await db.select().from(weddingGuests).where(eq(weddingGuests.projectId, projectId)).orderBy(weddingGuests.id);
  const tableRows = await db.select().from(weddingTables).where(eq(weddingTables.projectId, projectId)).orderBy(weddingTables.id);
  const itemRows = await db.select().from(weddingBudgetItems).where(eq(weddingBudgetItems.projectId, projectId)).orderBy(weddingBudgetItems.id);

  const fromJourney = parseEuroToCents(mj.answers.budget ?? "");
  const envelopeCents = settings ? settings.envelopeCents : fromJourney;
  const guests = guestRows.map((g) => ({ id: g.id, name: g.name, persons: g.persons, groupe: g.groupe, status: g.status, note: g.note, tableId: g.tableId }));
  const tables = tableRows.map((t) => ({ id: t.id, name: t.name, capacity: t.capacity }));
  const budgetItems = itemRows.map((i) => ({ id: i.id, label: i.label, category: i.category, estimatedCents: i.estimatedCents, actualCents: i.actualCents, settled: i.settled, note: i.note }));
  return {
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
