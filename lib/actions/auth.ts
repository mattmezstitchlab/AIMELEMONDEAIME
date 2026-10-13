"use server";

import { db } from "@/db";
import { users, type Role } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, setSessionCookie, DEMO_ACCOUNT_EMAIL } from "@/lib/auth";
import { loginSchema, registerSchema, parseOrError } from "@/lib/validation";
import { clientIp, hitRateLimit, clearRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { redirect } from "next/navigation";

export type ActionResult = { ok: true } | { ok: false; error: string };

function safeDestination(value: FormDataEntryValue | null, role: Role): string {
  const fallback = role === "membre" ? "/espace" : role === "gestionnaire" ? "/back-office" : "/admin";
  if (typeof value !== "string" || value.length > 500 || !value.startsWith("/") || value.startsWith("//") || /[\\\r\n]/.test(value)) return fallback;
  try {
    const url = new URL(value, "https://aime.local");
    if (url.origin !== "https://aime.local") return fallback;
    const allowed = role === "membre" ? ["/espace"] : role === "gestionnaire" ? ["/back-office"] : ["/admin", "/back-office"];
    if (!allowed.some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))) return fallback;
    return url.pathname + url.search;
  } catch {
    return fallback;
  }
}

export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = parseOrError(loginSchema, {
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
  });
  if (!parsed.ok) return { ok: false, error: parsed.error };

  // Anti-bourrage : 10 tentatives par quart d'heure et par couple IP + compte.
  const loginKey = `connexion:${await clientIp()}:${parsed.data.email.toLowerCase()}`;
  if (hitRateLimit(loginKey, 10, 15 * 60_000)) {
    return { ok: false, error: "Trop de tentatives de connexion. Réessayez dans quelques minutes." };
  }

  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email.toLowerCase())).limit(1);
  if (!user || !user.isActive) {
    return { ok: false, error: "Identifiants incorrects." };
  }
  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { ok: false, error: "Identifiants incorrects." };
  }

  clearRateLimit(loginKey);
  await setSessionCookie({ userId: user.id, role: user.role, fullName: user.fullName, email: user.email });
  await logAudit({ actorId: user.id, action: "connexion", entityType: "user", entityId: user.id });

  redirect(safeDestination(formData.get("next"), user.role));
}

export async function registerAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const raw = {
    fullName: String(formData.get("fullName") || ""),
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    phone: String(formData.get("phone") || ""),
    situation: String(formData.get("situation") || "") || undefined,
    officeId: String(formData.get("officeId") || "") || undefined,
    address: String(formData.get("address") || ""),
    city: String(formData.get("city") || ""),
    postalCode: String(formData.get("postalCode") || ""),
    birthDate: String(formData.get("birthDate") || ""),
    familyStatus: String(formData.get("familyStatus") || ""),
  };
  const parsed = parseOrError(registerSchema, raw);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  // Anti-abus : 10 créations de compte par heure et par adresse IP.
  if (hitRateLimit(`inscription:${await clientIp()}`, 10, 60 * 60_000)) {
    return { ok: false, error: "Trop de créations de compte. Réessayez plus tard." };
  }

  const birth = new Date(parsed.data.birthDate);
  const adultAt = new Date(birth);
  adultAt.setFullYear(adultAt.getFullYear() + 18);
  if (Number.isNaN(birth.getTime()) || adultAt > new Date()) {
    return { ok: false, error: "L'inscription est réservée aux adultes. Les activités pour enfants passent par leurs responsables légaux ou une structure encadrante." };
  }

  const [existing] = await db.select().from(users).where(eq(users.email, parsed.data.email.toLowerCase())).limit(1);
  if (existing) {
    return { ok: false, error: "Un compte existe déjà avec cette adresse e-mail." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const [created] = await db
    .insert(users)
    .values({
      fullName: parsed.data.fullName,
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      role: "membre",
      phone: parsed.data.phone || null,
      situation: parsed.data.situation ?? null,
      officeId: parsed.data.officeId ?? null,
      address: parsed.data.address || null,
      city: parsed.data.city,
      postalCode: parsed.data.postalCode || null,
      birthDate: parsed.data.birthDate,
      familyStatus: parsed.data.familyStatus || null,
      displayName: parsed.data.fullName.split(" ")[0],
      profileCity: parsed.data.city,
      onboardingCompleted: true,
    })
    .returning();

  await setSessionCookie({ userId: created.id, role: created.role, fullName: created.fullName, email: created.email });
  await logAudit({ actorId: created.id, action: "creation_compte", entityType: "user", entityId: created.id });

  redirect("/espace");
}

/**
 * Connexion en un clic à la visite guidée (chantier 5) : aucun mot de passe,
 * mais uniquement pour le compte de démonstration explicitement marqué
 * `isDemo` en base. La session porte le marqueur `demo` : le proxy bloque
 * alors toutes les écritures (lecture seule dans la vraie interface).
 */
export async function loginAsDemo() {
  const [user] = await db.select().from(users).where(eq(users.email, DEMO_ACCOUNT_EMAIL)).limit(1);
  if (!user || !user.isDemo || !user.isActive || user.role !== "membre") {
    redirect("/decouvrir?indisponible=1");
  }
  await setSessionCookie({ userId: user.id, role: user.role, fullName: user.fullName, email: user.email, demo: true });
  await logAudit({ actorId: user.id, action: "connexion_visite_guidee", entityType: "user", entityId: user.id });
  redirect("/espace");
}
