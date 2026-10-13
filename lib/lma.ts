/** Constantes partagées (client + serveur) de Le Monde Aime. */

export const BRAND = {
  name: "Le Monde Aime",
  line1: "La terre, les arts et les générations.",
  line2: "Trouvez près de vous de quoi vivre, créer et transmettre.",
} as const;

export type UniverseKey = "terre" | "arts" | "savoirs";

export const UNIVERSES: Array<{ key: UniverseKey; label: string; short: string; description: string; icon: "sprout" | "music" | "graduation"; image: string }> = [
  {
    key: "terre",
    label: "Terre & quotidien",
    short: "Terre",
    description: "Produits locaux, artisanat, dons, prêts, locations, trajets, jardins partagés et découverte des métiers.",
    icon: "sprout",
    image: "/images/hero-emploi.jpg",
  },
  {
    key: "arts",
    label: "Arts & rencontres",
    short: "Arts",
    description: "Musiciens, artistes, techniciens, lieux culturels, concerts, ateliers, matériel et espaces de répétition.",
    icon: "music",
    image: "/images/hero-famille.jpg",
  },
  {
    key: "savoirs",
    label: "Savoirs & générations",
    short: "Savoirs",
    description: "Transmission de savoir-faire, cuisine, couture, réparation, musique, récits de vie et mémoire locale.",
    icon: "graduation",
    image: "/images/hero-retraite.jpg",
  },
];

export const UNIVERSE_LABEL: Record<string, string> = Object.fromEntries(UNIVERSES.map((u) => [u.key, u.label]));

/** Catégories de publication (hors trajets, qui ont leur propre formulaire). */
export const LISTING_CATEGORIES: Array<{ value: string; label: string; universes: UniverseKey[] }> = [
  { value: "produits_locaux", label: "Produits locaux et agriculture", universes: ["terre"] },
  { value: "besoins_essentiels", label: "Dons et besoins essentiels", universes: ["terre"] },
  { value: "objets_materiel", label: "Objets et matériel", universes: ["terre"] },
  { value: "evenementiel", label: "Matériel pour événement (tables, sono…)", universes: ["terre", "arts"] },
  { value: "arts_rencontres", label: "Concerts, ateliers, prestations artistiques", universes: ["arts"] },
  { value: "lieux_espaces", label: "Lieux et espaces (répétition, salle, jardin)", universes: ["arts", "terre"] },
  { value: "savoirs_transmission", label: "Savoir-faire et transmission", universes: ["savoirs"] },
];

export function defaultUniverses(category: string): UniverseKey[] {
  return LISTING_CATEGORIES.find((c) => c.value === category)?.universes ?? ["terre"];
}

export const CATEGORY_LABELS: Record<string, string> = {
  ...Object.fromEntries(LISTING_CATEGORIES.map((c) => [c.value, c.label])),
  trajets_livraisons: "Trajets et livraisons",
  services: "Services et accompagnement",
};

/** Modalités d'une proposition. « cherche » correspond au type Besoin. */
export const ACTION_LABELS: Record<string, string> = {
  don: "Je donne",
  pret: "Je prête",
  loue: "Je loue",
  vends: "Je vends",
  prestation: "Je propose une prestation",
  transmission: "Je transmets",
  cherche: "Je cherche",
};

export const PROPOSITION_ACTIONS: Array<{ value: string; label: string; hint: string }> = [
  { value: "don", label: "Je donne", hint: "Gratuit" },
  { value: "pret", label: "Je prête", hint: "Retour prévu" },
  { value: "loue", label: "Je loue", hint: "Prix ou sur devis" },
  { value: "vends", label: "Je vends", hint: "Prix annoncé" },
  { value: "prestation", label: "Je propose une prestation", hint: "Concert, atelier, service" },
  { value: "transmission", label: "Je transmets", hint: "Savoir-faire, apprentissage" },
];

export const PUBLICATION_TYPE_LABELS: Record<string, string> = {
  proposition: "Proposition",
  besoin: "Besoin",
  projet: "Projet",
};

export const NEED_STATUS_LABELS: Record<string, string> = {
  recherche: "Recherché",
  propose: "Proposé",
  confirme: "Confirmé",
};

export const ARTIST_DISCIPLINES = [
  "Musique", "Chant", "Théâtre", "Danse", "Arts plastiques", "Photographie", "Conte et lecture", "Cirque et rue",
  "Son et lumière", "Régie technique", "Cinéma et vidéo", "Artisanat d'art",
];

/** Distance à vol d'oiseau en kilomètres. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (n: number) => (n * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function splitList(value: string, max = 12, maxLength = 40): string[] {
  return Array.from(new Set(value.split(/[,;\n]/).map((v) => v.trim()).filter(Boolean).map((v) => v.slice(0, maxLength)))).slice(0, max);
}

/** Statut d'un besoin de projet, déduit de la réservation liée (jamais « confirmé » sans accord du propriétaire). */
export function needStatusFromRequest(requestStatus: string | null | undefined): "recherche" | "propose" | "confirme" {
  if (!requestStatus || requestStatus === "refusee" || requestStatus === "annulee") return "recherche";
  if (requestStatus === "demandee") return "propose";
  return "confirme";
}

export const STATUS_LABEL: Record<string, string> = {
  demandee: "Demande envoyée", refusee: "Refusée", reservee: "Réservée", remise: "Remise à confirmer", retour_attendu: "Retour à organiser",
  retournee: "Retour confirmé", terminee: "Terminée", annulee: "Annulée", confirmee: "Transport confirmé", collectee: "Objet collecté", livre: "Remise confirmée",
};

export const POST_KIND_LABEL: Record<string, string> = { projet: "Projet", photo: "Photo", recit: "Récit", recette: "Recette", savoir: "Savoir-faire" };

/** « Gratuit », « Sur devis » ou le prix annoncé ; vide pour un besoin. */
export function priceLabel(item: { priceMode: string; price: string | null; action: string }) {
  if (item.action === "cherche") return "";
  if (item.priceMode === "gratuit" || item.action === "don") return "Gratuit";
  if (item.priceMode === "devis") return "Sur devis";
  return item.price ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(item.price)) : "";
}
