import "server-only";
import { and, desc, eq, inArray, isNotNull, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  artistProfiles,
  circleMembers,
  circlePosts,
  circles,
  communityListings,
  communityRequests,
  contentReports,
  profilePhotos,
  projectDocuments,
  projectMembers,
  projectMessages,
  projectNeeds,
  projects,
  users,
} from "@/db/schema";
import { distanceKm, needStatusFromRequest } from "@/lib/lma";

const firstName = (full: string) => full.split(" ")[0];
const publicName = (display: string | null, full: string) => display ?? firstName(full);

/**
 * Les personnes qui acceptent de transmettre, et seulement elles.
 *
 * Un circuit a besoin de cette liste courte : profil public, commune située, et
 * un mot sur ce qui est transmis. Rien d'autre ne sort d'ici.
 */
export async function getTransmitters() {
  const rows = await db.select({
    id: users.id,
    displayName: users.displayName,
    fullName: users.fullName,
    bio: users.bio,
    activities: users.activities,
    universes: users.universes,
    transmitText: users.transmitText,
    availabilityNote: users.availabilityNote,
    city: users.profileCity,
    isDemo: users.isDemo,
  }).from(users).where(and(
    eq(users.profileVisible, true),
    eq(users.isActive, true),
    eq(users.role, "membre"),
    isNotNull(users.transmitText),
    isNotNull(users.profileLat),
    isNotNull(users.profileLng),
  ));

  const ids = rows.map((row) => row.id);
  const photos = ids.length
    ? await db.select({ id: profilePhotos.userId }).from(profilePhotos).where(inArray(profilePhotos.userId, ids))
    : [];

  return rows.map(({ displayName, fullName, ...person }) => ({
    ...person,
    name: publicName(displayName, fullName),
    hasPhoto: photos.some((photo) => photo.id === person.id),
  }));
}

/** Données publiques de la carte : personnes visibles volontairement, projets ouverts, récits publiés. */
export async function getExplorerExtras() {
  const peopleRows = await db.select({
    id: users.id, displayName: users.displayName, fullName: users.fullName, bio: users.bio, activities: users.activities,
    universes: users.universes, offersText: users.offersText, needsText: users.needsText, transmitText: users.transmitText,
    travelRadiusKm: users.travelRadiusKm, availabilityNote: users.availabilityNote, city: users.profileCity,
    lat: users.profileLat, lng: users.profileLng, isDemo: users.isDemo,
  }).from(users).where(and(eq(users.profileVisible, true), eq(users.isActive, true), eq(users.role, "membre"), isNotNull(users.profileLat), isNotNull(users.profileLng)));
  const photoIds = peopleRows.length ? (await db.select({ id: profilePhotos.userId }).from(profilePhotos).where(inArray(profilePhotos.userId, peopleRows.map((p) => p.id)))).map((r) => r.id) : [];
  const people = peopleRows.map(({ displayName, fullName, lat, lng, ...p }) => ({
    ...p, name: publicName(displayName, fullName), lat: Number(lat), lng: Number(lng), hasPhoto: photoIds.includes(p.id),
  }));

  const projectRows = await db.select().from(projects).where(eq(projects.status, "ouvert")).orderBy(projects.startsAt);
  const ids = projectRows.map((p) => p.id);
  const members = ids.length ? await db.select().from(projectMembers).where(and(inArray(projectMembers.projectId, ids), eq(projectMembers.status, "accepte"))) : [];
  const needs = ids.length ? await db.select({ id: projectNeeds.id, projectId: projectNeeds.projectId, requestId: projectNeeds.requestId }).from(projectNeeds).where(inArray(projectNeeds.projectId, ids)) : [];
  const reqIds = needs.map((n) => n.requestId).filter((v): v is number => !!v);
  const reqs = reqIds.length ? await db.select({ id: communityRequests.id, status: communityRequests.status }).from(communityRequests).where(inArray(communityRequests.id, reqIds)) : [];
  const owners = ids.length ? await db.select({ id: users.id, displayName: users.displayName, fullName: users.fullName }).from(users).where(inArray(users.id, projectRows.map((p) => p.ownerId))) : [];
  const projectsOut = projectRows.map((p) => {
    const own = owners.find((o) => o.id === p.ownerId);
    const pn = needs.filter((n) => n.projectId === p.id);
    return {
      id: p.id, title: p.title, intention: p.intention, city: p.city, lat: Number(p.lat), lng: Number(p.lng),
      startsAt: p.startsAt, endsAt: p.endsAt, universes: p.universes, isDemo: p.isDemo,
      organizerName: own ? publicName(own.displayName, own.fullName) : "Organisateur",
      participants: members.filter((m) => m.projectId === p.id).length,
      needsTotal: pn.length,
      needsConfirmed: pn.filter((n) => needStatusFromRequest(reqs.find((r) => r.id === n.requestId)?.status) === "confirme").length,
    };
  });

  const storyRows = await db.select({
    id: circlePosts.id, title: circlePosts.title, body: circlePosts.body, kind: circlePosts.kind, createdAt: circlePosts.createdAt,
    isDemo: circlePosts.isDemo, hasPhoto: circlePosts.photoMime, displayName: users.displayName, fullName: users.fullName,
  }).from(circlePosts).innerJoin(users, eq(circlePosts.authorId, users.id)).where(eq(circlePosts.visibility, "publie")).orderBy(desc(circlePosts.createdAt)).limit(20);
  const stories = storyRows.map(({ displayName, fullName, hasPhoto, body, ...s }) => ({ ...s, body: body.slice(0, 500), authorName: publicName(displayName, fullName), hasPhoto: hasPhoto !== null }));

  return { people, projects: projectsOut, stories };
}

/** Vue « Mes liens » : projets, cercles, invitations et demandes de participation à traiter. */
export async function getMyLinks(userId: number) {
  const myProjects = await db.select({
    id: projects.id, title: projects.title, city: projects.city, startsAt: projects.startsAt, status: projects.status,
    role: projectMembers.role, memberStatus: projectMembers.status, isDemo: projects.isDemo,
  }).from(projectMembers).innerJoin(projects, eq(projectMembers.projectId, projects.id)).where(and(eq(projectMembers.userId, userId), ne(projectMembers.status, "refuse"))).orderBy(projects.startsAt);
  const organizerIds = myProjects.filter((p) => p.role === "organisateur" && p.memberStatus === "accepte").map((p) => p.id);
  const pending = organizerIds.length ? await db.select({ projectId: projectMembers.projectId }).from(projectMembers).where(and(inArray(projectMembers.projectId, organizerIds), eq(projectMembers.status, "demande"))) : [];
  const circleRows = await db.select({
    id: circles.id, name: circles.name, kind: circles.kind, description: circles.description, role: circleMembers.role, status: circleMembers.status, isDemo: circles.isDemo,
  }).from(circleMembers).innerJoin(circles, eq(circleMembers.circleId, circles.id)).where(and(eq(circleMembers.userId, userId), ne(circleMembers.status, "refuse")));
  const [artist] = await db.select({ userId: artistProfiles.userId }).from(artistProfiles).where(eq(artistProfiles.userId, userId)).limit(1);
  return {
    projects: myProjects.map((p) => ({ ...p, pendingRequests: pending.filter((r) => r.projectId === p.id).length })),
    circles: circleRows.filter((c) => c.status === "accepte"),
    invites: circleRows.filter((c) => c.status === "invite"),
    hasArtist: !!artist,
  };
}

export async function getMyProfile(userId: number) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const [photo] = await db.select({ userId: profilePhotos.userId }).from(profilePhotos).where(eq(profilePhotos.userId, userId)).limit(1);
  return user ? { user, hasPhoto: !!photo } : null;
}

export async function getPersonProfile(id: number) {
  const [user] = await db.select().from(users).where(and(eq(users.id, id), eq(users.profileVisible, true), eq(users.isActive, true), eq(users.role, "membre"))).limit(1);
  if (!user) return null;
  const [photo] = await db.select({ userId: profilePhotos.userId }).from(profilePhotos).where(eq(profilePhotos.userId, id)).limit(1);
  const [artist] = await db.select().from(artistProfiles).where(eq(artistProfiles.userId, id)).limit(1);
  const listings = await db.select({
    id: communityListings.id, title: communityListings.title, action: communityListings.action, category: communityListings.category,
    city: communityListings.city, isDemo: communityListings.isDemo,
  }).from(communityListings).where(and(eq(communityListings.ownerId, id), eq(communityListings.status, "publiee"))).orderBy(desc(communityListings.createdAt)).limit(12);
  return {
    id: user.id, name: publicName(user.displayName, user.fullName), bio: user.bio, activities: user.activities, interests: user.interests,
    offersText: user.offersText, needsText: user.needsText, transmitText: user.transmitText, city: user.profileCity,
    travelRadiusKm: user.travelRadiusKm, availabilityNote: user.availabilityNote, isDemo: user.isDemo, hasPhoto: !!photo,
    artist: artist ?? null, listings,
  };
}

export async function getArtistSpace(userId: number) {
  const [artist] = await db.select().from(artistProfiles).where(eq(artistProfiles.userId, userId)).limit(1);
  const services = await db.select({
    id: communityListings.id, title: communityListings.title, description: communityListings.description, priceMode: communityListings.priceMode,
    price: communityListings.price, status: communityListings.status, city: communityListings.city, isDemo: communityListings.isDemo,
  }).from(communityListings).where(and(eq(communityListings.ownerId, userId), eq(communityListings.action, "prestation"))).orderBy(desc(communityListings.createdAt));
  const requests = await db.select({
    id: communityRequests.id, reference: communityRequests.reference, status: communityRequests.status, message: communityRequests.message,
    quantity: communityRequests.quantity, startsAt: communityRequests.startsAt, endsAt: communityRequests.endsAt, projectId: communityRequests.projectId,
    title: communityListings.title, requesterName: users.displayName, requesterFull: users.fullName,
  }).from(communityRequests).innerJoin(communityListings, eq(communityRequests.listingId, communityListings.id)).innerJoin(users, eq(communityRequests.requesterId, users.id))
    .where(and(eq(communityListings.ownerId, userId), eq(communityListings.action, "prestation"))).orderBy(desc(communityRequests.updatedAt));
  const memberships = await db.select({ projectId: projectMembers.projectId, role: projectMembers.role }).from(projectMembers).where(and(eq(projectMembers.userId, userId), eq(projectMembers.status, "accepte")));
  const orgIds = memberships.filter((m) => m.role === "organisateur").map((m) => m.projectId);
  const ids = memberships.map((m) => m.projectId);
  const docs = ids.length ? await db.select({
    id: projectDocuments.id, projectId: projectDocuments.projectId, filename: projectDocuments.filename, access: projectDocuments.access, sizeBytes: projectDocuments.sizeBytes, title: projects.title,
  }).from(projectDocuments).innerJoin(projects, eq(projectDocuments.projectId, projects.id)).where(inArray(projectDocuments.projectId, ids)).orderBy(desc(projectDocuments.createdAt)) : [];
  return {
    artist: artist ?? null,
    services,
    requests: requests.map(({ requesterName, requesterFull, ...r }) => ({ ...r, requester: publicName(requesterName, requesterFull) })),
    documents: docs.filter((d) => d.access === "membres" || orgIds.includes(d.projectId)),
  };
}

/** Détail d'un projet : le public voit l'essentiel, les participants acceptés voient échanges et documents. */
export async function getProjectDetail(projectId: number, viewerId: number | null) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project || project.status === "suspendu") return null;
  const memberRows = await db.select({
    userId: projectMembers.userId, role: projectMembers.role, status: projectMembers.status, displayName: users.displayName, fullName: users.fullName,
  }).from(projectMembers).innerJoin(users, eq(projectMembers.userId, users.id)).where(eq(projectMembers.projectId, projectId));
  const mine = viewerId ? memberRows.find((m) => m.userId === viewerId) ?? null : null;
  const isMember = mine?.status === "accepte";
  const isOrganizer = isMember && mine?.role === "organisateur";
  const needRows = await db.select().from(projectNeeds).where(eq(projectNeeds.projectId, projectId)).orderBy(projectNeeds.id);
  const reqIds = needRows.map((n) => n.requestId).filter((v): v is number => !!v);
  const reqRows = reqIds.length ? await db.select({
    id: communityRequests.id, status: communityRequests.status, quantity: communityRequests.quantity, title: communityListings.title, ownerDisplay: users.displayName, ownerFull: users.fullName,
  }).from(communityRequests).innerJoin(communityListings, eq(communityRequests.listingId, communityListings.id)).innerJoin(users, eq(communityListings.ownerId, users.id)).where(inArray(communityRequests.id, reqIds)) : [];
  const needs = needRows.map((n) => {
    const r = reqRows.find((x) => x.id === n.requestId);
    const status = needStatusFromRequest(r?.status);
    return {
      id: n.id, text: n.text, quantity: n.quantity, category: n.category, status,
      contribution: isMember && r && status !== "recherche" ? { title: r.title, quantity: r.quantity, ownerName: publicName(r.ownerDisplay, r.ownerFull), requestStatus: r.status } : null,
    };
  });

  let suggestions: Array<{ needId: number; listing: { id: number; title: string; action: string; quantity: number; unit: string; city: string; ownerName: string; distance: number; priceMode: string; price: string | null } }> = [];
  if (isOrganizer && project.status === "ouvert") {
    const open = needs.filter((n) => n.status === "recherche");
    if (open.length) {
      const candidates = await db.select({
        id: communityListings.id, title: communityListings.title, description: communityListings.description, action: communityListings.action, category: communityListings.category,
        quantity: communityListings.quantity, unit: communityListings.unit, city: communityListings.city, lat: communityListings.lat, lng: communityListings.lng,
        ownerId: communityListings.ownerId, priceMode: communityListings.priceMode, price: communityListings.price, ownerDisplay: users.displayName, ownerFull: users.fullName,
      }).from(communityListings).innerJoin(users, eq(communityListings.ownerId, users.id)).where(and(eq(communityListings.status, "publiee"), eq(communityListings.publicationType, "proposition"), ne(communityListings.ownerId, viewerId!))).limit(300);
      const norm = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const center = { lat: Number(project.lat), lng: Number(project.lng) };
      for (const need of open) {
        const words = norm(need.text).split(/[^a-z0-9]+/).filter((w) => w.length > 2).map((w) => w.replace(/s$/, ""));
        const found = candidates
          .filter((c) => c.quantity > 0)
          .map((c) => ({ c, distance: distanceKm(center, { lat: Number(c.lat), lng: Number(c.lng) }), hit: words.some((w) => norm(`${c.title} ${c.description}`).includes(w)) }))
          .filter((x) => x.hit && x.distance <= 120)
          .sort((a, b) => a.distance - b.distance).slice(0, 4);
        for (const { c, distance } of found) {
          suggestions.push({ needId: need.id, listing: { id: c.id, title: c.title, action: c.action, quantity: c.quantity, unit: c.unit, city: c.city, ownerName: publicName(c.ownerDisplay, c.ownerFull), distance: Math.round(distance), priceMode: c.priceMode, price: c.price } });
        }
      }
    }
  }

  const messages = isMember ? await db.select({
    id: projectMessages.id, senderId: projectMessages.senderId, body: projectMessages.body, createdAt: projectMessages.createdAt, displayName: users.displayName, fullName: users.fullName,
  }).from(projectMessages).innerJoin(users, eq(projectMessages.senderId, users.id)).where(eq(projectMessages.projectId, projectId)).orderBy(projectMessages.createdAt) : [];
  const docRows = isMember ? await db.select({
    id: projectDocuments.id, filename: projectDocuments.filename, mime: projectDocuments.mime, sizeBytes: projectDocuments.sizeBytes, access: projectDocuments.access, createdAt: projectDocuments.createdAt,
  }).from(projectDocuments).where(eq(projectDocuments.projectId, projectId)).orderBy(desc(projectDocuments.createdAt)) : [];

  return {
    project: { ...project, lat: Number(project.lat), lng: Number(project.lng) },
    viewer: { isMember, isOrganizer, pending: mine?.status === "demande", refused: mine?.status === "refuse" },
    organizers: memberRows.filter((m) => m.role === "organisateur" && m.status === "accepte").map((m) => publicName(m.displayName, m.fullName)),
    participants: memberRows.filter((m) => m.status === "accepte").length,
    members: isMember ? memberRows.filter((m) => m.status === "accepte").map((m) => ({ userId: m.userId, name: publicName(m.displayName, m.fullName), role: m.role })) : [],
    pendingMembers: isOrganizer ? memberRows.filter((m) => m.status === "demande").map((m) => ({ userId: m.userId, name: publicName(m.displayName, m.fullName) })) : [],
    needs, suggestions,
    messages: messages.map(({ displayName, fullName, ...m }) => ({ ...m, senderName: publicName(displayName, fullName) })),
    documents: docRows.filter((d) => d.access === "membres" || isOrganizer),
  };
}

/** Un cercle n'est lisible que par ses membres ayant accepté l'invitation. */
export async function getCircleDetail(circleId: number, userId: number) {
  const [me] = await db.select().from(circleMembers).where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId), eq(circleMembers.status, "accepte"))).limit(1);
  if (!me) return null;
  const [circle] = await db.select().from(circles).where(eq(circles.id, circleId)).limit(1);
  if (!circle) return null;
  const memberRows = await db.select({
    userId: circleMembers.userId, role: circleMembers.role, status: circleMembers.status, displayName: users.displayName, fullName: users.fullName,
  }).from(circleMembers).innerJoin(users, eq(circleMembers.userId, users.id)).where(eq(circleMembers.circleId, circleId));
  const posts = await db.select({
    id: circlePosts.id, authorId: circlePosts.authorId, kind: circlePosts.kind, title: circlePosts.title, body: circlePosts.body, visibility: circlePosts.visibility,
    createdAt: circlePosts.createdAt, hasPhoto: circlePosts.photoMime, displayName: users.displayName, fullName: users.fullName,
  }).from(circlePosts).innerJoin(users, eq(circlePosts.authorId, users.id)).where(eq(circlePosts.circleId, circleId)).orderBy(desc(circlePosts.createdAt));
  const isLead = me.role === "responsable";
  return {
    circle, isLead,
    members: memberRows.filter((m) => m.status === "accepte" || isLead).map((m) => ({ userId: m.userId, name: publicName(m.displayName, m.fullName), role: m.role, status: m.status })),
    posts: posts.map(({ displayName, fullName, hasPhoto, ...p }) => ({ ...p, authorName: publicName(displayName, fullName), hasPhoto: hasPhoto !== null, mine: p.authorId === userId, canDelete: p.authorId === userId || isLead })),
  };
}

export async function getContentModerationQueue() {
  const rows = await db.select().from(contentReports).where(eq(contentReports.status, "en_attente")).orderBy(desc(contentReports.createdAt));
  const out = [];
  for (const r of rows) {
    if (r.targetType === "projet") {
      const [p] = await db.select({ title: projects.title, intention: projects.intention }).from(projects).where(eq(projects.id, r.targetId)).limit(1);
      out.push({ ...r, title: p?.title ?? "Projet supprimé", excerpt: p?.intention ?? "" });
    } else {
      const [p] = await db.select({ title: circlePosts.title, body: circlePosts.body }).from(circlePosts).where(eq(circlePosts.id, r.targetId)).limit(1);
      out.push({ ...r, title: p?.title ?? "Récit supprimé", excerpt: (p?.body ?? "").slice(0, 300) });
    }
  }
  return out;
}
