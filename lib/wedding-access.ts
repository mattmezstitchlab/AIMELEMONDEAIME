import "server-only";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { journeys, projects, weddingAccessLinks, weddingGuests, type WeddingAccessRole } from "@/db/schema";
import { getAuthSecret } from "@/lib/secret";

export const WEDDING_ACCESS_COOKIE = "aime_wedding_access";

/** A 32-byte base64url bearer token. Store only its SHA-256 digest. */
export function hashWeddingToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isWeddingToken(token: string) {
  return /^[A-Za-z0-9_-]{40,60}$/.test(token);
}

export type RsvpInvite = {
  guestId: number;
  guestName: string;
  persons: number;
  status: string;
  projectTitle: string;
  city: string;
  weddingDate: string;
  expiresAt: Date;
};

/** Deliberately returns only the one household's RSVP fields and public event basics. */
export async function getWeddingRsvpInvite(token: string): Promise<RsvpInvite | null> {
  if (!isWeddingToken(token)) return null;
  const tokenHash = hashWeddingToken(token);
  const [guest] = await db
    .select({
      id: weddingGuests.id,
      projectId: weddingGuests.projectId,
      name: weddingGuests.name,
      persons: weddingGuests.persons,
      status: weddingGuests.status,
      expiresAt: weddingGuests.rsvpExpiresAt,
    })
    .from(weddingGuests)
    .where(eq(weddingGuests.rsvpTokenHash, tokenHash))
    .limit(1);
  if (!guest?.expiresAt || guest.expiresAt.getTime() <= Date.now()) return null;

  const [project] = await db
    .select({ title: projects.title, city: projects.city, status: projects.status })
    .from(projects)
    .where(eq(projects.id, guest.projectId))
    .limit(1);
  if (!project || project.status !== "ouvert") return null;

  const [journey] = await db
    .select({ answers: journeys.answers, situation: journeys.situation })
    .from(journeys)
    .where(and(eq(journeys.projectId, guest.projectId), eq(journeys.situation, "mariage")))
    .limit(1);
  if (!journey) return null;

  return {
    guestId: guest.id,
    guestName: guest.name,
    persons: guest.persons,
    status: guest.status,
    projectTitle: project.title,
    city: project.city,
    weddingDate: journey.answers.date ?? "",
    expiresAt: guest.expiresAt,
  };
}

export type WeddingAccessInvite = {
  id: number;
  projectId: number;
  label: string;
  role: WeddingAccessRole;
  expiresAt: Date;
  projectTitle: string;
  city: string;
  startsAt: Date;
};

/** Invitation preview only; no project workspace data is returned before accepting. */
export async function getWeddingAccessInvite(token: string): Promise<WeddingAccessInvite | null> {
  if (!isWeddingToken(token)) return null;
  const [link] = await db
    .select({
      id: weddingAccessLinks.id,
      projectId: weddingAccessLinks.projectId,
      label: weddingAccessLinks.label,
      role: weddingAccessLinks.role,
      expiresAt: weddingAccessLinks.expiresAt,
      revokedAt: weddingAccessLinks.revokedAt,
    })
    .from(weddingAccessLinks)
    .where(eq(weddingAccessLinks.tokenHash, hashWeddingToken(token)))
    .limit(1);
  if (!link || link.revokedAt || link.expiresAt.getTime() <= Date.now()) return null;

  const [project] = await db
    .select({ title: projects.title, city: projects.city, startsAt: projects.startsAt, status: projects.status })
    .from(projects)
    .where(eq(projects.id, link.projectId))
    .limit(1);
  if (!project || project.status !== "ouvert") return null;
  return {
    id: link.id,
    projectId: link.projectId,
    label: link.label,
    role: link.role,
    expiresAt: link.expiresAt,
    projectTitle: project.title,
    city: project.city,
    startsAt: project.startsAt,
  };
}

export type WeddingAccessSession = {
  linkId: number;
  projectId: number;
  role: WeddingAccessRole;
  expiresAt: Date;
};

/** Validates the signed, HttpOnly access cookie and re-checks revocation/expiry in PostgreSQL. */
export async function getWeddingAccessSession(expectedLinkId?: number): Promise<WeddingAccessSession | null> {
  const store = await cookies();
  const token = store.get(WEDDING_ACCESS_COOKIE)?.value;
  if (!token) return null;

  let payload: Record<string, unknown>;
  try {
    const verified = await jwtVerify(token, getAuthSecret());
    payload = verified.payload as Record<string, unknown>;
  } catch {
    return null;
  }

  const linkId = Number(payload.linkId);
  const projectId = Number(payload.projectId);
  const role = payload.role;
  if (
    payload.type !== "wedding-access" ||
    !Number.isSafeInteger(linkId) ||
    !Number.isSafeInteger(projectId) ||
    (role !== "coordination" && role !== "temoin") ||
    (expectedLinkId !== undefined && expectedLinkId !== linkId)
  ) return null;

  const [link] = await db
    .select({ id: weddingAccessLinks.id, projectId: weddingAccessLinks.projectId, role: weddingAccessLinks.role, expiresAt: weddingAccessLinks.expiresAt, revokedAt: weddingAccessLinks.revokedAt })
    .from(weddingAccessLinks)
    .where(and(eq(weddingAccessLinks.id, linkId), eq(weddingAccessLinks.projectId, projectId)))
    .limit(1);
  if (!link || link.revokedAt || link.expiresAt.getTime() <= Date.now() || link.role !== role) return null;

  return { linkId: link.id, projectId: link.projectId, role: link.role, expiresAt: link.expiresAt };
}
