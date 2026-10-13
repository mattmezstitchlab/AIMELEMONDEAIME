import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getAuthSecret } from "@/lib/secret";

// Nom du cookie de session (défini dans lib/auth.ts).
const COOKIE_NAME = "msa_session";
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
// Chemins dont les écritures restent permises en visite guidée : se connecter
// à un vrai compte ou s'inscrire (ces formulaires POSTent sur leur propre page).
const ALLOWED_WRITE_PATHS = new Set(["/connexion", "/inscription"]);

const READ_ONLY_PAGE = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Visite guidée — lecture seule</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font-family:system-ui,sans-serif;background:#f7f7f5;color:#1d1d1f;display:grid;place-items:center;min-height:100vh;margin:0}main{background:#fff;border:1px solid #e7e5e4;border-radius:16px;padding:32px;max-width:26rem;margin:16px}h1{font-size:1.25rem;margin:0 0 8px}p{color:#475569;line-height:1.5}a{color:#065f46;font-weight:700}</style></head>
<body><main><h1>Visite guidée : lecture seule</h1>
<p>Cette action est désactivée pendant la visite de démonstration. Rien n'a été modifié ni envoyé.</p>
<p><a href="/espace">← Retour à la visite</a> · <a href="/deconnexion">Quitter la visite</a></p>
</main></body></html>`;

/**
 * Lecture seule de la visite guidée (chantier 5) : la session du compte de
 * démonstration porte le marqueur `demo` (voir loginAsDemo). Toutes les
 * écritures — actions serveur et routes API — sont refusées ici, en un seul
 * point, quelle que soit la page d'où elles partent. Les lectures (GET)
 * restent libres : le visiteur parcourt la vraie interface.
 */
export async function proxy(request: NextRequest) {
  if (!WRITE_METHODS.has(request.method)) return NextResponse.next();
  if (ALLOWED_WRITE_PATHS.has(request.nextUrl.pathname)) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.next();

  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    if (payload.demo === true) {
      return new NextResponse(READ_ONLY_PAGE, {
        status: 403,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  } catch {
    // Session illisible ou expirée : l'application gérera l'authentification.
  }
  return NextResponse.next();
}

export const config = {
  // Tout sauf les assets statiques (qui ne reçoivent de toute façon que des GET).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
