import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

let cached: Uint8Array | null = null;

/**
 * Secret de signature des sessions.
 * 1. Variable d'environnement AUTH_SECRET si elle est définie.
 * 2. Sinon, secret aléatoire généré au premier lancement et conservé dans `.auth-secret`
 *    (la plateforme de prévisualisation réinitialise `.env`). Jamais de valeur par défaut connue.
 */
export function getAuthSecret(): Uint8Array {
  if (cached) return cached;
  let value = process.env.AUTH_SECRET;
  if (!value) {
    const file = path.join(process.cwd(), ".auth-secret");
    try {
      value = fs.readFileSync(file, "utf8").trim();
    } catch {
      value = "";
    }
    if (value.length < 32) {
      value = crypto.randomBytes(32).toString("hex");
      try {
        fs.writeFileSync(file, value, { mode: 0o600 });
      } catch {
        // Système de fichiers en lecture seule : secret éphémère (les sessions expirent au redémarrage).
      }
    }
  }
  cached = new TextEncoder().encode(value);
  return cached;
}
