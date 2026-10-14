import "server-only";

/**
 * Interrupteur des comptes utilisateurs.
 *
 * Tant que `AIME_AUTH_ENABLED` n'est pas à `1`, le site fonctionne **sans
 * compte** : aucune inscription, aucun mot de passe, aucune connexion. Les
 * surfaces publiques restent entièrement consultables ; les espaces de travail
 * (Mon espace, back-office, administration) sont fermés.
 *
 * Le code des comptes, des rôles et des sessions reste en place et testé :
 * réactiver l'authentification se limite à définir `AIME_AUTH_ENABLED=1`
 * (voir README, section « Comptes et connexion »).
 *
 * La visite guidée (`/decouvrir`) ne demande aucun identifiant : elle reste
 * disponible pour montrer l'interface réelle quand une base est configurée.
 */
export const AUTH_ENABLED = process.env.AIME_AUTH_ENABLED === "1";

/** Message unique affiché partout où une action demande normalement un compte. */
export const AUTH_DISABLED_NOTICE =
  "Les comptes AIME® sont fermés pour le moment : la plateforme est en cours de préparation. " +
  "Vous pouvez consulter librement les parcours, les guides et la carte du territoire.";

/** Routes réservées aux personnes connectées : fermées tant que l'auth est coupée. */
export const PROTECTED_PREFIXES = ["/espace", "/back-office", "/admin"] as const;

/** Adresse de la porte « espace personnel » : formulaire ou explication. */
export const SPACE_HREF = "/mon-espace";

/** Vers où renvoyer quelqu'un qui a besoin d'un compte. */
export function loginHref() {
  return AUTH_ENABLED ? "/connexion" : SPACE_HREF;
}

export function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
