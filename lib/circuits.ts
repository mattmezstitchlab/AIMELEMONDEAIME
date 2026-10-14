import type { IconName } from "@/components/icon";
import type { LocalOrderStatus, LocalPointKind } from "@/db/schema";

/*
 * Les circuits.
 *
 * Un circuit, c'est un cadre de confiance autour d'un même geste : on dépose
 * une fiche située par sa commune, on dit ce qu'on propose, et l'accord se
 * fait entre les personnes. Le circuit des producteurs est le premier ; les
 * suivants (coups de main, associations) réutilisent exactement la même
 * mécanique : une entrée dans ce fichier, un tableau à l'écran, les mêmes
 * garde-fous.
 *
 * Rien n'est inventé ici : chaque promesse écrite ci-dessous doit être vraie
 * dans le code, sinon elle n'a pas sa place sur le site.
 */

export type CircuitStatus = "ouvert" | "prevu";

/** Le tableau que le circuit affiche : des structures, ou des personnes. */
export type CircuitBoard = "structures" | "hands";

export type CircuitStep = { title: string; text: string };

export type Circuit = {
  /** Identifiant d'adresse : /circuits/<key>. */
  key: string;
  label: string;
  short: string;
  icon: IconName;
  status: CircuitStatus;
  tagline: string;
  intro: string;
  /** Ce que l'on dépose dans ce circuit. */
  deposit: { label: string; text: string };
  /** Les mots justes pour nommer ce qu'on publie ici. */
  words: {
    entryLabel: string;
    entryPlaceholder: string;
    descriptionHint: string;
    catalogueLabel: string;
    itemSingular: string;
    priceLabel: string;
    unitPlaceholder: string;
    defaultCategory: string;
    orderLabel: string;
  };
  board: CircuitBoard | null;
  /** Valeur enregistrée dans local_points.kind (circuit des structures). */
  pointKind: LocalPointKind;
  steps: CircuitStep[];
  guarantees: string[];
  limits: string[];
  empty: string;
  /** Ce qu'il reste à faire avant d'ouvrir le circuit, quand il est prévu. */
  pending?: string;
};

export const PRODUCTEURS: Circuit = {
  key: "producteurs",
  label: "Producteurs et produits locaux",
  short: "Producteurs",
  icon: "sprout",
  status: "ouvert",
  tagline: "Ce qui pousse, se produit et se transforme à côté de chez soi, en vente directe.",
  intro:
    "Une ferme, un atelier, un jardin, un fournil : chacun dépose sa fiche, dit ce qu'il propose et à quel prix indicatif. Le point est déduit de la commune et du code postal — aucune adresse exacte n'est demandée, et rien n'est à placer.",
  deposit: {
    label: "Déposer ma production",
    text: "Votre fiche porte votre commune, ce que vous proposez et vos conditions de retrait. Vous pouvez la retirer à tout moment.",
  },
  words: {
    entryLabel: "Nom de la ferme, de l'atelier ou du jardin",
    entryPlaceholder: "Ex. Ferme des Grands Champs",
    descriptionHint: "Ce que vous produisez, comment et quand on vous trouve, ce qui est déjà réservé.",
    catalogueLabel: "Produits et récoltes",
    itemSingular: "produit",
    priceLabel: "Prix indicatif (€)",
    unitPlaceholder: "le kilo, le panier, la douzaine…",
    defaultCategory: "Produit fermier",
    orderLabel: "Réserver",
  },
  board: "structures",
  pointKind: "producteur",
  steps: [
    { title: "Une fiche située par la commune", text: "Nom, commune, code postal, ce que vous proposez. Le point reste approximatif : il dit « dans ce secteur », jamais votre porte." },
    { title: "Ce qui est disponible maintenant", text: "Vous ajoutez vos produits avec un prix indicatif et un stock. Le stock se met à jour à chaque réservation confirmée." },
    { title: "On convient du retrait", text: "La réservation est enregistrée, vous la confirmez, préparez et remettez en main propre. Aucun paiement ne passe par le site." },
  ],
  guarantees: [
    "Aucun paiement en ligne : l'argent ne circule jamais sur AIME®.",
    "Le producteur confirme chaque réservation : rien ne se réserve sans son accord.",
    "La fiche se retire en un geste, et le point ne désigne jamais une adresse précise.",
  ],
  limits: [
    "AIME® ne contrôle ni les prix, ni les quantités, ni la qualité : c'est un carnet d'adresses, pas un marché.",
    "Les fiches fictives utilisées pour la démonstration sont signalées comme telles.",
  ],
  empty: "Aucune fiche producteur dans ce secteur pour l'instant. La première peut être la vôtre.",
};

export const COUPS_DE_MAIN: Circuit = {
  key: "coups-de-main",
  label: "Coups de main et disponibilités",
  short: "Coups de main",
  icon: "entraide",
  status: "ouvert",
  tagline: "Vous pouvez donner un après-midi, un savoir-faire, un trajet : dites-le, sans vous engager.",
  intro:
    "Vous déclarez ce que vous savez faire et dans quelle commune. Votre fiche n'apparaît que si vous êtes disponible, et un seul interrupteur la retire : disponible, ou suspendu. La rencontre se fait ensuite entre vous, par votre profil public ou par une demande publiée dans Le Monde Aime.",
  deposit: {
    label: "Déclarer ma disponibilité",
    text: "Jusqu'à six savoir-faire, votre commune et un mot sur vos conditions. Vous pouvez suspendre votre disponibilité quand vous voulez.",
  },
  words: {
    entryLabel: "",
    entryPlaceholder: "",
    descriptionHint: "Comment vous aider concrètement, avec vos contraintes.",
    catalogueLabel: "Savoir-faire déclarés",
    itemSingular: "savoir-faire",
    priceLabel: "Participation éventuelle (€)",
    unitPlaceholder: "l'heure, la journée, le trajet…",
    defaultCategory: "Coup de main",
    orderLabel: "Demander",
  },
  board: "hands",
  pointKind: "presence",
  steps: [
    { title: "Vous dites ce que vous savez faire", text: "Bricolage, jardinage, courses, écoute, cours de français, conduite, musique : les mots que les gens cherchent." },
    { title: "Vous restez maître de votre visibilité", text: "Disponible ou suspendu, c'est vous. Suspendu, votre fiche disparaît des listes immédiatement." },
    { title: "On vous retrouve par la commune", text: "Votre fiche indique votre commune et ce que vous savez faire. Si vous avez un profil public, il est proposé ; sinon, la demande arrive par Le Monde Aime." },
  ],
  guarantees: [
    "Aucun paiement en ligne : l'argent ne circule jamais sur AIME®, même pour un coup de main.",
    "Votre disponibilité ne s'affiche que si vous l'avez décidée.",
    "Suspendre prend un clic, et votre fiche quitte les listes sur-le-champ.",
    "Une disponibilité n'est pas un engagement : vous répondez seulement si cela vous convient.",
  ],
  limits: [
    "AIME® affiche des disponibilités, ne vérifie pas les personnes et n'organise pas la rencontre.",
    "Un coup de main n'est pas un emploi : ni contrat, ni rémunération encadrée par le site.",
  ],
  empty: "Personne ne s'est encore déclaré disponible dans ce secteur.",
};

export const ASSOCIATIONS: Circuit = {
  key: "associations",
  label: "Associations et collectifs",
  short: "Associations",
  icon: "users",
  status: "prevu",
  tagline: "Une association, ses besoins récurrents et ses temps forts, avec la même méthode.",
  intro:
    "Le circuit des associations reprend exactement la mécanique des producteurs : une fiche située par la commune, ce que la structure propose, ce qu'elle cherche, et des besoins datés pour ses événements.",
  deposit: {
    label: "Déclarer une association",
    text: "Nom, commune, objet, ce que vous proposez (ateliers, prêt de salle, entraide) et ce qui vous manque.",
  },
  words: {
    entryLabel: "Nom de l'association ou du collectif",
    entryPlaceholder: "Ex. Les Jardins partagés du canal",
    descriptionHint: "L'objet de l'association, ses horaires, ce qu'elle propose et ce qu'elle cherche.",
    catalogueLabel: "Ce que l'association propose",
    itemSingular: "proposition",
    priceLabel: "Participation (€)",
    unitPlaceholder: "la séance, l'année, la journée…",
    defaultCategory: "Association",
    orderLabel: "Me mettre en relation",
  },
  board: null,
  pointKind: "association",
  steps: [
    { title: "Une fiche d'association", text: "Le même formulaire que les producteurs, avec des mots adaptés : ateliers, prêt de matériel, entraide." },
    { title: "Des besoins datés", text: "Bénévoles pour une fête, matériel pour un atelier : chaque besoin porte une date et un nombre." },
    { title: "Des rencontres, pas des dons anonymes", text: "La mise en relation se fait entre personnes nommées, avec l'accord de l'association." },
  ],
  guarantees: [
    "Aucune collecte d'argent n'est gérée par AIME®.",
    "Les besoins affichés sont datés et s'éteignent tout seuls une fois passés.",
    "Chaque association garde la main sur sa fiche et sur ses annonces.",
  ],
  limits: [
    "Le circuit n'est pas encore ouvert : rien n'est enregistrable aujourd'hui.",
    "Il ne remplace ni le registre national des associations, ni les démarches officielles.",
  ],
  empty: "Ce circuit ouvrira avec ses premières associations.",
  pending: "Le tableau des associations est la seule pièce à écrire : le formulaire, la fiche, les besoins datés et les règles sont déjà décidés plus haut dans ce fichier.",
};

/* ------------------------------------------------------------------ *
 * Ce que le serveur envoie au tableau : des lignes simples, sans objet
 * de base de données, faciles à relire et à transmettre au navigateur.
 * ------------------------------------------------------------------ */

export type CircuitItemRow = {
  id: number;
  name: string;
  description: string;
  category: string;
  price: string;
  unit: string;
  stock: number;
  isMine: boolean;
};

export type CircuitStructureRow = {
  id: number;
  name: string;
  description: string;
  city: string;
  kind: string;
  ownerName: string;
  phone: string | null;
  isMine: boolean;
  items: CircuitItemRow[];
};

export type CircuitHandRow = {
  id: number;
  userId: number;
  name: string;
  city: string;
  skills: string[];
  note: string;
  since: string;
  isMine: boolean;
  hasProfile: boolean;
};

export type CircuitOrderRow = {
  id: number;
  reference: string;
  quantity: number;
  status: string;
  statusLabel: string;
  itemName: string;
  structureName: string;
  city: string;
  counterparty: string;
  pickupAt: string | null;
  isSeller: boolean;
};

export type CircuitAvailabilityRow = { skills: string[]; city: string; note: string; status: string };

/** Ce que le membre voit de son propre travail dans le circuit. */
export type CircuitMine = {
  isMember: boolean;
  structures: CircuitStructureRow[];
  received: CircuitOrderRow[];
  placed: CircuitOrderRow[];
  availability: CircuitAvailabilityRow | null;
};

/** Tous les circuits déclarés, ouverts ou prévus. L'ordre est celui de l'affichage. */
export const CIRCUITS: Circuit[] = [PRODUCTEURS, COUPS_DE_MAIN, ASSOCIATIONS];

/** Le statut d'une réservation, dit en français, au même endroit pour tous. */
export const ORDER_STATUS_LABELS: Record<LocalOrderStatus, string> = {
  commandee: "En attente de préparation",
  prete: "Prête à être retirée",
  recuperee: "Retirée",
  annulee: "Annulée",
};

export function circuitFor(key: string): Circuit | undefined {
  return CIRCUITS.find((circuit) => circuit.key === key);
}

/** Le circuit auquel appartient une fiche, d'après le type enregistré. */
export function circuitForPointKind(kind: string): Circuit | undefined {
  return CIRCUITS.find((circuit) => circuit.board === "structures" && circuit.pointKind === kind);
}

export function openCircuits(): Circuit[] {
  return CIRCUITS.filter((circuit) => circuit.status === "ouvert");
}

export function plannedCircuits(): Circuit[] {
  return CIRCUITS.filter((circuit) => circuit.status === "prevu");
}

/** Les savoir-faire proposés d'emblée : des mots que les gens cherchent vraiment. */
export const SKILL_SUGGESTIONS = [
  "Bricolage",
  "Jardinage",
  "Courses et accompagnement",
  "Écoute et papiers",
  "Cours de français",
  "Conduite et trajets",
  "Couture et retouches",
  "Musique et chants",
  "Informatique",
  "Déménagement",
];
