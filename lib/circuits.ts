import type { IconName } from "@/components/icon";
import type { LocalOrderStatus, LocalPointKind } from "@/db/schema";

/*
 * Les circuits.
 *
 * Un circuit, c'est un cadre de confiance autour d'un même geste : on dépose
 * une fiche située par sa commune, on dit ce qu'on propose, et l'accord se
 * fait entre les personnes. Trois circuits sont ouverts : les producteurs,
 * les coups de main, les associations et collectifs. Ils réutilisent tous
 * exactement la même mécanique : une entrée dans ce fichier, un tableau à
 * l'écran, les mêmes garde-fous. Un circuit de plus ne demande rien d'autre.
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
  /**
   * Le vocabulaire du catalogue : il n'existe que sur un circuit à fiches.
   * Un circuit qui n'a pas de fiches (les coups de main) n'en porte pas.
   */
  catalogue?: {
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
  /** Les mots justes pour nommer ce qu'on publie ici. */
  words: {
    /** Titre du tableau public : ce qu'on vient y chercher. */
    boardTitle: string;
    /** Le libellé du filtre par mot-clé, et ce qu'on y cherche. */
    searchLabel: string;
    searchHint: string;
    /** Comment on nomme une demande, et ce qu'on répond quand elle est envoyée. */
    demandWord: string;
    demandDone: string;
    statusUpdateTitle: string;
    /** Le nom du jour ou de l'heure qu'on propose, s'il y en a un. */
    dateLabel: string;
    /** Ce que voit la structure dans « Mon atelier ». */
    ordersTitle: string;
    orderNoteLabel: string;
    orderNoteHint: string;
    paymentNote: string;
    stockWord: string;
    soldOut: string;
    counterpartyWord: string;
    demandTitle: string;
    demandSent: string;
    /** Les quatre statuts d'une demande, dits avec les mots du circuit. */
    statusLabels: Record<LocalOrderStatus, string>;
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
  catalogue: {
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
  words: {
    boardTitle: "Ce qui se produit dans le secteur.",
    searchLabel: "Quel produit, quelle récolte ?",
    searchHint: "légumes, pain, miel…",
    demandWord: "Réservation",
    demandDone: "Retrait sur place, à convenir avec le producteur.",
    statusUpdateTitle: "Votre réservation a changé",
    dateLabel: "Retrait souhaité",
    ordersTitle: "Mes réservations",
    orderNoteLabel: "Un mot pour le producteur",
    orderNoteHint: "Quand vous passez, ce dont vous avez besoin…",
    paymentNote: "Aucun paiement ne passe par AIME® : le prix est indicatif et le règlement se fait au retrait.",
    stockWord: "disponible(s)",
    soldOut: "Épuisé pour l'instant",
    counterpartyWord: "chez",
    demandTitle: "Nouvelle réservation sur votre fiche",
    demandSent: "Retrait sur place, à convenir avec le producteur.",
    statusLabels: { commandee: "En attente de préparation", prete: "Prête à être retirée", recuperee: "Retirée", annulee: "Annulée" },
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
  // Pas de catalogue ici : ce circuit affiche des disponibilités, pas des fiches.
  words: {
    boardTitle: "Qui peut donner un coup de main dans le secteur.",
    searchLabel: "Quel coup de main ?",
    searchHint: "bricolage, courses, français…",
    demandWord: "Demande de coup de main",
    demandDone: "La personne vous répond directement.",
    statusUpdateTitle: "Votre demande a changé",
    dateLabel: "Jour souhaité",
    ordersTitle: "Mes mises en relation",
    orderNoteLabel: "Un mot pour la personne",
    orderNoteHint: "Ce que vous cherchez, quand vous êtes disponible…",
    paymentNote: "Aucun paiement ne passe par AIME® : ni pour un coup de main, ni pour autre chose.",
    stockWord: "disponible(s)",
    soldOut: "Complet pour l'instant",
    counterpartyWord: "auprès de",
    demandTitle: "Nouvelle demande de coup de main",
    demandSent: "La personne vous répond directement.",
    statusLabels: { commandee: "Demande envoyée", prete: "Accord donné", recuperee: "Coup de main fait", annulee: "Annulée" },
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
  status: "ouvert",
  tagline: "Une association, un collectif : ce qu'ils proposent, leurs ateliers, leurs prêts de matériel — situés par la commune.",
  intro:
    "Déclarez votre association : son nom, sa commune, son objet, et ce qu'elle propose ou prête. Le point vient de la commune et du code postal, jamais d'une adresse. Les personnes intéressées demandent une mise en relation, et la suite se convient entre vous.",
  deposit: {
    label: "Déclarer une association",
    text: "Nom, commune, objet, ce que vous proposez : ateliers, prêt de salle ou de matériel, entraide. Chaque proposition s'ajoute et se retire à tout moment.",
  },
  catalogue: {
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
  words: {
    boardTitle: "Les associations du secteur et ce qu'elles proposent.",
    searchLabel: "Quelle association, quelle proposition ?",
    searchHint: "atelier, couture, prêt de salle…",
    demandWord: "Mise en relation",
    demandDone: "L'association vous répond directement.",
    statusUpdateTitle: "Votre mise en relation a changé",
    dateLabel: "Jour souhaité",
    ordersTitle: "Mes mises en relation",
    orderNoteLabel: "Un mot pour l'association",
    orderNoteHint: "Ce que vous aimeriez faire, vos disponibilités…",
    paymentNote: "Aucun paiement ne passe par AIME® : la participation se règle sur place, avec l'association.",
    stockWord: "place(s)",
    soldOut: "Complet pour l'instant",
    counterpartyWord: "auprès de",
    demandTitle: "Nouvelle mise en relation demandée",
    demandSent: "L'association vous répond directement.",
    statusLabels: { commandee: "En attente de réponse", prete: "Mise en relation acceptée", recuperee: "Rencontre faite", annulee: "Annulée" },
  },
  board: "structures",
  pointKind: "association",
  steps: [
    { title: "Une fiche située par la commune", text: "Nom, commune, code postal, objet. Le point reste approximatif : il dit « dans ce secteur », jamais l'adresse de votre local." },
    { title: "Ce que l'association propose", text: "Ateliers, prêt de salle ou de matériel, entraide : chaque ligne s'ajoute et se retire, avec une participation et un nombre de places." },
    { title: "Des besoins dans Le Monde Aime", text: "Vos besoins ponctuels — bénévoles, matériel, covoiturage — se publient dans Le Monde Aime, avec une date : les personnes disponibles les y trouvent." },
  ],
  guarantees: [
    "Aucun paiement en ligne : l'argent ne circule jamais sur AIME®, même pour une participation.",
    "Chaque association garde la main : sa fiche et ses propositions se publient et se retirent depuis son espace.",
    "La mise en relation est nominative : l'association sait qui demande et répond seulement si cela lui convient.",
  ],
  limits: [
    "AIME® affiche des propositions et transmet une demande : il n'organise ni les ateliers, ni les réservations de salle.",
    "Il ne remplace ni le registre national des associations, ni les démarches officielles.",
    "Une proposition qui porte encore une demande en cours se retire après l'avoir traitée : rien ne disparaît sous les pieds de quelqu'un.",
  ],
  empty: "Aucune association dans ce secteur pour l'instant. La première peut être la vôtre.",
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
export const ARTISANS: Circuit = {
  key: "artisans",
  label: "Artisans et savoir-faire",
  short: "Artisans",
  icon: "boutique",
  status: "ouvert",
  tagline: "Couture, réparation de vélos, menuiserie, petits travaux : des mains qui savent faire, à côté de chez soi.",
  intro:
    "Un atelier, un garage, une table de couture : l'artisan dépose sa fiche, dit ce qu'il sait faire et à quel tarif indicatif. Le point est déduit de la commune et du code postal — aucune adresse exacte n'est demandée. La demande part de la fiche, l'artisan répond, et le travail se convient directement.",
  deposit: {
    label: "Déposer mon savoir-faire",
    text: "Votre fiche porte votre commune, ce que vous savez faire et vos tarifs indicatifs. Vous pouvez la retirer à tout moment.",
  },
  catalogue: {
    entryLabel: "Nom de l'atelier ou de l'artisan",
    entryPlaceholder: "Ex. Atelier du Bas-Chemin",
    descriptionHint: "Ce que vous savez faire, vos horaires, où vous intervenez et ce que vous ne faites pas.",
    catalogueLabel: "Prestations et savoir-faire",
    itemSingular: "prestation",
    priceLabel: "Tarif indicatif (€)",
    unitPlaceholder: "la réparation, l'heure, la pièce…",
    defaultCategory: "Savoir-faire",
    orderLabel: "Demander",
  },
  words: {
    boardTitle: "Les savoir-faire du secteur.",
    searchLabel: "Quel savoir-faire ?",
    searchHint: "vélo, couture, menuiserie…",
    demandWord: "Demande",
    demandDone: "L'artisan vous répond directement.",
    statusUpdateTitle: "Votre demande a changé",
    dateLabel: "Jour souhaité",
    ordersTitle: "Mes demandes",
    orderNoteLabel: "Un mot pour l'artisan",
    orderNoteHint: "Ce qu'il y a à réparer ou à fabriquer, quand cela vous arrangerait…",
    paymentNote: "Aucun paiement ne passe par AIME® : le tarif est indicatif et le règlement se fait sur place, une fois le travail vu.",
    stockWord: "disponible(s)",
    soldOut: "Complet pour l'instant",
    counterpartyWord: "auprès de",
    demandTitle: "Nouvelle demande sur votre fiche",
    demandSent: "L'artisan vous répond directement.",
    statusLabels: { commandee: "En attente de réponse", prete: "Prêt à être remis", recuperee: "Remis", annulee: "Annulée" },
  },
  board: "structures",
  pointKind: "artisan",
  steps: [
    { title: "Une fiche située par la commune", text: "Nom, commune, code postal, savoir-faire. Le point reste approximatif : il dit « dans ce secteur », jamais l'adresse de l'atelier." },
    { title: "Ce que l'artisan sait faire", text: "Chaque prestation s'ajoute avec un tarif indicatif et un nombre de places. Ce qui est complet disparaît tout seul." },
    { title: "La demande, puis l'accord", text: "Vous demandez en un geste, l'artisan confirme, et le travail se convient directement. Aucun paiement ne passe par le site." },
  ],
  guarantees: [
    "Aucun paiement en ligne : l'argent ne circule jamais sur AIME®, même pour une avance sur travaux.",
    "L'artisan répond seulement s'il accepte le travail : une demande n'est pas une commande.",
    "La fiche se retire en un geste, et le point ne désigne jamais une adresse précise.",
  ],
  limits: [
    "AIME® ne vérifie ni les qualifications, ni les assurances, ni la qualité du travail : c'est un carnet d'adresses, pas un carnet de commandes.",
    "Aucun devis n'est établi ici : le tarif affiché est indicatif et se confirme entre vous.",
  ],
  empty: "Aucun savoir-faire déclaré dans ce secteur pour l'instant. Le premier peut être le vôtre.",
};

export const CIRCUITS: Circuit[] = [PRODUCTEURS, COUPS_DE_MAIN, ASSOCIATIONS, ARTISANS];

/** Le repli des libellés de statut reste celui des producteurs, premier circuit à fiches. */
export const DEFAULT_ORDER_STATUS_LABELS: Record<LocalOrderStatus, string> = PRODUCTEURS.words.statusLabels;

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
