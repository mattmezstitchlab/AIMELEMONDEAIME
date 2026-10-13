"use server";

import { revalidatePath } from "next/cache";
import { eq, and, ne } from "drizzle-orm";
import { db } from "@/db";
import { localOrders, localPoints, localProducts, workerAvailabilities, type LocalOrderStatus } from "@/db/schema";
import { requireRole, requireUser, AuthError } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/queries";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const POINT_KINDS = ["producteur", "presence"] as const;

function formString(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function formNumber(form: FormData, key: string) {
  const raw = formString(form, key).replace(",", ".");
  const value = Number(raw);
  return Number.isFinite(value) ? value : NaN;
}

function inFrance(lat: number, lng: number) {
  return lat >= 41 && lat <= 51.5 && lng >= -5.5 && lng <= 9.8;
}

/** Dépose un point (production ou présence) sur la carte. Réservé aux adhérents. */
export async function createLocalPoint(form: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(["membre"]);
    const kind = formString(form, "kind");
    const name = formString(form, "name");
    const description = formString(form, "description").slice(0, 600);
    const city = formString(form, "city").slice(0, 120);
    const phone = formString(form, "phone").slice(0, 30);
    const lat = formNumber(form, "lat");
    const lng = formNumber(form, "lng");

    if (!POINT_KINDS.includes(kind as (typeof POINT_KINDS)[number])) return { ok: false, error: "Choisissez un type de point." };
    if (name.length < 3 || name.length > 160) return { ok: false, error: "Le nom doit contenir entre 3 et 160 caractères." };
    if (!inFrance(lat, lng)) return { ok: false, error: "Placez le point sur le territoire français." };

    await db.insert(localPoints).values({ ownerId: user.id, kind: kind as "producteur", name, description, city, phone, lat: String(lat), lng: String(lng) });
    await logAudit({ actorId: user.id, action: "creation_point_local", entityType: "local_point" });
    revalidatePath("/carte");
    return { ok: true, message: "Votre point est visible sur la carte." };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connectez-vous pour déposer un point." };
    return { ok: false, error: "Le point n'a pas pu être enregistré." };
  }
}

/** Retire un de ses points (interdit s'il porte des commandes en cours). */
export async function deleteLocalPoint(pointId: number): Promise<ActionResult> {
  try {
    const user = await requireRole(["membre"]);
    const [point] = await db.select().from(localPoints).where(eq(localPoints.id, pointId)).limit(1);
    if (!point || point.ownerId !== user.id) return { ok: false, error: "Point introuvable." };
    const pending = await db.select({ id: localOrders.id }).from(localOrders)
      .where(and(eq(localOrders.pointId, pointId), ne(localOrders.status, "recuperee"), ne(localOrders.status, "annulee"))).limit(1);
    if (pending.length) return { ok: false, error: "Des commandes sont en cours sur ce point : traitez-les avant de le retirer." };
    await db.delete(localPoints).where(eq(localPoints.id, pointId));
    await logAudit({ actorId: user.id, action: "suppression_point_local", entityType: "local_point", entityId: String(pointId) });
    revalidatePath("/carte");
    return { ok: true, message: "Point retiré de la carte." };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connexion requise." };
    return { ok: false, error: "Suppression impossible." };
  }
}

/** Ajoute un produit sur un de ses points. */
export async function addLocalProduct(form: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(["membre"]);
    const pointId = Number(formString(form, "pointId"));
    const name = formString(form, "name");
    const description = formString(form, "description").slice(0, 400);
    const category = formString(form, "category").slice(0, 60) || "Produit fermier";
    const unit = formString(form, "unit").slice(0, 30) || "l'unité";
    const price = formNumber(form, "price");
    const stock = Math.round(formNumber(form, "stock"));

    const [point] = await db.select().from(localPoints).where(eq(localPoints.id, pointId)).limit(1);
    if (!point || point.ownerId !== user.id) return { ok: false, error: "Point introuvable." };
    if (name.length < 2 || name.length > 160) return { ok: false, error: "Le nom du produit doit contenir entre 2 et 160 caractères." };
    if (!Number.isFinite(price) || price < 0 || price > 9999) return { ok: false, error: "Indiquez un prix entre 0 et 9 999 €." };
    if (!Number.isInteger(stock) || stock < 0 || stock > 9999) return { ok: false, error: "Indiquez un stock valide." };

    await db.insert(localProducts).values({ pointId, name, description, category, price: price.toFixed(2), unit, stock });
    await logAudit({ actorId: user.id, action: "ajout_produit_local", entityType: "local_product" });
    revalidatePath("/carte");
    return { ok: true, message: "Produit ajouté à votre point." };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connexion requise." };
    return { ok: false, error: "Le produit n'a pas pu être ajouté." };
  }
}

export async function deleteLocalProduct(productId: number): Promise<ActionResult> {
  try {
    const user = await requireRole(["membre"]);
    const [product] = await db.select().from(localProducts).where(eq(localProducts.id, productId)).limit(1);
    if (!product) return { ok: false, error: "Produit introuvable." };
    const [point] = await db.select().from(localPoints).where(eq(localPoints.id, product.pointId)).limit(1);
    if (!point || point.ownerId !== user.id) return { ok: false, error: "Produit introuvable." };
    const linked = await db.select({ id: localOrders.id }).from(localOrders)
      .where(and(eq(localOrders.productId, productId), ne(localOrders.status, "annulee"))).limit(1);
    if (linked.length) return { ok: false, error: "Ce produit a déjà été commandé : il ne peut plus être supprimé." };
    await db.delete(localProducts).where(eq(localProducts.id, productId));
    await logAudit({ actorId: user.id, action: "suppression_produit_local", entityType: "local_product", entityId: String(productId) });
    revalidatePath("/carte");
    return { ok: true, message: "Produit retiré." };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connexion requise." };
    return { ok: false, error: "Suppression impossible." };
  }
}

/** Commande un produit en retrait sur place (aucun paiement en ligne). */
export async function createLocalOrder(form: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(["membre"]);
    const productId = Number(formString(form, "productId"));
    const quantity = Math.round(formNumber(form, "quantity"));
    const pickupRaw = formString(form, "pickupAt");
    const note = formString(form, "note").slice(0, 300);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return { ok: false, error: "La quantité doit être entre 1 et 99." };

    const [product] = await db.select().from(localProducts).where(eq(localProducts.id, productId)).limit(1);
    if (!product) return { ok: false, error: "Produit introuvable." };
    const [point] = await db.select().from(localPoints).where(eq(localPoints.id, product.pointId)).limit(1);
    if (!point || !point.isActive) return { ok: false, error: "Ce point n'est plus actif." };
    if (point.ownerId === user.id) return { ok: false, error: "Vous ne pouvez pas commander votre propre produit." };
    if (product.stock < quantity) return { ok: false, error: `Stock insuffisant : ${product.stock} disponible(s).` };

    const pickupAt = pickupRaw ? new Date(pickupRaw) : null;
    if (pickupAt && Number.isNaN(pickupAt.getTime())) return { ok: false, error: "Date de retrait invalide." };

    const reference = `LOC-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    await db.insert(localOrders).values({
      reference,
      productId,
      pointId: point.id,
      buyerId: user.id,
      quantity,
      pickupAt,
      note,
      status: "commandee",
    });
    await db.update(localProducts).set({ stock: product.stock - quantity }).where(eq(localProducts.id, productId));
    await createNotification({
      userId: point.ownerId,
      title: "Nouvelle commande sur votre point",
      body: `${reference} · ${quantity} × ${product.name} (${point.city || point.name})`,
      link: "/carte",
    });
    await logAudit({ actorId: user.id, action: "commande_locale", entityType: "local_order", entityId: reference });
    revalidatePath("/carte");
    return { ok: true, message: `Commande ${reference} enregistrée. Retrait sur place.` };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connectez-vous pour commander." };
    return { ok: false, error: "La commande n'a pas pu être enregistrée." };
  }
}

/** Le vendeur fait avancer la commande ; l'acheteur peut annuler. */
export async function updateLocalOrderStatus(orderId: number, status: LocalOrderStatus): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const [order] = await db.select().from(localOrders).where(eq(localOrders.id, orderId)).limit(1);
    if (!order) return { ok: false, error: "Commande introuvable." };
    const [point] = await db.select().from(localPoints).where(eq(localPoints.id, order.pointId)).limit(1);
    if (!point) return { ok: false, error: "Point introuvable." };

    const isSeller = point.ownerId === user.id;
    const isBuyer = order.buyerId === user.id;
    if (!isSeller && !isBuyer && user.role !== "administrateur") return { ok: false, error: "Vous n'êtes pas concerné par cette commande." };

    if (isBuyer && !isSeller) {
      if (status !== "annulee" || order.status === "recuperee") {
        return { ok: false, error: "Vous pouvez uniquement annuler une commande non récupérée." };
      }
    }
    if (isSeller) {
      if (!["prete", "recuperee", "annulee"].includes(status)) return { ok: false, error: "Statut non autorisé." };
    }

    // Remise en stock si la commande est annulée alors qu'elle consommait du stock
    if (status === "annulee" && order.status !== "annulee" && order.status !== "recuperee") {
      const [product] = await db.select().from(localProducts).where(eq(localProducts.id, order.productId)).limit(1);
      if (product) await db.update(localProducts).set({ stock: product.stock + order.quantity }).where(eq(localProducts.id, product.id));
    }

    await db.update(localOrders).set({ status }).where(eq(localOrders.id, orderId));
    await createNotification({
      userId: isSeller ? order.buyerId : point.ownerId,
      title: "Mise à jour de votre commande",
      body: `${order.reference} · ${ORDER_STATUS_LABELS[status]}`,
      link: "/carte",
    });
    await logAudit({ actorId: user.id, action: "statut_commande_locale", entityType: "local_order", entityId: String(orderId) });
    revalidatePath("/carte");
    return { ok: true, message: "Commande mise à jour." };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connexion requise." };
    return { ok: false, error: "Mise à jour impossible." };
  }
}

const ORDER_STATUS_LABELS: Record<LocalOrderStatus, string> = {
  commandee: "En attente de préparation",
  prete: "Prête à être retirée",
  recuperee: "Récupérée",
  annulee: "Annulée",
};

/** Déclare ou met à jour sa disponibilité pour des missions de proximité. */
export async function setWorkerAvailability(form: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(["membre"]);
    const city = formString(form, "city").slice(0, 120);
    const lat = formNumber(form, "lat");
    const lng = formNumber(form, "lng");
    const note = formString(form, "availabilityNote").slice(0, 400);
    const skills = form.getAll("skills").map((value) => String(value).trim()).filter(Boolean).slice(0, 6);

    if (!inFrance(lat, lng)) return { ok: false, error: "Placez votre disponibilité sur le territoire français." };
    if (skills.length === 0) return { ok: false, error: "Indiquez au moins une mission que vous pouvez accomplir." };

    const [existing] = await db.select().from(workerAvailabilities).where(eq(workerAvailabilities.userId, user.id)).limit(1);
    if (existing) {
      await db.update(workerAvailabilities).set({ city, lat: String(lat), lng: String(lng), skills, availabilityNote: note, status: "disponible" })
        .where(eq(workerAvailabilities.id, existing.id));
    } else {
      await db.insert(workerAvailabilities).values({ userId: user.id, city, lat: String(lat), lng: String(lng), skills, availabilityNote: note, status: "disponible" });
    }
    await logAudit({ actorId: user.id, action: "maj_disponibilite", entityType: "worker_availability" });
    revalidatePath("/carte");
    return { ok: true, message: "Votre disponibilité est publiée sur la carte." };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connectez-vous pour vous rendre disponible." };
    return { ok: false, error: "Enregistrement impossible." };
  }
}

/** Active ou suspend sa disponibilité. */
export async function toggleWorkerAvailability(status: "disponible" | "indisponible"): Promise<ActionResult> {
  try {
    const user = await requireRole(["membre"]);
    const [existing] = await db.select().from(workerAvailabilities).where(eq(workerAvailabilities.userId, user.id)).limit(1);
    if (!existing) return { ok: false, error: "Aucune disponibilité enregistrée." };
    await db.update(workerAvailabilities).set({ status }).where(eq(workerAvailabilities.id, existing.id));
    await logAudit({ actorId: user.id, action: "statut_disponibilite", entityType: "worker_availability" });
    revalidatePath("/carte");
    return { ok: true, message: status === "disponible" ? "Vous êtes visible sur la carte." : "Votre disponibilité est suspendue." };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Connexion requise." };
    return { ok: false, error: "Mise à jour impossible." };
  }
}

