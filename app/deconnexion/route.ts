import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

/**
 * Déconnexion par lien (GET) : utilisée par toutes les coquilles connectées.
 * Un GET plutôt qu'une action POST permet aussi de quitter la visite guidée,
 * dont le proxy bloque les écritures. Effet de bord limité à la session
 * de l'appelant (effacement de son propre cookie).
 */
export async function GET(request: Request) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/", request.url));
}
