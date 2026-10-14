"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gt, inArray, isNull, lt, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  communityEventPlans,
  communityListings,
  communityMessages,
  communityReports,
  communityRequests,
  communitySavedSearches,
  communityTransportRequests,
  communityTrips,
  communityListingStatusEnum,
  communityCategoryEnum,
  communityActionEnum,
  type CommunityRequestStatus,
  type CommunityCategory,
} from "@/db/schema";
import { AuthError, requireRole, requireUser } from "@/lib/auth";
import { createNotification } from "@/lib/queries";
import { projectMembers, projectNeeds, universeEnum } from "@/db/schema";
import { defaultUniverses } from "@/lib/lma";
import { communeLabel, pointFromCommune } from "@/lib/point";
import { logAudit } from "@/lib/audit";

export type CommunityResult = { ok: true; message: string; id?: number } | { ok: false; error: string };

function value(form: FormData, name: string) {
  const item = form.get(name);
  return typeof item === "string" ? item.trim() : "";
}
function numberValue(form: FormData, name: string) {
  const parsed = Number(value(form, name).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : NaN;
}
function boundedPoint(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= 41 && lat <= 51.5 && lng >= -5.5 && lng <= 9.8;
}
function approx(value: number) { return Number(value.toFixed(2)); }
/**
 * Point d'une publication : un point précis s'il est transmis explicitement
 * (affinage ultérieur), sinon il est déduit de la commune et du code postal.
 * Sans carte, c'est la seule source de coordonnées ; le résultat reste borné
 * à la France métropolitaine.
 */
function resolvedPoint(form: FormData, communeField = "city", postalField = "postalCode") {
  const explicitLat = numberValue(form, "lat");
  const explicitLng = numberValue(form, "lng");
  if (boundedPoint(explicitLat, explicitLng)) return { lat: explicitLat, lng: explicitLng };
  return pointFromCommune(value(form, communeField), value(form, postalField));
}
const POINT_ERROR = "Indiquez la commune et un code postal de France métropolitaine (01000 à 95999).";
function normalizeValue(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").trim(); }
function safeId(id: number) { return Number.isSafeInteger(id) && id > 0; }
const reservationPath = "/le-monde-aime";
const confirmedStates = ["reservee", "remise", "retour_attendu"] as const;

function overlapWhere(listingId: number, startsAt: Date | null, endsAt: Date | null) {
  const clauses = [eq(communityRequests.listingId, listingId), inArray(communityRequests.status, [...confirmedStates])];
  if (startsAt && endsAt) {
    clauses.push(or(isNull(communityRequests.startsAt), lt(communityRequests.startsAt, endsAt))!);
    clauses.push(or(isNull(communityRequests.endsAt), gt(communityRequests.endsAt, startsAt))!);
  }
  return and(...clauses);
}

/** Publie une annonce (ou un besoin) ; la photo reste stockée en base. */
export async function createCommunityListing(form: FormData): Promise<CommunityResult> {
  try {
    const user = await requireRole(["membre"]);
    const action = value(form, "action");
    const category = value(form, "category");
    const title = value(form, "title");
    const description = value(form, "description");
    const condition = value(form, "condition") || "bon_etat";
    const city = value(form, "city");
    const quantity = Math.floor(numberValue(form, "quantity"));
    const unit = value(form, "unit") || "pièce";
    const priceValue = value(form, "price");
    const depositValue = value(form, "deposit");
    let price = priceValue === "" ? null : numberValue(form, "price");
    const deposit = depositValue === "" ? null : numberValue(form, "deposit");
    const postalCode = value(form, "postalCode");
    const availableFromRaw = value(form, "availableFrom");
    const availableUntilRaw = value(form, "availableUntil");
    const pickupDetails = value(form, "pickupDetails").slice(0, 240) || "Retrait à convenir sur place";
    const extra = {
      size: value(form, "size").slice(0, 24),
      unit: unit.slice(0, 40),
      dateDebut: value(form, "dateDebut").slice(0, 30),
      dateFin: value(form, "dateFin").slice(0, 30),
      eventDetails: value(form, "eventDetails").slice(0, 100),
    };

    if (!communityActionEnum.includes(action as (typeof communityActionEnum)[number])) return { ok: false, error: "Choisissez une modalité valide : donner, prêter, louer, vendre, prestation, transmission ou besoin." };
    if (!communityCategoryEnum.includes(category as (typeof communityCategoryEnum)[number])) return { ok: false, error: "Choisissez une catégorie." };
    if (category === "trajets_livraisons") return { ok: false, error: "Pour un trajet, choisissez « Publier un trajet » dans le formulaire dédié." };
    if (title.length < 4 || title.length > 140) return { ok: false, error: "Le titre doit contenir entre 4 et 140 caractères." };
    if (description.length < 8 || description.length > 600) return { ok: false, error: "La description doit contenir entre 8 et 600 caractères." };
    if (city.length < 2 || city.length > 100) return { ok: false, error: "Indiquez une commune valide." };
    if (!postalCode) return { ok: false, error: POINT_ERROR };
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) return { ok: false, error: "La quantité doit être comprise entre 1 et 999." };
    const point = resolvedPoint(form);
    if (!point || !boundedPoint(point.lat, point.lng)) return { ok: false, error: POINT_ERROR };
    if (price !== null && (!Number.isFinite(price) || price < 0 || price > 99999)) return { ok: false, error: "Le prix doit être compris entre 0 et 99 999 €." };
    if (deposit !== null && (!Number.isFinite(deposit) || deposit < 0 || deposit > 99999)) return { ok: false, error: "La caution doit être comprise entre 0 et 99 999 €." };
    let priceMode = value(form, "priceMode") || (action === "don" || action === "pret" || action === "transmission" ? "gratuit" : "prix");
    if (action === "don" || action === "pret") priceMode = "gratuit";
    if (action === "cherche") priceMode = "prix";
    if (!["gratuit", "prix", "devis"].includes(priceMode)) return { ok: false, error: "Choisissez Gratuit, un prix ou Sur devis." };
    if (action === "vends" && priceMode !== "prix") return { ok: false, error: "Une vente nécessite un prix annoncé." };
    if (priceMode === "prix" && action !== "cherche" && price === null) return { ok: false, error: "Indiquez le prix annoncé, ou choisissez Gratuit ou Sur devis. Aucun paiement n'est encaissé en ligne." };
    if (priceMode !== "prix") price = null;
    const universesInput = form.getAll("universes").map(String).filter((u) => (universeEnum as readonly string[]).includes(u));
    const universes = universesInput.length ? universesInput : defaultUniverses(category);
    if ((action === "pret" || action === "loue") && !availableUntilRaw) return { ok: false, error: "Indiquez jusqu'à quelle date l'objet peut être emprunté ou loué." };

    const availableFrom = availableFromRaw ? new Date(availableFromRaw) : null;
    const availableUntil = availableUntilRaw ? new Date(availableUntilRaw) : null;
    if ((availableFrom && Number.isNaN(availableFrom.getTime())) || (availableUntil && Number.isNaN(availableUntil.getTime()))) return { ok: false, error: "Les dates de disponibilité ne sont pas valides." };
    if (availableFrom && availableUntil && availableUntil <= availableFrom) return { ok: false, error: "La date de fin doit être après la date de début." };

    const photo = form.get("photo");
    let photoData: Buffer | null = null;
    let photoMime: string | null = null;
    if (photo instanceof File && photo.size > 0) {
      if (photo.size > 3_000_000 || !["image/jpeg", "image/png", "image/webp"].includes(photo.type)) {
        return { ok: false, error: "La photo doit être au format JPEG, PNG ou WebP, 3 Mo maximum." };
      }
      photoData = Buffer.from(await photo.arrayBuffer());
      photoMime = photo.type;
    }
    const attributes = Object.fromEntries(Object.entries(extra).filter(([, v]) => v));
    const [listing] = await db.insert(communityListings).values({
      ownerId: user.id,
      action: action as (typeof communityActionEnum)[number],
      category: category as CommunityCategory,
      title,
      description,
      condition,
      quantity,
      unit: unit.slice(0, 40),
      price: price === null ? null : price.toFixed(2),
      deposit: deposit === null ? null : deposit.toFixed(2),
      attributes,
      city: communeLabel(city, postalCode),
      lat: approx(point.lat).toFixed(2),
      lng: approx(point.lng).toFixed(2),
      availableFrom,
      availableUntil,
      pickupDetails,
      photoData,
      photoMime,
      publicationType: action === "cherche" ? "besoin" : "proposition",
      universes,
      priceMode,
      status: "publiee",
    }).returning({ id: communityListings.id });

    await notifyMatchingSearches({ listingId: listing.id, category: category as CommunityCategory, title, city: communeLabel(city, postalCode), lat: approx(point.lat), lng: approx(point.lng), attributes });
    await logAudit({ actorId: user.id, action: "publication_annonce_communautaire", entityType: "community_listing", entityId: String(listing.id) });
    revalidatePath(reservationPath);
    revalidatePath("/carte");
    return { ok: true, message: "Annonce publiée. Les personnes intéressées peuvent vous envoyer une demande, que vous confirmerez vous-même.", id: listing.id };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connectez-vous à votre espace pour publier." };
    return { ok: false, error: "L'annonce n'a pas pu être enregistrée." };
  }
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = (value: number) => value * Math.PI / 180;
  const dLat = rad(lat2 - lat1), dLng = rad(lng2 - lng1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

async function notifyMatchingSearches(input: { listingId: number; category: CommunityCategory; title: string; city: string; lat: number; lng: number; attributes: Record<string, string> }) {
  const searches = await db.select().from(communitySavedSearches).where(eq(communitySavedSearches.isActive, true));
  for (const search of searches) {
    if (search.category && search.category !== input.category) continue;
    if (search.centerLat !== null && search.centerLat !== undefined && search.centerLng !== null && search.centerLng !== undefined) {
      const distance = haversineKm(Number(search.centerLat), Number(search.centerLng), input.lat, input.lng);
      if (distance > search.radiusKm) continue;
    } else if (search.city && !input.city.toLocaleLowerCase("fr").includes(search.city.toLocaleLowerCase("fr"))) continue;
    if (search.keywords && !input.title.toLocaleLowerCase("fr").includes(search.keywords.toLocaleLowerCase("fr"))) continue;
    const mismatched = Object.entries(search.criteria).some(([key, expected]) => expected && normalizeValue(input.attributes[key] ?? "") !== normalizeValue(expected));
    if (mismatched) continue;
    await createNotification({
      userId: search.userId,
      title: "Une nouvelle annonce correspond à votre recherche",
      body: `${input.title} · ${input.city}`,
      link: `/le-monde-aime?annonce=${input.listingId}`,
    });
  }
}

/** Modifie uniquement une annonce à soi. Les annonces actives avec demandes ne sont pas supprimées. */
export async function updateCommunityListingStatus(listingId: number, status: "publiee" | "suspendue" | "archivee"): Promise<CommunityResult> {
  try {
    const user = await requireRole(["membre"]);
    if (!safeId(listingId) || !communityListingStatusEnum.includes(status)) return { ok: false, error: "Cette modification n'est pas valide." };
    const [listing] = await db.select().from(communityListings).where(eq(communityListings.id, listingId)).limit(1);
    if (!listing || listing.ownerId !== user.id) return { ok: false, error: "Annonce introuvable." };
    await db.update(communityListings).set({ status, updatedAt: new Date() }).where(eq(communityListings.id, listingId));
    await logAudit({ actorId: user.id, action: `annonce_${status}`, entityType: "community_listing", entityId: String(listingId) });
    revalidatePath(reservationPath);
    return { ok: true, message: status === "publiee" ? "Annonce republiée." : status === "suspendue" ? "Annonce suspendue." : "Annonce archivée." };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connexion requise." };
    return { ok: false, error: "La modification n'a pas pu être enregistrée." };
  }
}

/** Modifie les champs d'une annonce à soi, sans changer son propriétaire. */
export async function editCommunityListing(form: FormData): Promise<CommunityResult> {
  try {
    const user = await requireRole(["membre"]);
    const id = Number(value(form, "id"));
    const title = value(form, "title");
    const description = value(form, "description");
    const quantity = Math.floor(numberValue(form, "quantity"));
    const pickupDetails = value(form, "pickupDetails").slice(0, 240);
    if (!safeId(id)) return { ok: false, error: "Annonce introuvable." };
    if (title.length < 4 || title.length > 140 || description.length < 8 || description.length > 600) return { ok: false, error: "Vérifiez le titre et la description." };
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) return { ok: false, error: "Quantité invalide." };
    const [listing] = await db.select().from(communityListings).where(eq(communityListings.id, id)).limit(1);
    if (!listing || listing.ownerId !== user.id) return { ok: false, error: "Annonce introuvable." };
    const reserved = await db.select({ total: sql<number>`coalesce(sum(${communityRequests.quantity}), 0)` })
      .from(communityRequests).where(and(eq(communityRequests.listingId, id), inArray(communityRequests.status, [...confirmedStates])));
    if (quantity < Number(reserved[0]?.total ?? 0)) return { ok: false, error: "La quantité ne peut pas être inférieure aux réservations confirmées." };
    await db.update(communityListings).set({ title, description, quantity, pickupDetails, updatedAt: new Date() }).where(eq(communityListings.id, id));
    await logAudit({ actorId: user.id, action: "modification_annonce_communautaire", entityType: "community_listing", entityId: String(id) });
    revalidatePath(reservationPath);
    return { ok: true, message: "Annonce modifiée." };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connexion requise." };
    return { ok: false, error: "La modification n'a pas pu être enregistrée." };
  }
}

/** Demande de réservation : aucune réservation n'est confirmée avant l'accord explicite du propriétaire. */
export async function requestCommunityListing(form: FormData): Promise<CommunityResult> {
  try {
    const user = await requireRole(["membre"]);
    const listingId = Number(value(form, "listingId"));
    const quantity = Math.floor(numberValue(form, "quantity"));
    const message = value(form, "message").slice(0, 500);
    const startsRaw = value(form, "startsAt");
    const endsRaw = value(form, "endsAt");
    const eventPlanId = value(form, "eventPlanId") ? Number(value(form, "eventPlanId")) : null;
    const projectNeedId = value(form, "projectNeedId") ? Number(value(form, "projectNeedId")) : null;
    if (!safeId(listingId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return { ok: false, error: "Vérifiez l'annonce et la quantité." };
    const [listing] = await db.select().from(communityListings).where(eq(communityListings.id, listingId)).limit(1);
    if (!listing || listing.status !== "publiee") return { ok: false, error: "Cette annonce n'est plus disponible." };
    if (listing.ownerId === user.id) return { ok: false, error: "Vous ne pouvez pas demander votre propre annonce." };
    const isPeriod = listing.action === "pret" || listing.action === "loue";
    const startsAt = startsRaw ? new Date(startsRaw) : null;
    const endsAt = endsRaw ? new Date(endsRaw) : null;
    if (isPeriod && (!startsAt || !endsAt || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt)) {
      return { ok: false, error: "Pour un prêt ou une location, indiquez une période de début et de fin valide." };
    }
    if (quantity > listing.quantity) return { ok: false, error: `La quantité maximale pour cette annonce est ${listing.quantity}.` };
    if (eventPlanId) {
      const [event] = await db.select({ id: communityEventPlans.id }).from(communityEventPlans)
        .where(and(eq(communityEventPlans.id, eventPlanId), eq(communityEventPlans.ownerId, user.id))).limit(1);
      if (!event) return { ok: false, error: "Événement introuvable ou non autorisé." };
    }
    let projectId: number | null = null;
    if (projectNeedId) {
      const [need] = await db.select().from(projectNeeds).where(eq(projectNeeds.id, projectNeedId)).limit(1);
      if (!need) return { ok: false, error: "Besoin de projet introuvable." };
      const [organizer] = await db.select({ id: projectMembers.id }).from(projectMembers)
        .where(and(eq(projectMembers.projectId, need.projectId), eq(projectMembers.userId, user.id), eq(projectMembers.role, "organisateur"), eq(projectMembers.status, "accepte"))).limit(1);
      if (!organizer) return { ok: false, error: "Seuls les organisateurs du projet peuvent demander une contribution." };
      if (need.requestId) {
        const [previous] = await db.select({ status: communityRequests.status }).from(communityRequests).where(eq(communityRequests.id, need.requestId)).limit(1);
        if (previous && !["refusee", "annulee"].includes(previous.status)) return { ok: false, error: "Une proposition est déjà en cours pour ce besoin." };
      }
      projectId = need.projectId;
    }
    const reference = `LMA-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const [request] = await db.insert(communityRequests).values({
      reference, listingId, requesterId: user.id, quantity, message, startsAt, endsAt, eventPlanId, projectId, projectNeedId,
      status: "demandee",
    }).returning({ id: communityRequests.id });
    if (projectNeedId) await db.update(projectNeeds).set({ requestId: request.id }).where(eq(projectNeeds.id, projectNeedId));
    await createNotification({ userId: listing.ownerId, title: "Nouvelle demande sur votre annonce", body: `${listing.title} · ${quantity} ${listing.unit}`, link: reservationPath });
    await logAudit({ actorId: user.id, action: "demande_annonce_communautaire", entityType: "community_request", entityId: reference });
    revalidatePath(reservationPath);
    return { ok: true, message: "Demande envoyée. Elle ne sera réservée qu'après confirmation du propriétaire.", id: request.id };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connectez-vous pour envoyer une demande." };
    return { ok: false, error: "La demande n'a pas pu être envoyée." };
  }
}

/** Le propriétaire accepte/refuse ; chaque acceptation verrouille l'annonce et vérifie stock et dates. */
export async function decideCommunityRequest(requestId: number, decision: "accepter" | "refuser"): Promise<CommunityResult> {
  try {
    const user = await requireRole(["membre"]);
    if (!safeId(requestId)) return { ok: false, error: "Demande introuvable." };
    const result = await db.transaction(async (tx) => {
      const [request] = await tx.select().from(communityRequests).where(eq(communityRequests.id, requestId)).limit(1);
      if (!request || request.status !== "demandee") return { ok: false as const, error: "Cette demande a déjà été traitée." };
      const [listing] = await tx.select().from(communityListings).where(eq(communityListings.id, request.listingId)).for("update").limit(1);
      if (!listing || listing.ownerId !== user.id) return { ok: false as const, error: "Seul le propriétaire peut traiter cette demande." };
      if (decision === "refuser") {
        await tx.update(communityRequests).set({ status: "refusee", updatedAt: new Date() }).where(eq(communityRequests.id, request.id));
        return { ok: true as const, message: "Demande refusée." , recipient: request.requesterId, title: "Réponse à votre demande", body: `${listing.title} · demande refusée.` };
      }
      if (listing.status !== "publiee") return { ok: false as const, error: "Cette annonce est suspendue ou archivée." };
      const existing = await tx.select({ quantity: communityRequests.quantity })
        .from(communityRequests)
        .where(overlapWhere(listing.id, request.startsAt, request.endsAt));
      const reserved = existing.reduce((sum, row) => sum + row.quantity, 0);
      if (reserved + request.quantity > listing.quantity) return { ok: false as const, error: "Conflit de réservation : le stock ou cette période est déjà réservé. Vous pouvez refuser ou proposer une autre période dans le fil." };
      await tx.update(communityRequests).set({ status: "reservee", ownerConfirmedAt: new Date(), updatedAt: new Date() }).where(eq(communityRequests.id, request.id));
      return { ok: true as const, message: "Réservation confirmée. Convenez du retrait dans la conversation.", recipient: request.requesterId, title: "Votre demande est confirmée", body: `${listing.title} · réservation acceptée.` };
    });
    if (!result.ok) return result;
    if ("recipient" in result) await createNotification({ userId: result.recipient, title: result.title, body: result.body, link: reservationPath });
    await logAudit({ actorId: user.id, action: `demande_${decision}`, entityType: "community_request", entityId: String(requestId) });
    revalidatePath(reservationPath);
    return { ok: true, message: result.message };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connexion requise." };
    return { ok: false, error: "Impossible de traiter la demande." };
  }
}

/** Progression du cycle remise / retour / confirmation, réservée aux participants. */
export async function advanceCommunityRequest(requestId: number, action: "remettre" | "confirmer" | "retourner" | "annuler"): Promise<CommunityResult> {
  try {
    const user = await requireRole(["membre"]);
    const result = await db.transaction(async (tx) => {
      const [request] = await tx.select().from(communityRequests).where(eq(communityRequests.id, requestId)).limit(1);
      if (!request) return { ok: false as const, error: "Demande introuvable." };
      const [listing] = await tx.select().from(communityListings).where(eq(communityListings.id, request.listingId)).for("update").limit(1);
      if (!listing) return { ok: false as const, error: "Annonce introuvable." };
      const owner = listing.ownerId === user.id;
      const requester = request.requesterId === user.id;
      if (!owner && !requester) return { ok: false as const, error: "Accès réservé aux participants de cet échange." };
      let next: CommunityRequestStatus;
      let recipient: number;
      let message: string;

      if (action === "annuler") {
        if (!((requester || owner) && ["demandee", "reservee"].includes(request.status))) return { ok: false as const, error: "Cette demande ne peut plus être annulée à cette étape." };
        next = "annulee"; recipient = owner ? requester ? listing.ownerId : request.requesterId : listing.ownerId; message = "Demande annulée.";
        if (owner) recipient = request.requesterId;
      } else if (action === "remettre") {
        if (!owner || request.status !== "reservee") return { ok: false as const, error: "Seul le propriétaire peut confirmer la remise d'une réservation acceptée." };
        next = "remise"; recipient = request.requesterId; message = "Remise signalée. L'autre personne doit confirmer la réception.";
      } else if (action === "confirmer") {
        if (!requester || request.status !== "remise") return { ok: false as const, error: "Seule la personne qui a demandé peut confirmer la réception après la remise." };
        const isLoan = listing.action === "pret" || listing.action === "loue";
        next = isLoan ? "retour_attendu" : "terminee";
        recipient = listing.ownerId;
        message = isLoan ? "Réception confirmée. Le retour de l'objet reste à convenir." : "Réception confirmée. Échange terminé.";
        if (!isLoan && (listing.action === "vends" || listing.action === "don")) {
          await tx.update(communityListings).set({ quantity: Math.max(0, listing.quantity - request.quantity), updatedAt: new Date() }).where(eq(communityListings.id, listing.id));
        }
      } else {
        if (!owner || request.status !== "retour_attendu") return { ok: false as const, error: "Seul le propriétaire peut confirmer le retour de l'objet." };
        next = "terminee"; recipient = request.requesterId; message = "Retour confirmé. Échange terminé.";
      }
      await tx.update(communityRequests).set({ status: next, updatedAt: new Date(), ...(action === "confirmer" ? { requesterConfirmedAt: new Date() } : {}) }).where(eq(communityRequests.id, request.id));
      return { ok: true as const, message, recipient, title: "Mise à jour de votre échange", body: `${listing.title} · ${message}` };
    });
    if (!result.ok) return result;
    await createNotification({ userId: result.recipient, title: result.title, body: result.body, link: reservationPath });
    await logAudit({ actorId: user.id, action: `echange_${action}`, entityType: "community_request", entityId: String(requestId) });
    revalidatePath(reservationPath);
    return { ok: true, message: result.message };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connexion requise." };
    return { ok: false, error: "Impossible de mettre à jour l'échange." };
  }
}

/** Message privé, seulement pour le demandeur ou propriétaire. */
export async function sendCommunityMessage(requestId: number, bodyRaw: string): Promise<CommunityResult> {
  try {
    const user = await requireRole(["membre"]);
    const body = bodyRaw.trim();
    if (!safeId(requestId) || body.length < 2 || body.length > 1200) return { ok: false, error: "Le message doit contenir entre 2 et 1 200 caractères." };
    const [request] = await db.select().from(communityRequests).where(eq(communityRequests.id, requestId)).limit(1);
    if (!request) return { ok: false, error: "Échange introuvable." };
    const [listing] = await db.select().from(communityListings).where(eq(communityListings.id, request.listingId)).limit(1);
    if (!listing || (listing.ownerId !== user.id && request.requesterId !== user.id)) return { ok: false, error: "Accès réservé aux participants." };
    await db.insert(communityMessages).values({ requestId, senderId: user.id, body });
    const recipient = listing.ownerId === user.id ? request.requesterId : listing.ownerId;
    await createNotification({ userId: recipient, title: "Nouveau message dans Le Monde Aime", body: `${listing.title} · ${body.slice(0, 100)}`, link: reservationPath });
    revalidatePath(reservationPath);
    return { ok: true, message: "Message envoyé." };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connexion requise." };
    return { ok: false, error: "Message non envoyé." };
  }
}

/** Publie un trajet « sur mon trajet ». Les coordonnées restent arrondies. */
export async function createCommunityTrip(form: FormData): Promise<CommunityResult> {
  try {
    const user = await requireRole(["membre"]);
    const startCity = value(form, "startCity"), endCity = value(form, "endCity");
    const departureRaw = value(form, "departureAt"), mode = value(form, "transportMode");
    const capacity = Math.floor(numberValue(form, "capacity"));
    const terms = value(form, "terms").slice(0, 400);
    const compensationRaw = value(form, "compensation");
    const compensation = compensationRaw ? numberValue(form, "compensation") : null;
    const startPoint = resolvedPoint(form, "startCity", "startPostalCode");
    const endPoint = resolvedPoint(form, "endCity", "endPostalCode");
    const departureAt = new Date(departureRaw);
    if (startCity.length < 2 || endCity.length < 2 || Number.isNaN(departureAt.getTime()) || departureAt < new Date()) return { ok: false, error: "Indiquez deux communes et une date future valide." };
    if (!value(form, "startPostalCode") || !value(form, "endPostalCode")) return { ok: false, error: POINT_ERROR };
    if (!startPoint || !endPoint || !boundedPoint(startPoint.lat, startPoint.lng) || !boundedPoint(endPoint.lat, endPoint.lng)) return { ok: false, error: POINT_ERROR };
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 50) return { ok: false, error: "Indiquez une capacité entre 1 et 50 objets ou paniers." };
    if (!["vélo", "voiture", "utilitaire", "à pied", "autre"].includes(mode)) return { ok: false, error: "Choisissez un moyen de transport." };
    if (compensation !== null && (!Number.isFinite(compensation) || compensation < 0 || compensation > 500)) return { ok: false, error: "Participation éventuelle invalide." };
    const [trip] = await db.insert(communityTrips).values({
      ownerId: user.id,
      startCity: communeLabel(startCity, value(form, "startPostalCode")),
      endCity: communeLabel(endCity, value(form, "endPostalCode")),
      startLat: approx(startPoint.lat).toFixed(2), startLng: approx(startPoint.lng).toFixed(2),
      endLat: approx(endPoint.lat).toFixed(2), endLng: approx(endPoint.lng).toFixed(2), departureAt, transportMode: mode,
      capacity, availableCapacity: capacity, terms, compensation: compensation === null ? null : compensation.toFixed(2),
    }).returning({ id: communityTrips.id });
    await logAudit({ actorId: user.id, action: "publication_trajet", entityType: "community_trip", entityId: String(trip.id) });
    revalidatePath(reservationPath);
    return { ok: true, message: "Trajet publié. Aucune livraison n'est garantie avant votre confirmation.", id: trip.id };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connectez-vous pour publier un trajet." };
    return { ok: false, error: "Le trajet n'a pas pu être publié." };
  }
}

/** Une demande de transport reste en attente jusqu'à l'acceptation du conducteur. */
export async function requestCommunityTransport(form: FormData): Promise<CommunityResult> {
  try {
    const user = await requireRole(["membre"]);
    const tripId = Number(value(form, "tripId"));
    const description = value(form, "description").slice(0, 300);
    const communityRequestId = value(form, "communityRequestId") ? Number(value(form, "communityRequestId")) : null;
    if (!safeId(tripId) || description.length < 4) return { ok: false, error: "Décrivez le panier ou l'objet à transporter." };
    const [trip] = await db.select().from(communityTrips).where(eq(communityTrips.id, tripId)).limit(1);
    if (!trip || trip.status !== "publie" || trip.departureAt < new Date()) return { ok: false, error: "Ce trajet n'est plus disponible." };
    if (trip.ownerId === user.id) return { ok: false, error: "Vous ne pouvez pas demander votre propre trajet." };
    if (communityRequestId) {
      const [request] = await db.select().from(communityRequests).where(eq(communityRequests.id, communityRequestId)).limit(1);
      if (!request || (request.requesterId !== user.id && (await db.select({ id: communityListings.id }).from(communityListings).where(and(eq(communityListings.id, request.listingId), eq(communityListings.ownerId, user.id))).limit(1)).length === 0)) return { ok: false, error: "Réservation associée introuvable." };
    }
    const [created] = await db.insert(communityTransportRequests).values({ tripId, requesterId: user.id, communityRequestId, description, status: "demandee" }).returning({ id: communityTransportRequests.id });
    await createNotification({ userId: trip.ownerId, title: "Demande de transport", body: `${trip.startCity} → ${trip.endCity} · ${description}`, link: reservationPath });
    await logAudit({ actorId: user.id, action: "demande_transport", entityType: "community_transport_request", entityId: String(created.id) });
    revalidatePath(reservationPath);
    return { ok: true, message: "Demande envoyée. Le trajet n'est pas confirmé avant l'accord du transporteur.", id: created.id };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connexion requise." };
    return { ok: false, error: "La demande de transport n'a pas pu être envoyée." };
  }
}

export async function decideCommunityTransportRequest(requestId: number, accept: boolean): Promise<CommunityResult> {
  try {
    const user = await requireRole(["membre"]);
    const result = await db.transaction(async (tx) => {
      const [request] = await tx.select().from(communityTransportRequests).where(eq(communityTransportRequests.id, requestId)).for("update").limit(1);
      if (!request || request.status !== "demandee") return { ok: false as const, error: "Cette demande a déjà été traitée." };
      const [trip] = await tx.select().from(communityTrips).where(eq(communityTrips.id, request.tripId)).for("update").limit(1);
      if (!trip || trip.ownerId !== user.id) return { ok: false as const, error: "Seul le transporteur peut confirmer cette demande." };
      if (accept) {
        const accepted = await tx.select({ id: communityTransportRequests.id }).from(communityTransportRequests)
          .where(and(eq(communityTransportRequests.tripId, trip.id), inArray(communityTransportRequests.status, ["confirmee", "collectee", "remise"])));
        if (accepted.length >= trip.capacity || trip.availableCapacity < 1) return { ok: false as const, error: "Capacité déjà réservée pour ce trajet." };
      }
      const status = accept ? "confirmee" : "refusee";
      await tx.update(communityTransportRequests).set({ status, updatedAt: new Date() }).where(eq(communityTransportRequests.id, requestId));
      if (accept) await tx.update(communityTrips).set({ availableCapacity: Math.max(0, trip.availableCapacity - 1) }).where(eq(communityTrips.id, trip.id));
      return { ok: true as const, recipient: request.requesterId, status, startCity: trip.startCity, endCity: trip.endCity };
    });
    if (!result.ok) return result;
    await createNotification({ userId: result.recipient, title: "Réponse à votre demande de transport", body: `${result.startCity} → ${result.endCity} · ${result.status === "confirmee" ? "confirmée par le transporteur" : "non acceptée"}`, link: reservationPath });
    await logAudit({ actorId: user.id, action: accept ? "transport_confirme" : "transport_refuse", entityType: "community_transport_request", entityId: String(requestId) });
    revalidatePath(reservationPath);
    return { ok: true, message: accept ? "Transport confirmé explicitement." : "Demande de transport refusée." };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connexion requise." };
    return { ok: false, error: "Impossible de traiter cette demande." };
  }
}

export async function advanceCommunityTransport(requestId: number, next: "collectee" | "remise" | "terminee" | "annulee"): Promise<CommunityResult> {
  try {
    const user = await requireRole(["membre"]);
    const outcome = await db.transaction(async (tx) => {
      const [request] = await tx.select().from(communityTransportRequests)
        .where(eq(communityTransportRequests.id, requestId)).for("update").limit(1);
      if (!request) return { ok: false as const, error: "Demande introuvable." };
      const [trip] = await tx.select().from(communityTrips).where(eq(communityTrips.id, request.tripId)).for("update").limit(1);
      if (!trip || (trip.ownerId !== user.id && request.requesterId !== user.id)) return { ok: false as const, error: "Accès réservé aux participants." };
      const owner = trip.ownerId === user.id;
      const allowed = next === "annulee"
        ? ["demandee", "confirmee"].includes(request.status)
        : next === "collectee" ? owner && request.status === "confirmee"
        : next === "remise" ? owner && request.status === "collectee"
        : request.requesterId === user.id && request.status === "remise";
      if (!allowed) return { ok: false as const, error: "Cette étape n'est pas autorisée dans l'état actuel." };
      await tx.update(communityTransportRequests).set({ status: next, updatedAt: new Date() }).where(eq(communityTransportRequests.id, requestId));
      if ((next === "annulee" && request.status === "confirmee") || next === "terminee") {
        await tx.update(communityTrips).set({ availableCapacity: Math.min(trip.capacity, trip.availableCapacity + 1) }).where(eq(communityTrips.id, trip.id));
      }
      return { ok: true as const, trip, recipient: owner ? request.requesterId : trip.ownerId };
    });
    if (!outcome.ok) return outcome;
    await createNotification({ userId: outcome.recipient, title: "Mise à jour de votre transport", body: `${outcome.trip.startCity} → ${outcome.trip.endCity} · ${next}`, link: reservationPath });
    await logAudit({ actorId: user.id, action: `transport_${next}`, entityType: "community_transport_request", entityId: String(requestId) });
    revalidatePath(reservationPath);
    return { ok: true, message: next === "collectee" ? "Collecte confirmée." : next === "remise" ? "Remise signalée ; l'autre personne confirme la réception." : next === "terminee" ? "Réception confirmée, trajet terminé." : "Demande annulée." };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connexion requise." };
    return { ok: false, error: "Mise à jour impossible." };
  }
}

/** Prépare un événement et ses besoins ; chaque offreur sera contacté séparément. */
export async function createCommunityEventPlan(form: FormData): Promise<CommunityResult> {
  try {
    const user = await requireRole(["membre"]);
    const title = value(form, "title");
    const city = value(form, "city");
    const eventAt = new Date(value(form, "eventDate"));
    const participants = Math.floor(numberValue(form, "participants"));
    const eventPoint = resolvedPoint(form);
    let needs: Array<{ text: string; quantity: number; category: string }>;
    try { needs = JSON.parse(value(form, "needs")); } catch { return { ok: false, error: "Liste des besoins invalide." }; }
    if (title.length < 4 || title.length > 140 || city.length < 2 || Number.isNaN(eventAt.getTime()) || eventAt < new Date()) return { ok: false, error: "Indiquez un nom, une commune et une date future." };
    if (!eventPoint || !boundedPoint(eventPoint.lat, eventPoint.lng) || !Number.isInteger(participants) || participants < 1 || participants > 5000) return { ok: false, error: "Vérifiez la commune et le nombre de participants." };
    if (!Array.isArray(needs) || needs.length < 1 || needs.length > 20 || needs.some((n) => !n.text || n.text.length > 100 || !Number.isInteger(n.quantity) || n.quantity < 1)) return { ok: false, error: "Ajoutez de 1 à 20 besoins et leurs quantités." };
    const [event] = await db.insert(communityEventPlans).values({
      ownerId: user.id, title, city: communeLabel(city, value(form, "postalCode")), eventDate: eventAt, participants,
      lat: approx(eventPoint.lat).toFixed(2), lng: approx(eventPoint.lng).toFixed(2), needs,
    }).returning({ id: communityEventPlans.id });
    await logAudit({ actorId: user.id, action: "preparation_evenement", entityType: "community_event", entityId: String(event.id) });
    revalidatePath(reservationPath);
    return { ok: true, message: "Liste de besoins enregistrée. Les propositions n'ont pas été réservées automatiquement : contactez chaque propriétaire séparément.", id: event.id };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connectez-vous pour préparer un événement." };
    return { ok: false, error: "L'événement n'a pas pu être enregistré." };
  }
}

/** Enregistre une recherche, puis notifie en application les correspondances futures. */
export async function saveCommunitySearch(form: FormData): Promise<CommunityResult> {
  try {
    const user = await requireRole(["membre"]);
    const category = value(form, "category");
    const city = value(form, "city").slice(0, 120);
    const radius = Math.floor(numberValue(form, "radiusKm"));
    const keywords = value(form, "keywords").slice(0, 180);
    const size = value(form, "size").slice(0, 30);
    const centerLatRaw = value(form, "centerLat");
    const centerLngRaw = value(form, "centerLng");
    const searchPoint = centerLatRaw && centerLngRaw ? null : resolvedPoint(form);
    const centerLat = centerLatRaw ? numberValue(form, "centerLat") : searchPoint?.lat ?? NaN;
    const centerLng = centerLngRaw ? numberValue(form, "centerLng") : searchPoint?.lng ?? NaN;
    if (category && !communityCategoryEnum.includes(category as CommunityCategory)) return { ok: false, error: "Catégorie invalide." };
    if (!Number.isInteger(radius) || radius < 1 || radius > 200) return { ok: false, error: "Le rayon doit être entre 1 et 200 km." };
    if ((centerLatRaw || centerLngRaw) && (!boundedPoint(centerLat, centerLng))) return { ok: false, error: "Centre de recherche invalide." };
    const [search] = await db.insert(communitySavedSearches).values({
      userId: user.id, category: category ? category as CommunityCategory : null,
      city: value(form, "postalCode") ? communeLabel(city, value(form, "postalCode")) : city,
      centerLat: Number.isFinite(centerLat) ? approx(centerLat).toFixed(2) : null,
      centerLng: Number.isFinite(centerLng) ? approx(centerLng).toFixed(2) : null,
      radiusKm: radius,
      keywords, criteria: size ? { size } : {},
    }).returning({ id: communitySavedSearches.id });
    await logAudit({ actorId: user.id, action: "recherche_locale_enregistree", entityType: "community_saved_search", entityId: String(search.id) });
    revalidatePath(reservationPath);
    return { ok: true, message: "Recherche enregistrée. Une notification apparaîtra dans votre espace si une annonce correspond.", id: search.id };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connectez-vous pour enregistrer une recherche." };
    return { ok: false, error: "La recherche n'a pas pu être enregistrée." };
  }
}

export async function deleteCommunitySearch(searchId: number): Promise<CommunityResult> {
  try {
    const user = await requireRole(["membre"]);
    const [deleted] = await db.delete(communitySavedSearches).where(and(eq(communitySavedSearches.id, searchId), eq(communitySavedSearches.userId, user.id))).returning({ id: communitySavedSearches.id });
    if (!deleted) return { ok: false, error: "Recherche introuvable." };
    revalidatePath(reservationPath);
    return { ok: true, message: "Recherche supprimée." };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connexion requise." };
    return { ok: false, error: "Suppression impossible." };
  }
}

export async function reportCommunityListing(listingId: number, reason: string, detailsRaw: string): Promise<CommunityResult> {
  try {
    const user = await requireUser();
    if (!safeId(listingId)) return { ok: false, error: "Annonce introuvable." };
    const allowed = ["contenu_inapproprie", "annonce_trompeuse", "doublon", "autre"];
    if (!allowed.includes(reason)) return { ok: false, error: "Choisissez un motif." };
    const [listing] = await db.select().from(communityListings).where(eq(communityListings.id, listingId)).limit(1);
    if (!listing || listing.ownerId === user.id) return { ok: false, error: "Annonce introuvable." };
    const [existing] = await db.select({ id: communityReports.id }).from(communityReports).where(and(eq(communityReports.listingId, listingId), eq(communityReports.reporterId, user.id), eq(communityReports.status, "en_attente"))).limit(1);
    if (existing) return { ok: false, error: "Vous avez déjà signalé cette annonce." };
    await db.insert(communityReports).values({ listingId, reporterId: user.id, reason, details: detailsRaw.trim().slice(0, 500) });
    await logAudit({ actorId: user.id, action: "signalement_annonce", entityType: "community_listing", entityId: String(listingId) });
    revalidatePath(reservationPath);
    return { ok: true, message: "Signalement transmis à l'équipe de modération." };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connectez-vous pour signaler." };
    return { ok: false, error: "Signalement non transmis." };
  }
}

export async function moderateCommunityReport(reportId: number, decision: "masquer" | "maintenir"): Promise<CommunityResult> {
  try {
    const admin = await requireRole(["administrateur"]);
    const [report] = await db.select().from(communityReports).where(eq(communityReports.id, reportId)).limit(1);
    if (!report || report.status !== "en_attente") return { ok: false, error: "Signalement déjà traité." };
    await db.transaction(async (tx) => {
      await tx.update(communityReports).set({ status: decision === "masquer" ? "traite_masque" : "traite_maintenu", reviewedBy: admin.id }).where(eq(communityReports.id, reportId));
      if (decision === "masquer") await tx.update(communityListings).set({ status: "suspendue", moderationNote: report.reason, updatedAt: new Date() }).where(eq(communityListings.id, report.listingId));
    });
    await logAudit({ actorId: admin.id, action: `moderation_${decision}`, entityType: "community_report", entityId: String(reportId) });
    revalidatePath("/admin/le-monde-aime");
    revalidatePath(reservationPath);
    return { ok: true, message: decision === "masquer" ? "Annonce suspendue." : "Signalement classé sans suite." };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Réservé à l'administration." };
    return { ok: false, error: "Modération impossible." };
  }
}
