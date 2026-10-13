/**
 * Correspondance centralisée message d'erreur métier → code HTTP,
 * pour les routes REST qui encapsulent les actions communautaires.
 * (Avant : chaque route devinait le statut avec ses propres `includes`.)
 */
export type CommunityErrorKind = "creation" | "demande" | "decision" | "message";

export function communityErrorStatus(kind: CommunityErrorKind, error: string): number {
  const needsAuth = error.includes("Connectez-vous") || error.includes("Connexion requise") || error.includes("Connexion");
  switch (kind) {
    case "creation":
      return needsAuth ? 401 : 400;
    case "demande":
      return needsAuth ? 401 : 400;
    case "decision":
      return needsAuth || error.includes("réservé") || error.includes("Seul") || error.includes("Seule") ? 403 : 409;
    case "message":
      if (needsAuth) return 401;
      return error.includes("participants") ? 403 : 400;
  }
}
