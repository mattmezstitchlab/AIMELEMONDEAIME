import "server-only";
import { and, asc, desc, eq, inArray, isNull, ne, or } from "drizzle-orm";
import { db } from "@/db";
import {
  artistEngagements, artistProfiles, cases, communityListings, communityRequests, documentShares, documents, journeyEvents, journeyTasks, journeys, notifications,
  organisms, projectDocuments, projectMembers, projects, users,
} from "@/db/schema";
import { distanceKm } from "@/lib/lma";
import type { AssistantSummary } from "@/lib/assistant/personal";

const pub = (d: string | null, f: string) => d ?? f.split(" ")[0];

export async function getOrganisms() {
  return db.select().from(organisms).where(eq(organisms.isActive, true)).orderBy(asc(organisms.category), asc(organisms.name));
}

export async function getMyJourneys(userId: number) {
  const rows = await db.select().from(journeys).where(eq(journeys.userId, userId)).orderBy(desc(journeys.updatedAt));
  const ids = rows.map((r) => r.id);
  const tasks = ids.length ? await db.select().from(journeyTasks).where(inArray(journeyTasks.journeyId, ids)).orderBy(asc(journeyTasks.sortOrder), asc(journeyTasks.id)) : [];
  return rows.map((j) => {
    const t = tasks.filter((x) => x.journeyId === j.id);
    const actions = t.filter((x) => x.kind === "action");
    return { ...j, total: t.length, done: t.filter((x) => x.status === "termine" || x.status === "effectue_declare").length, next: actions.find((x) => !["termine", "effectue_declare"].includes(x.status)) ?? null };
  });
}

/** Détail réservé au propriétaire de la démarche. */
export async function getJourneyDetail(id: number, userId: number) {
  const [j] = await db.select().from(journeys).where(and(eq(journeys.id, id), eq(journeys.userId, userId))).limit(1);
  if (!j) return null;
  const tasks = await db.select().from(journeyTasks).where(eq(journeyTasks.journeyId, id)).orderBy(asc(journeyTasks.sortOrder), asc(journeyTasks.id));
  const events = await db.select().from(journeyEvents).where(eq(journeyEvents.journeyId, id)).orderBy(desc(journeyEvents.createdAt));
  const slugs = Array.from(new Set(tasks.flatMap((t) => t.organismSlugs)));
  const orgs = slugs.length ? await db.select().from(organisms).where(inArray(organisms.slug, slugs)) : [];
  const myDocs = await db.select({ id: documents.id, filename: documents.filename, category: documents.category }).from(documents).where(eq(documents.ownerId, userId)).orderBy(desc(documents.createdAt));
  const [linkedCase] = await db.select({ id: cases.id, reference: cases.reference, status: cases.status, submittedAt: cases.submittedAt }).from(cases).where(eq(cases.journeyId, id)).limit(1);
  const [project] = j.projectId ? await db.select().from(projects).where(eq(projects.id, j.projectId)).limit(1) : [];
  const myProjects = await db.select({ id: projects.id, title: projects.title, startsAt: projects.startsAt }).from(projectMembers).innerJoin(projects, eq(projectMembers.projectId, projects.id))
    .where(and(eq(projectMembers.userId, userId), eq(projectMembers.role, "organisateur"), eq(projectMembers.status, "accepte"), ne(projects.status, "suspendu")));
  const engagementRows = ["evenement", "mariage"].includes(j.situation) ? await db.select({ e: artistEngagements, name: users.displayName, full: users.fullName }).from(artistEngagements).innerJoin(users, eq(artistEngagements.artistId, users.id)).where(eq(artistEngagements.journeyId, id)).orderBy(desc(artistEngagements.createdAt)) : [];
  return {
    journey: j, tasks, events, organisms: orgs, myDocs, project: project ?? null, myProjects, linkedCase: linkedCase ?? null,
    engagements: engagementRows.map((r) => ({ ...r.e, artistName: pub(r.name, r.full) })),
  };
}

/** Artistes visibles sur la carte, filtrés par discipline et triés par distance au lieu de l'événement. */
export async function searchArtists(discipline: string, center: { lat: number; lng: number } | null, excludeUserId: number) {
  const rows = await db.select({
    id: users.id, name: users.displayName, full: users.fullName, city: users.profileCity, lat: users.profileLat, lng: users.profileLng, radius: users.travelRadiusKm, isDemo: users.isDemo,
    disciplines: artistProfiles.disciplines, presentation: artistProfiles.presentation, zone: artistProfiles.zoneNote, availability: artistProfiles.availabilityNote, tech: artistProfiles.techSheet,
  }).from(artistProfiles).innerJoin(users, eq(artistProfiles.userId, users.id)).where(and(eq(users.profileVisible, true), eq(users.isActive, true), ne(users.id, excludeUserId)));
  const ids = rows.map((r) => r.id);
  const listings = ids.length ? await db.select({ id: communityListings.id, ownerId: communityListings.ownerId, title: communityListings.title, priceMode: communityListings.priceMode, price: communityListings.price })
    .from(communityListings).where(and(inArray(communityListings.ownerId, ids), eq(communityListings.action, "prestation"), eq(communityListings.status, "publiee"))) : [];
  return rows
    .map((r) => ({
      id: r.id, name: pub(r.name, r.full), city: r.city, isDemo: r.isDemo, disciplines: r.disciplines, presentation: r.presentation, zone: r.zone, availability: r.availability, hasTech: r.tech.length > 0,
      distance: center && r.lat && r.lng ? Math.round(distanceKm(center, { lat: Number(r.lat), lng: Number(r.lng) })) : null,
      services: listings.filter((l) => l.ownerId === r.id),
      matches: !discipline || discipline === "autre" || r.disciplines.includes(discipline),
    }))
    .sort((a, b) => Number(b.matches) - Number(a.matches) || (a.distance ?? 9999) - (b.distance ?? 9999));
}

export async function getArtistEngagements(artistId: number) {
  const rows = await db.select({ e: artistEngagements, name: users.displayName, full: users.fullName }).from(artistEngagements).innerJoin(users, eq(artistEngagements.organizerId, users.id)).where(eq(artistEngagements.artistId, artistId)).orderBy(desc(artistEngagements.updatedAt));
  const jIds = rows.map((r) => r.e.journeyId).filter((v): v is number => !!v);
  const js = jIds.length ? await db.select({ id: journeys.id, answers: journeys.answers }).from(journeys).where(inArray(journeys.id, jIds)) : [];
  return rows.map((r) => {
    const a = js.find((j) => j.id === r.e.journeyId)?.answers ?? {};
    // L'artiste voit seulement les informations utiles à l'organisation, jamais le budget ni le questionnaire complet.
    return { ...r.e, organizerName: pub(r.name, r.full), lieu: a.lieu ?? "", horaires: a.horaires ?? "", technique: a.technique ?? "", public: a.public ?? "" };
  });
}

/** Vue d'ensemble : prochaines actions, demandes à traiter et échéances proches, sur des données existantes. */
export async function getOverview(userId: number) {
  const js = await getMyJourneys(userId);
  const active = js.filter((j) => j.status === "en_cours");
  const drafts = js.filter((j) => j.status === "questionnaire");
  const ids = active.map((j) => j.id);
  const soon = new Date(Date.now() + 21 * 86400000);
  const dueTasks = ids.length ? (await db.select().from(journeyTasks).where(inArray(journeyTasks.journeyId, ids))).filter((t) => t.dueAt && t.dueAt <= soon && !["termine", "effectue_declare"].includes(t.status)).sort((a, b) => +a.dueAt! - +b.dueAt!) : [];
  const myProjects = await db.select({ id: projects.id, title: projects.title, startsAt: projects.startsAt, city: projects.city, role: projectMembers.role, status: projects.status }).from(projectMembers).innerJoin(projects, eq(projectMembers.projectId, projects.id))
    .where(and(eq(projectMembers.userId, userId), eq(projectMembers.status, "accepte"), ne(projects.status, "suspendu"))).orderBy(asc(projects.startsAt));
  const incomingRequests = await db.select({ id: communityRequests.id, title: communityListings.title }).from(communityRequests).innerJoin(communityListings, eq(communityRequests.listingId, communityListings.id))
    .where(and(eq(communityListings.ownerId, userId), eq(communityRequests.status, "demandee")));
  const engagementsToAnswer = await db.select({ id: artistEngagements.id, journeyId: artistEngagements.journeyId, status: artistEngagements.status, artistId: artistEngagements.artistId, organizerId: artistEngagements.organizerId }).from(artistEngagements)
    .where(or(and(eq(artistEngagements.artistId, userId), eq(artistEngagements.status, "demande_envoyee")), and(eq(artistEngagements.organizerId, userId), eq(artistEngagements.status, "proposition_recue"))));
  const casesToComplete = await db.select({ id: cases.id, reference: cases.reference, title: cases.title }).from(cases).where(and(eq(cases.memberId, userId), eq(cases.status, "piece_manquante")));
  return { active, drafts, dueTasks, myProjects, incomingRequests, engagementsToAnswer, casesToComplete };
}

/** Centre de documents : une seule source (table documents), plus les références partagées et les documents de projets. */
export async function getDocumentsHub(userId: number) {
  const own = await db.select({ id: documents.id, filename: documents.filename, category: documents.category, createdAt: documents.createdAt, isSpecimen: documents.isSpecimen, caseId: documents.caseId, sizeBytes: documents.sizeBytes })
    .from(documents).where(eq(documents.ownerId, userId)).orderBy(desc(documents.createdAt));
  const ownIds = own.map((d) => d.id);
  const shares = ownIds.length ? await db.select({ s: documentShares, grantee: users.displayName, granteeFull: users.fullName, projectTitle: projects.title }).from(documentShares)
    .leftJoin(users, eq(documentShares.granteeUserId, users.id)).leftJoin(projects, eq(documentShares.projectId, projects.id))
    .where(and(inArray(documentShares.documentId, ownIds), isNull(documentShares.revokedAt))) : [];
  const memberProjects = (await db.select({ id: projectMembers.projectId, role: projectMembers.role }).from(projectMembers).where(and(eq(projectMembers.userId, userId), eq(projectMembers.status, "accepte"))));
  const pIds = memberProjects.map((p) => p.id);
  const sharedWithMe = await db.select({ id: documents.id, filename: documents.filename, owner: users.displayName, ownerFull: users.fullName, projectId: documentShares.projectId })
    .from(documentShares).innerJoin(documents, eq(documentShares.documentId, documents.id)).innerJoin(users, eq(documents.ownerId, users.id))
    .where(and(isNull(documentShares.revokedAt), ne(documents.ownerId, userId), pIds.length ? or(eq(documentShares.granteeUserId, userId), inArray(documentShares.projectId, pIds)) : eq(documentShares.granteeUserId, userId)));
  const orgIds = memberProjects.filter((p) => p.role === "organisateur").map((p) => p.id);
  const projectDocs = pIds.length ? (await db.select({ id: projectDocuments.id, projectId: projectDocuments.projectId, filename: projectDocuments.filename, access: projectDocuments.access, title: projects.title })
    .from(projectDocuments).innerJoin(projects, eq(projectDocuments.projectId, projects.id)).where(inArray(projectDocuments.projectId, pIds))).filter((d) => d.access === "membres" || orgIds.includes(d.projectId)) : [];
  const projectsForShare = pIds.length ? await db.select({ id: projects.id, title: projects.title }).from(projects).where(inArray(projects.id, pIds)) : [];
  const uniqueShared = Array.from(new Map(sharedWithMe.map((d) => [d.id, d])).values());
  return {
    own: own.map((d) => ({ ...d, shares: shares.filter((s) => s.s.documentId === d.id).map((s) => ({ id: s.s.id, to: s.s.projectId ? `Projet « ${s.projectTitle} »` : pub(s.grantee, s.granteeFull ?? "Membre") })) })),
    sharedWithMe: uniqueShared.map((d) => ({ id: d.id, filename: d.filename, ownerName: pub(d.owner, d.ownerFull) })),
    projectDocs, projectsForShare,
  };
}

/**
 * Résumé personnel pour l'assistant (niveau 1) : uniquement des lectures sur
 * les données du membre, sous une forme sérialisable pour le widget client.
 */
export async function getAssistantSummary(userId: number): Promise<AssistantSummary> {
  const o = await getOverview(userId);
  const rows = await db
    .select({ id: cases.id, reference: cases.reference, title: cases.title, status: cases.status, journeyId: cases.journeyId })
    .from(cases)
    .where(eq(cases.memberId, userId))
    .orderBy(desc(cases.updatedAt));
  const transmittedJourneyIds = new Set(rows.map((r) => r.journeyId).filter((v): v is number => v != null));
  return {
    journeys: o.active.map((j) => ({
      id: j.id, title: j.title, done: j.done, total: j.total, next: j.next?.label ?? null,
      situation: j.situation,
      nextTask: j.next ? { id: j.next.id, label: j.next.label, dueKind: j.next.dueKind } : null,
      transmitted: transmittedJourneyIds.has(j.id),
    })),
    drafts: o.drafts.map((j) => ({ id: j.id, title: j.title, situation: j.situation, answers: j.answers })),
    cases: rows,
    dueTasks: o.dueTasks.map((t) => ({ label: t.label, dueAt: t.dueAt!.toISOString(), official: t.dueKind === "officielle", journeyId: t.journeyId })),
    incoming: o.incomingRequests.length,
    engagements: o.engagementsToAnswer.length,
  };
}

/**
 * Notifications d'échéances de parcours : à la première visite de l'espace où
 * une échéance (officielle ou rappel personnel) tombe dans les 7 prochains
 * jours — ou est dépassée — le membre reçoit une notification. Anti-doublon
 * sans migration : titre + corps (qui contient la date) + lien identiques ne
 * sont créés qu'une fois ; si l'échéance change, la nouvelle date produit un
 * nouveau corps, donc une nouvelle notification.
 */
export async function ensureDeadlineNotifications(userId: number): Promise<number> {
  const soon = new Date(Date.now() + 7 * 86400000);
  const rows = await db
    .select({ t: journeyTasks, title: journeys.title })
    .from(journeyTasks)
    .innerJoin(journeys, eq(journeyTasks.journeyId, journeys.id))
    .where(and(eq(journeys.userId, userId), eq(journeys.status, "en_cours")));
  const due = rows.filter((r) => r.t.dueAt && r.t.dueAt <= soon && !["termine", "effectue_declare"].includes(r.t.status));
  let created = 0;
  for (const r of due) {
    const date = r.t.dueAt!.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    const title = `Échéance : ${r.t.label}`;
    const body = `${date} — parcours « ${r.title} »${r.t.dueKind === "officielle" ? ` (échéance officielle — source : ${r.t.dueSource ?? "site officiel"})` : " (rappel personnel)"}.`;
    const link = `/espace/demarches/suivi/${r.t.journeyId}`;
    const [existing] = await db.select({ id: notifications.id }).from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.title, title), eq(notifications.body, body), eq(notifications.link, link))).limit(1);
    if (existing) continue;
    await db.insert(notifications).values({ userId, title, body, link });
    created++;
  }
  return created;
}
