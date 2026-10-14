"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { localOrders, localPoints, localProducts, workerAvailabilities, type LocalOrderStatus } from "@/db/schema";
import { requireRole, requireUser, AuthError } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/queries";
import { DEFAULT_ORDER_STATUS_LABELS, circuitFor, circuitForPointKind, type Circuit } from "@/lib/circuits";
import { communeLabel, isBoundedPoint, pointFromCommune } from "@/lib/point";

/*
 * Les actions des circuits.
 *
 * Un circuit = un cadre, un tableau, des règles. Ces actions servent tous les
 * circuits : le circuit visé arrive en clair dans le formulaire, et ses mots
 * (fiche, produit, réservation) sont lus dans lib/circuits.ts. Ajouter un
 * circuit ne demande donc pas de nouvelle action serveur.
 *
 * Le point d'une fiche n'est jamais saisi : il est déduit de la commune et du
 * code postal, exactement comme dans Le Monde Aime.
 */

export type CircuitResult = { ok: true; message: string; id?: number } | { ok: false; error: string };

function value(form: FormData, name: string) {
  const item = form.get(name);
  return typeof item === "string" ? item.trim() : "";
}
function numberValue(form: FormData, name: string) {
  const parsed = Number(value(form, name).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : NaN;
}
function safeId(id: number) {
  return Number.isSafeInteger(id) && id > 0;
}

/** Le circuit visé, ou une erreur lisible : aucune action ne travaille à l'aveugle. */
function requireCircuit(form: FormData): Circuit | { error: string } {
  const circuit = circuitFor(value(form, "circuit"));
  if (!circuit) return { error: "Circuit inconnu." };
  if (circuit.status !== "ouvert") return { error: `Le circuit « ${circuit.label} » n'est pas encore ouvert.` };
  return circuit;
}

/**
 * Point d'une fiche : la commune et le code postal, rien d'autre.
 * Le point précis reste accepté s'il est transmis (affinage ultérieur).
 */
function resolvedPoint(form: FormData, communeField = "city", postalField = "postalCode") {
  const explicitLat = numberValue(form, "lat");
  const explicitLng = numberValue(form, "lng");
  if (isBoundedPoint(explicitLat, explicitLng)) return { lat: explicitLat, lng: explicitLng };
  return pointFromCommune(value(form, communeField), value(form, postalField));
}
const POINT_ERROR = "Indiquez la commune et un code postal de métropole (01000 à 95999) : le point en découle.";

function revalidateCircuits() {
  revalidatePath("/circuits", "layout");
  revalidatePath("/le-monde-aime");
}

/* ------------------------------------------------------------------ *
 * Circuits à structures (producteurs, associations…)                  *
 * ------------------------------------------------------------------ */

/** Dépose la fiche d'une structure : ferme, atelier, jardin, association. */
export async function createCircuitStructure(form: FormData): Promise<CircuitResult> {
  try {
    const user = await requireRole(["membre"]);
    const circuit = requireCircuit(form);
    if ("error" in circuit) return { ok: false, error: circuit.error };

    const name = value(form, "name");
    const description = value(form, "description").slice(0, 600);
    const city = value(form, "city").slice(0, 100);
    const postalCode = value(form, "postalCode");
    const phone = value(form, "phone").slice(0, 30);
    const point = resolvedPoint(form);

    if (name.length < 3 || name.length > 160) return { ok: false, error: "Le nom doit contenir entre 3 et 160 caractères." };
    if (!point) return { ok: false, error: POINT_ERROR };

    const [created] = await db
      .insert(localPoints)
      .values({
        ownerId: user.id,
        kind: circuit.pointKind ?? "presence",
        name,
        description,
        city: communeLabel(city, postalCode),
        phone: phone || null,
        lat: point.lat.toFixed(2),
        lng: point.lng.toFixed(2),
      })
      .returning({ id: localPoints.id });

    await logAudit({ actorId: user.id, action: "creation_fiche_circuit", entityType: "local_point", entityId: String(created.id) });
    revalidateCircuits();
    return { ok: true, message: `Votre fiche est enregistrée dans « ${circuit.label} ».`, id: created.id };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connectez-vous pour déposer une fiche." };
    return { ok: false, error: "La fiche n'a pas pu être enregistrée." };
  }
}

/** Retire une de ses fiches (refusé si des réservations sont en cours). */
export async function deleteCircuitStructure(structureId: number): Promise<CircuitResult> {
  try {
    const user = await requireRole(["membre"]);
    if (!safeId(structureId)) return { ok: false, error: "Fiche introuvable." };
    const [structure] = await db.select().from(localPoints).where(eq(localPoints.id, structureId)).limit(1);
    if (!structure || structure.ownerId !== user.id) return { ok: false, error: "Fiche introuvable." };

    const pending = await db
      .select({ id: localOrders.id })
      .from(localOrders)
      .where(and(eq(localOrders.pointId, structureId), ne(localOrders.status, "recuperee"), ne(localOrders.status, "annulee")))
      .limit(1);
    if (pending.length) return { ok: false, error: "Des demandes sont en cours sur cette fiche : traitez-les avant de la retirer." };

    await db.delete(localPoints).where(eq(localPoints.id, structureId));
    await logAudit({ actorId: user.id, action: "suppression_fiche_circuit", entityType: "local_point", entityId: String(structureId) });
    revalidateCircuits();
    return { ok: true, message: "Fiche retirée des listes." };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connexion requise." };
    return { ok: false, error: "Suppression impossible." };
  }
}

/** Ajoute un produit (ou une proposition) sur une de ses fiches. */
export async function createCircuitItem(form: FormData): Promise<CircuitResult> {
  try {
    const user = await requireRole(["membre"]);
    const structureId = Number(value(form, "structureId"));
    if (!safeId(structureId)) return { ok: false, error: "Fiche introuvable." };
    const [structure] = await db.select().from(localPoints).where(eq(localPoints.id, structureId)).limit(1);
    if (!structure || structure.ownerId !== user.id) return { ok: false, error: "Fiche introuvable." };

    const circuit = circuitForPointKind(structure.kind);
    const name = value(form, "name");
    const description = value(form, "description").slice(0, 400);
    const category = value(form, "category").slice(0, 60) || circuit?.catalogue?.defaultCategory || "Produit fermier";
    const unit = value(form, "unit").slice(0, 30) || "l'unité";
    const price = numberValue(form, "price");
    const stock = Math.round(numberValue(form, "stock"));

    if (name.length < 2 || name.length > 160) return { ok: false, error: "Le nom doit contenir entre 2 et 160 caractères." };
    if (!Number.isFinite(price) || price < 0 || price > 9999) return { ok: false, error: "Indiquez un prix entre 0 et 9 999 €." };
    if (!Number.isInteger(stock) || stock < 0 || stock > 9999) return { ok: false, error: "Indiquez une quantité valide." };

    await db.insert(localProducts).values({ pointId: structureId, name, description, category, price: price.toFixed(2), unit, stock });
    await logAudit({ actorId: user.id, action: "ajout_produit_circuit", entityType: "local_product" });
    revalidateCircuits();
    return { ok: true, message: "Ajouté à votre fiche." };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connexion requise." };
    return { ok: false, error: "L'ajout n'a pas pu être enregistré." };
  }
}

export async function deleteCircuitItem(productId: number): Promise<CircuitResult> {
  try {
    const user = await requireRole(["membre"]);
    if (!safeId(productId)) return { ok: false, error: "Élément introuvable." };
    const [product] = await db.select().from(localProducts).where(eq(localProducts.id, productId)).limit(1);
    if (!product) return { ok: false, error: "Élément introuvable." };
    const [structure] = await db.select().from(localPoints).where(eq(localPoints.id, product.pointId)).limit(1);
    if (!structure || structure.ownerId !== user.id) return { ok: false, error: "Élément introuvable." };

    const linked = await db.select({ id: localOrders.id }).from(localOrders).where(and(eq(localOrders.productId, productId), ne(localOrders.status, "annulee"))).limit(1);
    if (linked.length) return { ok: false, error: "Cet élément porte déjà une demande : il ne peut plus être supprimé." };

    await db.delete(localProducts).where(eq(localProducts.id, productId));
    await logAudit({ actorId: user.id, action: "suppression_produit_circuit", entityType: "local_product", entityId: String(productId) });
    revalidateCircuits();
    return { ok: true, message: "Élément retiré." };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connexion requise." };
    return { ok: false, error: "Suppression impossible." };
  }
}

/** Réserve en retrait sur place. Aucun paiement ne passe par le site. */
export async function createCircuitOrder(form: FormData): Promise<CircuitResult> {
  try {
    const user = await requireRole(["membre"]);
    const circuit = requireCircuit(form);
    if ("error" in circuit) return { ok: false, error: circuit.error };
    const productId = Number(value(form, "productId"));
    if (!safeId(productId)) return { ok: false, error: "Élément introuvable." };
    const quantity = Math.round(numberValue(form, "quantity"));
    const pickupRaw = value(form, "pickupAt");
    const note = value(form, "note").slice(0, 300);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return { ok: false, error: "La quantité doit être entre 1 et 99." };

    const [product] = await db.select().from(localProducts).where(eq(localProducts.id, productId)).limit(1);
    if (!product) return { ok: false, error: "Élément introuvable." };
    const [structure] = await db.select().from(localPoints).where(eq(localPoints.id, product.pointId)).limit(1);
    if (!structure || !structure.isActive) return { ok: false, error: "Cette fiche n'est plus active." };
    if (structure.ownerId === user.id) return { ok: false, error: "Vous ne pouvez pas demander votre propre ligne." };
    if (product.stock < quantity) return { ok: false, error: `Quantité trop élevée : il reste ${product.stock} ligne(s) à demander.` };

    const pickupAt = pickupRaw ? new Date(pickupRaw) : null;
    if (pickupAt && Number.isNaN(pickupAt.getTime())) return { ok: false, error: "Date invalide." };

    const reference = `CIR-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    await db.insert(localOrders).values({
      reference,
      productId,
      pointId: structure.id,
      buyerId: user.id,
      quantity,
      pickupAt,
      note,
      status: "commandee",
    });
    await db.update(localProducts).set({ stock: product.stock - quantity }).where(eq(localProducts.id, productId));
    await createNotification({
      userId: structure.ownerId,
      title: circuit.words.demandTitle,
      body: `${reference} · ${quantity} × ${product.name} (${structure.city || structure.name})`,
      link: "/circuits",
    });
    await logAudit({ actorId: user.id, action: "reservation_circuit", entityType: "local_order", entityId: reference });
    revalidateCircuits();
    return { ok: true, message: `${circuit.words.demandWord} ${reference} : ${circuit.words.demandDone}` };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connectez-vous pour envoyer une demande." };
    return { ok: false, error: "La demande n'a pas pu être enregistrée." };
  }
}

/** Celle ou celui qui reçoit fait avancer la demande ; l'autre peut annuler. */
export async function updateCircuitOrderStatus(orderId: number, status: LocalOrderStatus, circuitKey: string): Promise<CircuitResult> {
  try {
    const user = await requireUser();
    const circuit = circuitFor(circuitKey);
    if (!circuit || circuit.status !== "ouvert") return { ok: false, error: "Circuit inconnu." };
    if (!safeId(orderId)) return { ok: false, error: "Demande introuvable." };
    const [order] = await db.select().from(localOrders).where(eq(localOrders.id, orderId)).limit(1);
    if (!order) return { ok: false, error: "Demande introuvable." };
    const [structure] = await db.select().from(localPoints).where(eq(localPoints.id, order.pointId)).limit(1);
    if (!structure) return { ok: false, error: "Fiche introuvable." };

    const isSeller = structure.ownerId === user.id;
    const isBuyer = order.buyerId === user.id;
    if (!isSeller && !isBuyer && user.role !== "administrateur") return { ok: false, error: "Vous n'êtes pas concerné par cette demande." };

    if (isBuyer && !isSeller) {
      if (status !== "annulee" || order.status === "recuperee") {
        return { ok: false, error: "Vous pouvez uniquement annuler une demande non aboutie." };
      }
    }
    if (isSeller && !["prete", "recuperee", "annulee"].includes(status)) return { ok: false, error: "Statut non autorisé." };

    // La quantité repart dans le stock quand une réservation est annulée.
    if (status === "annulee" && order.status !== "annulee" && order.status !== "recuperee") {
      const [product] = await db.select().from(localProducts).where(eq(localProducts.id, order.productId)).limit(1);
      if (product) await db.update(localProducts).set({ stock: product.stock + order.quantity }).where(eq(localProducts.id, product.id));
    }

    await db.update(localOrders).set({ status }).where(eq(localOrders.id, orderId));
    await createNotification({
      userId: isSeller ? order.buyerId : structure.ownerId,
      title: circuit.words.statusUpdateTitle,
      body: `${order.reference} · ${circuit.words.statusLabels?.[status] ?? DEFAULT_ORDER_STATUS_LABELS[status]}`,
      link: "/circuits",
    });
    await logAudit({ actorId: user.id, action: "statut_reservation_circuit", entityType: "local_order", entityId: String(orderId) });
    revalidateCircuits();
    return { ok: true, message: `${circuit.words.demandWord} mise à jour.` };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connexion requise." };
    return { ok: false, error: "Mise à jour impossible." };
  }
}

/* ------------------------------------------------------------------ *
 * Circuit des coups de main (personnes disponibles)                   *
 * ------------------------------------------------------------------ */

/** Déclare ou met à jour sa disponibilité. Le statut repasse à « disponible ». */
export async function setWorkerAvailability(form: FormData): Promise<CircuitResult> {
  try {
    const user = await requireRole(["membre"]);
    const circuit = requireCircuit(form);
    if ("error" in circuit) return { ok: false, error: circuit.error };

    const city = value(form, "city").slice(0, 100);
    const postalCode = value(form, "postalCode");
    const note = value(form, "availabilityNote").slice(0, 400);
    const skills = form.getAll("skills").map((item) => String(item).trim()).filter(Boolean).slice(0, 6);
    const point = resolvedPoint(form);

    if (!point) return { ok: false, error: POINT_ERROR };
    if (skills.length === 0) return { ok: false, error: "Indiquez au moins un coup de main que vous pouvez donner." };

    const [existing] = await db.select().from(workerAvailabilities).where(eq(workerAvailabilities.userId, user.id)).limit(1);
    const values = { city: communeLabel(city, postalCode), lat: point.lat.toFixed(2), lng: point.lng.toFixed(2), skills, availabilityNote: note, status: "disponible" as const };
    if (existing) {
      await db.update(workerAvailabilities).set(values).where(eq(workerAvailabilities.id, existing.id));
    } else {
      await db.insert(workerAvailabilities).values({ userId: user.id, ...values });
    }
    await logAudit({ actorId: user.id, action: "maj_disponibilite", entityType: "worker_availability" });
    revalidateCircuits();
    return { ok: true, message: "Votre disponibilité est publiée dans la liste." };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connectez-vous pour vous rendre disponible." };
    return { ok: false, error: "Enregistrement impossible." };
  }
}

/** Disponible ou suspendu : un seul interrupteur, effet immédiat sur la liste. */
export async function toggleWorkerAvailability(status: "disponible" | "indisponible"): Promise<CircuitResult> {
  try {
    const user = await requireRole(["membre"]);
    if (status !== "disponible" && status !== "indisponible") return { ok: false, error: "Statut inconnu." };
    const [existing] = await db.select().from(workerAvailabilities).where(eq(workerAvailabilities.userId, user.id)).limit(1);
    if (!existing) return { ok: false, error: "Aucune disponibilité enregistrée." };
    await db.update(workerAvailabilities).set({ status }).where(eq(workerAvailabilities.id, existing.id));
    await logAudit({ actorId: user.id, action: "statut_disponibilite", entityType: "worker_availability" });
    revalidateCircuits();
    return { ok: true, message: status === "disponible" ? "Vous êtes visible dans la liste." : "Votre disponibilité est suspendue : votre fiche quitte la liste." };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connexion requise." };
    return { ok: false, error: "Mise à jour impossible." };
  }
}
