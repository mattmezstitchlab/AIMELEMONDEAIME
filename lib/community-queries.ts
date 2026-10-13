import "server-only";
import { and, desc, eq, or, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  communityListings,
  communityRequests,
  communityMessages,
  communityTrips,
  communityTransportRequests,
  communityEventPlans,
  communitySavedSearches,
  communityReports,
  localPoints,
  offices,
  users,
} from "@/db/schema";

/** Données publiques uniquement : pas de situation sociale, téléphone ni coordonnée précise. */
export async function getCommunityExplorerData() {
  const rawListings = await db.select({
    id: communityListings.id,
    ownerId: communityListings.ownerId,
    action: communityListings.action,
    category: communityListings.category,
    title: communityListings.title,
    description: communityListings.description,
    condition: communityListings.condition,
    quantity: communityListings.quantity,
    unit: communityListings.unit,
    price: communityListings.price,
    deposit: communityListings.deposit,
    attributes: communityListings.attributes,
    city: communityListings.city,
    lat: communityListings.lat,
    lng: communityListings.lng,
    availableFrom: communityListings.availableFrom,
    availableUntil: communityListings.availableUntil,
    pickupDetails: communityListings.pickupDetails,
    hasPhoto: communityListings.photoData,
    isDemo: communityListings.isDemo,
    createdAt: communityListings.createdAt,
    universes: communityListings.universes,
    publicationType: communityListings.publicationType,
    priceMode: communityListings.priceMode,
    ownerDisplay: users.displayName,
    ownerFull: users.fullName,
    ownerVisible: users.profileVisible,
  }).from(communityListings).innerJoin(users, eq(communityListings.ownerId, users.id)).where(eq(communityListings.status, "publiee")).orderBy(desc(communityListings.createdAt)).limit(250);

  const listings = rawListings.map(({ ownerDisplay, ownerFull, ...item }) => ({
    ...item,
    ownerName: ownerDisplay ?? ownerFull.split(" ")[0],
    // Ne jamais publier une adresse ou un lieu de retrait précis dans la carte publique.
    pickupDetails: "Modalités de retrait communiquées après accord dans l'échange privé.",
    lat: Number(item.lat),
    lng: Number(item.lng),
    hasPhoto: item.hasPhoto !== null,
  }));

  const tripsRaw = await db.select({
    id: communityTrips.id,
    ownerId: communityTrips.ownerId,
    listingId: communityTrips.listingId,
    startCity: communityTrips.startCity,
    endCity: communityTrips.endCity,
    startLat: communityTrips.startLat,
    startLng: communityTrips.startLng,
    endLat: communityTrips.endLat,
    endLng: communityTrips.endLng,
    departureAt: communityTrips.departureAt,
    transportMode: communityTrips.transportMode,
    capacity: communityTrips.capacity,
    availableCapacity: communityTrips.availableCapacity,
    terms: communityTrips.terms,
    compensation: communityTrips.compensation,
  }).from(communityTrips).where(eq(communityTrips.status, "publie")).orderBy(communityTrips.departureAt).limit(150);
  const trips = tripsRaw.map((trip) => ({
    ...trip,
    startLat: Number(trip.startLat), startLng: Number(trip.startLng),
    endLat: Number(trip.endLat), endLng: Number(trip.endLng),
  }));

  const servicePoints = await db.select({
    id: localPoints.id, name: localPoints.name, city: localPoints.city, lat: localPoints.lat, lng: localPoints.lng,
  }).from(localPoints).where(eq(localPoints.isActive, true)).limit(200);
  const servicePins = servicePoints.map((point) => ({
    id: point.id, name: point.name, city: point.city, lat: Number(point.lat), lng: Number(point.lng),
  }));
  const agencyRows = await db.select({
    id: offices.id, name: offices.name, city: offices.city, postalCode: offices.postalCode,
    address: offices.address, phone: offices.phone, hours: offices.hours, region: offices.region,
    lat: offices.lat, lng: offices.lng,
  }).from(offices).orderBy(offices.region, offices.city);
  const agencies = agencyRows.map((office) => ({ ...office, lat: office.lat ? Number(office.lat) : null, lng: office.lng ? Number(office.lng) : null }));

  return { listings, trips, servicePins, agencies };
}

/** Données privées visibles uniquement par l'acheteur/le propriétaire des échanges concernés. */
export async function getMyCommunityData(userId: number) {
  const ownListings = await db.select({
    id: communityListings.id, action: communityListings.action, category: communityListings.category,
    title: communityListings.title, description: communityListings.description, pickupDetails: communityListings.pickupDetails,
    isDemo: communityListings.isDemo, city: communityListings.city, quantity: communityListings.quantity,
    unit: communityListings.unit, price: communityListings.price, status: communityListings.status,
    createdAt: communityListings.createdAt,
  }).from(communityListings).where(eq(communityListings.ownerId, userId)).orderBy(desc(communityListings.createdAt));

  const rawRequests = await db.select({
    id: communityRequests.id, reference: communityRequests.reference, listingId: communityRequests.listingId,
    requesterId: communityRequests.requesterId, quantity: communityRequests.quantity, message: communityRequests.message,
    startsAt: communityRequests.startsAt, endsAt: communityRequests.endsAt, status: communityRequests.status,
    createdAt: communityRequests.createdAt, updatedAt: communityRequests.updatedAt,
    title: communityListings.title, category: communityListings.category, action: communityListings.action,
    city: communityListings.city, unit: communityListings.unit, pickupDetails: communityListings.pickupDetails,
    listingOwnerId: communityListings.ownerId, requesterName: users.fullName,
  }).from(communityRequests)
    .innerJoin(communityListings, eq(communityRequests.listingId, communityListings.id))
    .innerJoin(users, eq(communityRequests.requesterId, users.id))
    .where(or(eq(communityRequests.requesterId, userId), eq(communityListings.ownerId, userId)))
    .orderBy(desc(communityRequests.updatedAt));

  const requestIds = rawRequests.map((item) => item.id);
  const ownerIds = Array.from(new Set(rawRequests.map((item) => item.listingOwnerId)));
  const listingOwners = ownerIds.length ? await db.select({ id: users.id, fullName: users.fullName }).from(users).where(inArray(users.id, ownerIds)) : [];
  const ownerNames = new Map(listingOwners.map((owner) => [owner.id, owner.fullName]));
  const messages = requestIds.length ? await db.select({
    id: communityMessages.id, requestId: communityMessages.requestId, senderId: communityMessages.senderId,
    body: communityMessages.body, createdAt: communityMessages.createdAt, senderName: users.fullName,
  }).from(communityMessages)
    .innerJoin(users, eq(communityMessages.senderId, users.id))
    .where(inArray(communityMessages.requestId, requestIds))
    .orderBy(communityMessages.createdAt) : [];

  const rawTripRequests = await db.select({
    id: communityTransportRequests.id, tripId: communityTransportRequests.tripId,
    requesterId: communityTransportRequests.requesterId, communityRequestId: communityTransportRequests.communityRequestId,
    description: communityTransportRequests.description, status: communityTransportRequests.status,
    createdAt: communityTransportRequests.createdAt, updatedAt: communityTransportRequests.updatedAt,
    requesterName: users.fullName, ownerId: communityTrips.ownerId, startCity: communityTrips.startCity,
    endCity: communityTrips.endCity, departureAt: communityTrips.departureAt,
    transportMode: communityTrips.transportMode, terms: communityTrips.terms,
  }).from(communityTransportRequests)
    .innerJoin(communityTrips, eq(communityTransportRequests.tripId, communityTrips.id))
    .innerJoin(users, eq(communityTransportRequests.requesterId, users.id))
    .where(or(eq(communityTransportRequests.requesterId, userId), eq(communityTrips.ownerId, userId)))
    .orderBy(desc(communityTransportRequests.createdAt));
  const tripOwnerIds = Array.from(new Set(rawTripRequests.map((request) => request.ownerId)));
  const tripOwners = tripOwnerIds.length ? await db.select({ id: users.id, fullName: users.fullName }).from(users).where(inArray(users.id, tripOwnerIds)) : [];
  const tripOwnerNames = new Map(tripOwners.map((owner) => [owner.id, owner.fullName]));

  const eventPlans = await db.select().from(communityEventPlans)
    .where(eq(communityEventPlans.ownerId, userId)).orderBy(desc(communityEventPlans.createdAt));
  const savedSearches = await db.select().from(communitySavedSearches)
    .where(eq(communitySavedSearches.userId, userId)).orderBy(desc(communitySavedSearches.createdAt));

  return {
    ownListings,
    requests: rawRequests.map((request) => ({
      ...request,
      isOwner: request.listingOwnerId === userId,
      ownerName: ownerNames.get(request.listingOwnerId) ?? "Membre",
      messages: messages.filter((message) => message.requestId === request.id),
    })),
    tripRequests: rawTripRequests.map((request) => ({ ...request, isOwner: request.ownerId === userId, ownerName: tripOwnerNames.get(request.ownerId) ?? "Membre" })),
    eventPlans,
    savedSearches,
  };
}

export async function getCommunityModerationQueue() {
  return db.select({
    id: communityReports.id, listingId: communityReports.listingId, reporterId: communityReports.reporterId,
    reason: communityReports.reason, details: communityReports.details, reportStatus: communityReports.status,
    createdAt: communityReports.createdAt, title: communityListings.title, listingStatus: communityListings.status,
    listingOwnerId: communityListings.ownerId,
  }).from(communityReports)
    .innerJoin(communityListings, eq(communityReports.listingId, communityListings.id))
    .where(eq(communityReports.status, "en_attente"))
    .orderBy(desc(communityReports.createdAt));
}
