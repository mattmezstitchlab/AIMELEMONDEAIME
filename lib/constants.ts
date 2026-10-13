export const SITUATION_LABELS: Record<string, string> = {
  salarie_agricole: "Salarié agricole",
  exploitant: "Exploitant agricole",
  employeur: "Employeur agricole",
  retraite: "Retraité agricole",
  famille: "Ayant droit / famille",
};

export const CASE_STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  envoyee: "Envoyée",
  en_cours: "En cours",
  piece_manquante: "Pièce manquante",
  terminee: "Terminée",
};

export const CASE_STATUS_STYLES: Record<string, string> = {
  brouillon: "bg-slate-100 text-slate-700 border-slate-200",
  envoyee: "bg-sky-50 text-sky-700 border-sky-200",
  en_cours: "bg-amber-50 text-amber-700 border-amber-200",
  piece_manquante: "bg-rose-50 text-rose-700 border-rose-200",
  terminee: "bg-emerald-50 text-emerald-700 border-emerald-200",
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
  sante: "Santé",
  famille: "Famille",
  mariage: "Mariage",
  argent: "Argent et difficultés",
  logement: "Logement",
  retraite: "Retraite",
  cotisations: "Cotisations",
  emploi: "Emploi agricole",
};

export const ARTICLE_CATEGORIES = Object.keys(ARTICLE_CATEGORY_LABELS);

export const THEME_META: Record<string, { image: string; icon: "sante" | "famille" | "logement" | "retraite" | "cotisations" | "emploi" | "heart" | "paiements"; desc: string; tagline: string }> = {
  sante: { image: "/images/hero-sante.jpg", icon: "sante", desc: "Remboursements, arrêts de travail, prévention.", tagline: "Votre santé et celle de vos proches, au cœur de nos territoires." },
  famille: { image: "/images/hero-famille.jpg", icon: "famille", desc: "Allocations, naissance, mariage, Pacs.", tagline: "Accompagner chaque étape de la vie de votre famille." },
  mariage: { image: "/images/hero-mariage.jpg", icon: "heart", desc: "Dossier civil, rétroplanning, prestataires, invités, budget, jour J : le mariage de bout en bout.", tagline: "Préparer son mariage sereinement, de la mairie aux remerciements." },
  logement: { image: "/images/hero-logement.jpg", icon: "logement", desc: "Aides au logement et logement de fonction.", tagline: "Un toit adapté à votre vie à la campagne." },
  retraite: { image: "/images/hero-retraite.jpg", icon: "retraite", desc: "Relevé de carrière, demande de retraite.", tagline: "Préparer sereinement l'après, après une vie de travail de la terre." },
  cotisations: { image: "/images/hero-cotisations.jpg", icon: "cotisations", desc: "Calcul, échéances et régularisations.", tagline: "Comprendre et anticiper vos cotisations, simplement." },
  emploi: { image: "/images/hero-emploi.jpg", icon: "emploi", desc: "Embauche, contrats, prévention au travail.", tagline: "Employeurs et salariés agricoles, des démarches claires." },
  argent: { image: "/images/hero-difficultes.jpg", icon: "paiements", desc: "Factures, loyer, crédits, impôts : les premiers gestes et les interlocuteurs gratuits.", tagline: "Quand payer devient difficile, reprendre la main sans rester seul." },
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
