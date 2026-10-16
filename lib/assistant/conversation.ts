import { normalize } from "./engine";
import { type AssistantRole, type Suggestion } from "./registry";

/** Local et déterministe : aucune question ni donnée personnelle envoyée à un tiers. */
export function requestText(input: string): string {
  return input.trim().replace(/^(bonjour|salut|bonsoir|coucou)\b[\s,!:.—-]*/i, "")
    .replace(/\bs['’]il (?:vous|te) pla[îi]t\s*[.!?]*$/i, "").trim();
}

export function conversationCommand(input: string) {
  const text = normalize(input);
  if (!text || /^(bonjour|salut|bonsoir|coucou)$/.test(text)) return "hello";
  if (/^(merci|merci beaucoup|super merci|c est parfait)$/.test(text)) return "thanks";
  if (/^(suivant|suivante|continuer|on continue|et ensuite|c est fait|j ai termine)$/.test(text)) return "next";
  if (/^(precedent|precedente|retour|revenir en arriere)$/.test(text)) return "previous";
  if (/^(stop|arreter|annuler|pause|plus tard|quitter le guide)$/.test(text)) return "stop";
  if (/^(aide|aidez moi|guidez moi|je suis perdu|je suis perdue|je ne comprends pas|je suis bloque|je suis bloquee|que peux tu faire)$/.test(text)) return "help";
  if (/^(reprendre|on reprend|reprendre mon brouillon)$/.test(text)) return "resume";
  return null;
}

export const GUIDE_FINISHED = "Nous avons fait le tour du guide. Je n’ai pas vérifié les actions réalisées dans les formulaires : leur confirmation à l’écran fait foi. Voulez-vous poursuivre avec un autre besoin ?";

const destinations: { pattern: RegExp; href: string; label: string; roles?: AssistantRole[] }[] = [
  { pattern: /\b(accueil|page principale)\b/, href: "/", label: "Revenir à l’accueil" },
  { pattern: /\b(inscription|inscrire|creer mon espace|creer un compte)\b/, href: "/inscription", label: "Voir les conditions de création d’un espace" },
  { pattern: /\b(connexion|connecter)\b/, href: "/connexion", label: "Ouvrir la connexion" },
  { pattern: /\b(profil|coordonnees|confidentialite)\b/, href: "/espace/profil", label: "Ouvrir mon profil", roles: ["membre"] },
  { pattern: /\b(producteur|producteurs|produits locaux)\b/, href: "/circuits/producteurs", label: "Trouver des producteurs" },
  { pattern: /\b(artisan|artisans|reparer)\b/, href: "/circuits/artisans", label: "Trouver un artisan" },
  { pattern: /\b(association|associations|collectif)\b/, href: "/circuits/associations", label: "Trouver une association" },
  { pattern: /\b(trajet|trajets|covoiturage)\b/, href: "/circuits/transports", label: "Voir les trajets" },
  { pattern: /\b(coup de main|coups de main|entraide|benevole)\b/, href: "/circuits/coups-de-main", label: "Trouver un coup de main" },
  { pattern: /\b(logement|logements|hebergement)\b/, href: "/circuits/logements", label: "Explorer les logements" },
  { pattern: /\b(savoir faire|transmettre un savoir|transmission)\b/, href: "/circuits/transmission", label: "Partager un savoir-faire" },
  { pattern: /\b(circuits|explorer le site)\b/, href: "/circuits", label: "Explorer les circuits" },
  { pattern: /\b(annonce|annonces|donner|preter|publier|projet|projets)\b/, href: "/le-monde-aime", label: "Ouvrir Le Monde Aime" },
  { pattern: /\b(guide|guides|informations)\b/, href: "/informations", label: "Consulter les informations" },
  { pattern: /\b(bureau|annuaire|telephone|humain)\b/, href: "/annuaire", label: "Trouver un interlocuteur" },
];

export function navigationChoices(input: string, role: AssistantRole, accountsEnabled = true): Suggestion[] {
  const text = normalize(input);
  return destinations.filter((d) => (!d.roles || d.roles.includes(role)) && d.pattern.test(text))
    .slice(0, 3).map(({ label, href }) => !accountsEnabled && (href === "/inscription" || href === "/connexion")
      ? { label: "Comprendre l’accès à Mon espace (comptes fermés)", href: "/mon-espace", kind: "link" }
      : { label, href, kind: "link" });
}

/** Choisir une navigation n'est jamais confirmer une carte d'action. */
export function suggestedChoice(input: string, chips: Suggestion[]): Suggestion | undefined {
  const text = normalize(input);
  const ordinals = [ /^(1|le premier|la premiere|premier|premiere)$/, /^(2|le deuxieme|la deuxieme|deuxieme|le second|la seconde)$/, /^(3|le troisieme|la troisieme|troisieme)$/ ];
  const index = ordinals.findIndex((pattern) => pattern.test(text));
  const choice = index >= 0 ? chips[index] : chips.find((chip) => normalize(chip.label) === text);
  return choice?.kind !== "reponse" ? choice : undefined;
}
