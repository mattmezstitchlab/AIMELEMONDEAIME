import "server-only";

import { headers } from "next/headers";

/**
 * Limitation de débit en mémoire (par processus).
 * Protège connexion et inscription contre le bourrage d'identifiants.
 * Limite connue : sur un hébergement multi-instances, chaque instance a son
 * propre compteur — pour une protection globale, brancher un stockage partagé
 * (Redis, base) derrière cette même interface.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export async function clientIp(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return store.get("x-real-ip") ?? "inconnu";
}

/** Renvoie true si la clé a dépassé `limit` tentatives dans la fenêtre `windowMs`. Enregistre la tentative au passage. */
export function hitRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}

/** Efface le compteur après une authentification réussie. */
export function clearRateLimit(key: string) {
  buckets.delete(key);
}
