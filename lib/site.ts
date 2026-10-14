/**
 * L'adresse publique du site, écrite une seule fois.
 *
 * En production, elle vient de `NEXT_PUBLIC_SITE_URL` (voir `.env.example`).
 * À défaut, l'adresse du déploiement sert de repli pour que les aperçus de
 * partage, le plan du site et la canonique restent justes sans réglage ; en
 * local, c'est `localhost`. Jamais de barre oblique finale : les chemins des
 * pages commencent tous par `/`.
 */
const configured =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const SITE_URL = configured.replace(/\/+$/, "");
