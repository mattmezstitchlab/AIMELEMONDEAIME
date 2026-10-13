import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, type Role } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSecret } from "@/lib/secret";

const COOKIE_NAME = "msa_session";

/** Adresse du compte de visite guidée (créé par le seed de démonstration). */
export const DEMO_ACCOUNT_EMAIL = "demo@aime-demo.fr";
const secret = getAuthSecret();

export type SessionPayload = {
  userId: number;
  role: Role;
  fullName: string;
  email: string;
  /** Session de visite guidée : écritures bloquées par le proxy (lecture seule). */
  demo?: boolean;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  try {
    const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (!user || !user.isActive) return null;
    return user;
  } catch {
    // Base momentanément injoignable : dégrader en visiteur plutôt que de
    // faire échouer toutes les pages (le layout racine appelle cette fonction).
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Authentification requise.");
  }
  return user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role as Role)) {
    throw new AuthError("Accès refusé.");
  }
  return user;
}

export class AuthError extends Error {}
