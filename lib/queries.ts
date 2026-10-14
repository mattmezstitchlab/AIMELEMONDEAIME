import "server-only";
import { db } from "@/db";
import { cases, caseEvents, journeys, offices, procedureTypes, users, appointments, payments, documents, messages, notifications, localPoints, localProducts, localOrders, workerAvailabilities } from "@/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";

export async function getOfficeById(officeId: number | null) {
  if (!officeId) return null;
  const [office] = await db.select().from(offices).where(eq(offices.id, officeId)).limit(1);
  return office ?? null;
}

export async function getMemberCases(memberId: number) {
  return db
    .select({
      id: cases.id,
      reference: cases.reference,
      title: cases.title,
      status: cases.status,
      createdAt: cases.createdAt,
      updatedAt: cases.updatedAt,
      submittedAt: cases.submittedAt,
      requestedDocuments: cases.requestedDocuments,
      procedureCategory: procedureTypes.category,
      assignedCaseworkerId: cases.assignedCaseworkerId,
      journeyId: cases.journeyId,
      journeyTitle: journeys.title,
    })
    .from(cases)
    .innerJoin(procedureTypes, eq(cases.procedureTypeId, procedureTypes.id))
    .leftJoin(journeys, eq(cases.journeyId, journeys.id))
    .where(eq(cases.memberId, memberId))
    .orderBy(desc(cases.updatedAt));
}

export async function getCaseDetail(caseId: number) {
  const [item] = await db
    .select()
    .from(cases)
    .where(eq(cases.id, caseId))
    .limit(1);
  if (!item) return null;
  const [procedureType] = await db.select().from(procedureTypes).where(eq(procedureTypes.id, item.procedureTypeId)).limit(1);
  const events = await db
    .select()
    .from(caseEvents)
    .where(eq(caseEvents.caseId, caseId))
    .orderBy(caseEvents.createdAt);
  const eventActorIds = Array.from(new Set(events.map((e) => e.actorId).filter((x): x is number => !!x)));
  const actors = eventActorIds.length
    ? await db.select().from(users).where(inArray(users.id, eventActorIds))
    : [];
  const actorMap = new Map(actors.map((a) => [a.id, a]));
  const caseDocuments = await db.select().from(documents).where(eq(documents.caseId, caseId));
  const member = (await db.select().from(users).where(eq(users.id, item.memberId)).limit(1))[0];
  const caseworker = item.assignedCaseworkerId
    ? (await db.select().from(users).where(eq(users.id, item.assignedCaseworkerId)).limit(1))[0]
    : null;
  const journey = item.journeyId
    ? (await db.select({ id: journeys.id, title: journeys.title, situation: journeys.situation }).from(journeys).where(eq(journeys.id, item.journeyId)).limit(1))[0] ?? null
    : null;

  return { item, procedureType, events, actorMap, caseDocuments, member, caseworker, journey };
}

export async function getRecentActivityForMember(memberId: number, limit = 6) {
  const memberCases = await db.select({ id: cases.id, reference: cases.reference }).from(cases).where(eq(cases.memberId, memberId));
  if (memberCases.length === 0) return [];
  const caseIds = memberCases.map((c) => c.id);
  const refMap = new Map(memberCases.map((c) => [c.id, c.reference]));
  const events = await db
    .select()
    .from(caseEvents)
    .where(inArray(caseEvents.caseId, caseIds))
    .orderBy(desc(caseEvents.createdAt))
    .limit(limit);
  return events.map((e) => ({ ...e, reference: refMap.get(e.caseId) }));
}

export async function getUpcomingAppointments(memberId: number) {
  return db
    .select()
    .from(appointments)
    .where(eq(appointments.memberId, memberId))
    .orderBy(appointments.requestedSlot);
}

export async function getMemberPayments(memberId: number) {
  return db.select().from(payments).where(eq(payments.memberId, memberId)).orderBy(desc(payments.date));
}

export async function getMemberDocuments(memberId: number) {
  return db.select().from(documents).where(eq(documents.ownerId, memberId)).orderBy(desc(documents.createdAt));
}

export async function getMemberMessages(memberId: number) {
  return db.select().from(messages).where(eq(messages.senderId, memberId));
}

export async function getUnreadNotifications(userId: number) {
  return db.select().from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

export async function createNotification(input: { userId: number; title: string; body: string; link?: string }) {
  await db.insert(notifications).values(input);
}

export async function getAllNotifications(userId: number) {
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

export async function getActiveProcedureTypes() {
  return db.select().from(procedureTypes).where(eq(procedureTypes.isActive, true));
}

export async function getOfficeCases(officeId: number | null, filters?: { status?: string; assignedToMe?: number }) {
  const conditions = [];
  if (officeId) conditions.push(eq(cases.officeId, officeId));
  if (filters?.status) conditions.push(eq(cases.status, filters.status as never));
  if (filters?.assignedToMe) conditions.push(eq(cases.assignedCaseworkerId, filters.assignedToMe));

  const base = db
    .select({
      id: cases.id,
      reference: cases.reference,
      title: cases.title,
      status: cases.status,
      createdAt: cases.createdAt,
      updatedAt: cases.updatedAt,
      memberId: cases.memberId,
      memberName: users.fullName,
      assignedCaseworkerId: cases.assignedCaseworkerId,
      officeId: cases.officeId,
      requestedDocuments: cases.requestedDocuments,
      submittedAt: cases.submittedAt,
    })
    .from(cases)
    .innerJoin(users, eq(cases.memberId, users.id));

  const query = conditions.length ? base.where(and(...conditions)) : base;
  return query.orderBy(desc(cases.updatedAt));
}

// ---------------------------------------------------------------------------
// Circuits : fiches de proximité (producteurs, associations) et coups de main
// ---------------------------------------------------------------------------

export async function getLocalStructures() {
  const points = await db.select().from(localPoints).where(eq(localPoints.isActive, true)).orderBy(localPoints.createdAt);
  if (points.length === 0) return [];
  const ownerIds = Array.from(new Set(points.map((p) => p.ownerId)));
  const owners = await db.select({ id: users.id, fullName: users.fullName }).from(users).where(inArray(users.id, ownerIds));
  const ownerMap = new Map(owners.map((o) => [o.id, o.fullName]));
  const products = await db.select().from(localProducts).where(inArray(localProducts.pointId, points.map((p) => p.id)));
  return points.map((point) => ({
    ...point,
    ownerName: ownerMap.get(point.ownerId) ?? "Adhérent",
    products: products.filter((product) => product.pointId === point.id),
  }));
}

export async function getAvailableHands() {
  const rows = await db
    .select()
    .from(workerAvailabilities)
    .where(eq(workerAvailabilities.status, "disponible"))
    .orderBy(workerAvailabilities.createdAt);
  if (rows.length === 0) return [];
  const ids = Array.from(new Set(rows.map((r) => r.userId)));
  const people = await db
    .select({ id: users.id, displayName: users.displayName, fullName: users.fullName, situation: users.situation, profileVisible: users.profileVisible })
    .from(users)
    .where(inArray(users.id, ids));
  const map = new Map(people.map((p) => [p.id, p]));
  return rows.map((row) => ({ ...row, person: map.get(row.userId) ?? null }));
}

export async function getMemberCircuitData(memberId: number) {
  const myPoints = await db.select().from(localPoints).where(eq(localPoints.ownerId, memberId)).orderBy(localPoints.createdAt);
  const pointIds = myPoints.map((p) => p.id);
  const products = pointIds.length
    ? await db.select().from(localProducts).where(inArray(localProducts.pointId, pointIds))
    : [];
  const myProducts = pointIds.length
    ? await db.select({ id: localProducts.id }).from(localProducts).where(inArray(localProducts.pointId, pointIds))
    : [];

  // Réservations passées par le membre (le retrait se fait sur place)
  const purchases = await db
    .select({
      id: localOrders.id,
      reference: localOrders.reference,
      quantity: localOrders.quantity,
      status: localOrders.status,
      pickupAt: localOrders.pickupAt,
      note: localOrders.note,
      createdAt: localOrders.createdAt,
      productName: localProducts.name,
      pointName: localPoints.name,
      pointCity: localPoints.city,
      sellerId: localPoints.ownerId,
    })
    .from(localOrders)
    .innerJoin(localProducts, eq(localOrders.productId, localProducts.id))
    .innerJoin(localPoints, eq(localOrders.pointId, localPoints.id))
    .where(eq(localOrders.buyerId, memberId))
    .orderBy(desc(localOrders.createdAt));

  // Réservations reçues sur les fiches du membre
  const sales = pointIds.length
    ? await db
        .select({
          id: localOrders.id,
          reference: localOrders.reference,
          quantity: localOrders.quantity,
          status: localOrders.status,
          pickupAt: localOrders.pickupAt,
          note: localOrders.note,
          createdAt: localOrders.createdAt,
          productName: localProducts.name,
          buyerId: localOrders.buyerId,
          pointName: localPoints.name,
        })
        .from(localOrders)
        .innerJoin(localProducts, eq(localOrders.productId, localProducts.id))
        .innerJoin(localPoints, eq(localOrders.pointId, localPoints.id))
        .where(inArray(localOrders.pointId, pointIds))
        .orderBy(desc(localOrders.createdAt))
    : [];

  const buyerIds = Array.from(new Set(sales.map((s) => s.buyerId)));
  const buyers = buyerIds.length
    ? await db.select({ id: users.id, fullName: users.fullName }).from(users).where(inArray(users.id, buyerIds))
    : [];
  const buyerMap = new Map(buyers.map((b) => [b.id, b.fullName]));

  const [availability] = await db.select().from(workerAvailabilities).where(eq(workerAvailabilities.userId, memberId)).limit(1);

  return {
    myPoints: myPoints.map((point) => ({ ...point, products: products.filter((p) => p.pointId === point.id) })),
    purchases,
    sales: sales.map((sale) => ({ ...sale, buyerName: buyerMap.get(sale.buyerId) ?? "Adhérent" })),
    myProductIds: myProducts.map((p) => p.id),
    availability: availability ?? null,
  };
}

export async function getOfficeAppointments(officeId: number | null) {
  const base = db
    .select({
      id: appointments.id,
      reason: appointments.reason,
      requestedSlot: appointments.requestedSlot,
      status: appointments.status,
      memberId: appointments.memberId,
      memberName: users.fullName,
      officeId: appointments.officeId,
    })
    .from(appointments)
    .innerJoin(users, eq(appointments.memberId, users.id));
  const query = officeId ? base.where(eq(appointments.officeId, officeId)) : base;
  return query.orderBy(appointments.requestedSlot);
}
