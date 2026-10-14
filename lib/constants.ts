/**
 * Situations déclarées à l'inscription et affichées sur les profils. Le
 * produit n'est plus centré sur le seul monde agricole : les options
 * proposées à l'inscription (REGISTRATION_SITUATION_KEYS) parlent de
 * situations de vie. Les clés historiques (salarie_agricole, exploitant)
 * restent affichables pour les comptes créés avant cette refonte.
 */
export const SITUATION_LABELS: Record<string, string> = {
  actif: "Je travaille (emploi, indépendant, agriculture…)",
  sans_emploi: "Je cherche un emploi ou une activité",
  employeur: "J'emploie ou je recrute",
  retraite: "Je suis à la retraite",
  famille: "Ma famille change (naissance, mariage, séparation…)",
  sante: "Ma santé m'empêche de travailler comme avant",
  proche: "J'aide un proche au quotidien",
  salarie_agricole: "Salarié agricole",
  exploitant: "Exploitant agricole",
};

/** Options proposées dans le formulaire d'inscription (clés de SITUATION_LABELS). */
export const REGISTRATION_SITUATION_KEYS = ["actif", "sans_emploi", "employeur", "retraite", "famille", "sante", "proche"] as const;

export const CASE_STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  envoyee: "Envoyée",
  en_cours: "En cours",
  piece_manquante: "Pièce manquante",
  terminee: "Terminée",
};

/** Styles des pastilles d'état : une couleur uniquement pour l'état (Cal.com). */
export const CASE_STATUS_STYLES: Record<string, string> = {
  brouillon: "bg-muted text-ink-2 ring-line",
  envoyee: "bg-state-info-soft text-state-info ring-state-info-line",
  en_cours: "bg-state-warning-soft text-state-warning ring-state-warning-line",
  piece_manquante: "bg-state-danger-soft text-state-danger ring-state-danger-line",
  terminee: "bg-state-success-soft text-state-success ring-state-success-line",
};

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  prestation: "Prestation",
  remboursement: "Remboursement",
  cotisation: "Cotisation",
};

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  demandee: "Demandée",
  confirmee: "Confirmée",
  annulee: "Annulée",
  terminee: "Terminée",
};

export const ARTICLE_CATEGORY_LABELS: Record<string, string> = {
  famille: "Famille",
  mariage: "Mariage",
  sante: "Santé",
  argent: "Argent et difficultés",
  logement: "Logement",
  retraite: "Retraite",
  cotisations: "Cotisations",
  emploi: "Emploi et activité",
};

/**
 * Guides « à la une » de l'accueil : un guide d'entrée par grande thématique,
 * épinglé dans le code pour rester stable dans le temps — l'accueil ne doit
 * pas changer d'identité à chaque nouveau fonds publié. L'ordre est celui
 * du récit : le mariage d'abord (la profondeur historique du produit), puis
 * les moments de vie.
 */
export const FEATURED_GUIDE_SLUGS = [
  "se-marier-par-ou-commencer",
  "naissance-premieres-demarches",
  "accident-du-travail-les-bons-reflexes",
  "ne-plus-arriver-a-payer-par-ou-commencer",
  "aide-au-logement-estimer-sans-se-tromper",
  "releve-de-carriere-verifier-tot",
] as const;

export const ARTICLE_CATEGORIES = Object.keys(ARTICLE_CATEGORY_LABELS);

export const THEME_META: Record<string, { image: string; icon: "sante" | "famille" | "logement" | "retraite" | "cotisations" | "emploi" | "heart" | "paiements"; desc: string; tagline: string }> = {
  famille: { image: "/images/hero-famille.jpg", icon: "famille", desc: "Allocations, naissance, mariage, Pacs.", tagline: "Accompagner chaque étape de la vie de votre famille." },
  mariage: { image: "/images/hero-mariage.jpg", icon: "heart", desc: "Dossier civil, rétroplanning, prestataires, invités, budget, jour J : le mariage de bout en bout.", tagline: "Préparer son mariage sereinement, de la mairie aux remerciements." },
  sante: { image: "/images/hero-sante.jpg", icon: "sante", desc: "Remboursements, arrêts de travail, prévention.", tagline: "Votre santé et celle de vos proches, au cœur de nos territoires." },
  argent: { image: "/images/hero-difficultes.jpg", icon: "paiements", desc: "Factures, loyer, crédits, impôts : les premiers gestes et les interlocuteurs gratuits.", tagline: "Quand payer devient difficile, reprendre la main sans rester seul." },
  logement: { image: "/images/hero-logement.jpg", icon: "logement", desc: "Aides au logement et logement de fonction.", tagline: "Un toit adapté à votre vie à la campagne." },
  retraite: { image: "/images/hero-retraite.jpg", icon: "retraite", desc: "Relevé de carrière, demande de retraite.", tagline: "Préparer sereinement l'après, après une vie de travail de la terre." },
  emploi: { image: "/images/hero-emploi.jpg", icon: "emploi", desc: "Recherche d'emploi, formation, embauche, création et transmission d'activité.", tagline: "Travailler, recruter, créer ou transmettre : des démarches claires à chaque étape." },
  cotisations: { image: "/images/hero-cotisations.jpg", icon: "cotisations", desc: "Calcul, échéances et régularisations.", tagline: "Comprendre et anticiper vos cotisations, simplement." },
};

export const CASE_EVENT_LABELS: Record<string, string> = {
  creation: "Dossier créé",
  soumission: "Dossier envoyé",
  changement_statut: "Statut mis à jour",
  message: "Message",
  document_ajoute: "Document ajouté",
  affectation: "Dossier affecté",
  relance: "Relance envoyée",
};
