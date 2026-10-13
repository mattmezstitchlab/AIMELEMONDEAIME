/**
 * Registre central de l'assistant de navigation.
 *
 * Tout ce que l'assistant peut proposer est décrit ici : routes réelles de
 * l'application, éléments pouvant être mis en évidence et parcours guidés.
 * L'assistant ne propose jamais un lien qui n'existe pas dans ce registre.
 *
 * Ce n'est pas une IA générative : il s'agit d'un moteur de scénarios qui
 * rapproche des mots-clés/synonymes de réponses préparées.
 */

export type AssistantRole = "visiteur" | "membre" | "gestionnaire" | "administrateur";

export const ALL_ROLES: AssistantRole[] = ["visiteur", "membre", "gestionnaire", "administrateur"];

/** Routes réellement présentes dans l'application. */
export type RouteEntry = {
  path: string;
  label: string;
  roles: AssistantRole[];
  purpose: string;
};

export const ROUTES: RouteEntry[] = [
  { path: "/", label: "Accueil du site public", roles: ALL_ROLES, purpose: "Présenter les services et orienter vers les informations ou l'espace personnel." },
  { path: "/informations", label: "Informations par thématique", roles: ALL_ROLES, purpose: "Regrouper les articles et guides par sujet : santé, famille, logement, retraite, cotisations, emploi." },
  { path: "/informations", label: "S'informer", roles: ALL_ROLES, purpose: "Rechercher et lire les articles et guides par thématique ou mot-clé ; le détail d'un guide s'ouvre depuis la liste." },
  { path: "/accompagnement", label: "Être accompagné", roles: ALL_ROLES, purpose: "Choisir une situation et retrouver ses interlocuteurs externes, sans transmission automatique." },
  { path: "/decouvrir", label: "Découvrir Mon espace", roles: ALL_ROLES, purpose: "Entrer dans la visite guidée : le vrai espace personnel, avec un compte de démonstration en lecture seule." },
  { path: "/vision", label: "Notre méthode", roles: ALL_ROLES, purpose: "Comprendre ce qui fonctionne, ce qui existe ailleurs et les intégrations encore indisponibles." },
  { path: "/carte", label: "Carte de France", roles: ALL_ROLES, purpose: "Voir les agences, les productions locales, commander sur place ou se rendre disponible." },
  { path: "/le-monde-aime", label: "Le Monde Aime · initiative indépendante", roles: ["visiteur", "membre"], purpose: "Explorer la carte des personnes, offres, besoins, lieux et projets ; publier ; retrouver vos échanges, projets et cercles." },
  { path: "/annuaire", label: "Annuaire des bureaux", roles: ALL_ROLES, purpose: "Trouver un bureau local, ses horaires et son téléphone." },
  { path: "/connexion", label: "Connexion", roles: ALL_ROLES, purpose: "Se connecter à son espace personnel ou professionnel." },
  { path: "/inscription", label: "Créer mon espace", roles: ALL_ROLES, purpose: "Créer un espace de démonstration en quelques informations." },

  { path: "/espace", label: "Accueil de l'espace adhérent", roles: ["membre"], purpose: "Voir sa situation, son bureau, ses échéances et son activité récente." },
  { path: "/espace/demarches", label: "Mes démarches", roles: ["membre"], purpose: "Retrouver toutes ses démarches au même endroit : parcours guidés et dossiers suivis par l'équipe, leurs statuts et leur historique." },
  { path: "/espace/demarches/nouvelle", label: "Nouvelle démarche", roles: ["membre"], purpose: "Choisir un moment de vie, répondre pas à pas et reprendre un brouillon sauvegardé." },
  { path: "/espace/demarches/suivi", label: "Suivi d'une démarche", roles: ["membre"], purpose: "Voir les actions et pièces à préparer, les sources officielles et les rappels personnels." },
  { path: "/espace/profil", label: "Mon profil", roles: ["membre"], purpose: "Renseigner ses activités, ses disponibilités et la confidentialité de sa présence sur la carte." },
  { path: "/espace/documents", label: "Mes documents", roles: ["membre"], purpose: "Retrouver les documents privés et révoquer les partages explicites." },
  { path: "/espace/paiements", label: "Mes paiements", roles: ["membre"], purpose: "Consulter l'historique fictif des prestations, remboursements et cotisations." },
  { path: "/espace/echanges", label: "Mes échanges & projets", roles: ["membre"], purpose: "Retrouver ses échanges sur la carte (demandes, dons, prêts), ses projets, ses cercles privés, et contacter son bureau (messages, rendez-vous)." },

  { path: "/back-office", label: "Tableau de bord gestionnaire", roles: ["gestionnaire", "administrateur"], purpose: "Voir la charge de travail et les dossiers de son bureau." },
  { path: "/back-office/dossiers", label: "Dossiers à traiter", roles: ["gestionnaire", "administrateur"], purpose: "Filtrer, affecter et ouvrir les dossiers de son périmètre." },
  { path: "/back-office/rendez-vous", label: "Rendez-vous", roles: ["gestionnaire", "administrateur"], purpose: "Confirmer, annuler ou clôturer les demandes de rendez-vous." },
  { path: "/back-office/messages", label: "Messagerie", roles: ["gestionnaire", "administrateur"], purpose: "Répondre aux messages adressés à son bureau." },

  { path: "/admin", label: "Administration", roles: ["administrateur"], purpose: "Piloter les comptes, les bureaux, les contenus et consulter le journal d'audit." },
  { path: "/admin/utilisateurs", label: "Comptes et rôles", roles: ["administrateur"], purpose: "Attribuer les rôles et les bureaux autorisés." },
  { path: "/admin/bureaux", label: "Bureaux", roles: ["administrateur"], purpose: "Gérer l'annuaire des bureaux locaux." },
  { path: "/admin/contenus", label: "Contenus publics", roles: ["administrateur"], purpose: "Rédiger, publier ou retirer les articles et guides." },
];

/** Éments de l'interface que l'assistant peut mettre en évidence. */
export type TargetEntry = { id: string; label: string; description: string; roles?: AssistantRole[] };

export const TARGETS: TargetEntry[] = [
  { id: "orientation-entry", label: "Recherche par situation", description: "Décrivez votre besoin en quelques mots : l'assistant de navigation s'ouvre avec votre question et propose un parcours préparé, pas un diagnostic.", roles: ALL_ROLES },
  { id: "espace-quick-actions", label: "Accès rapides", description: "Les quatre raccourcis pour démarrer une démarche, déposer un document ou prendre rendez-vous.", roles: ["membre"] },
  { id: "espace-cases", label: "Liste des dossiers à traiter", description: "Chaque ligne renvoie vers le dossier concerné.", roles: ["membre"] },
  { id: "espace-activity", label: "Activité récente", description: "Les derniers événements de vos dossiers, du plus récent au plus ancien.", roles: ["membre"] },
  { id: "espace-office", label: "Mon bureau local", description: "Adresse, téléphone et horaires du bureau qui vous suit.", roles: ["membre"] },
  { id: "demarches-new", label: "Bouton Nouvelle démarche", description: "Ouvre le formulaire guidé.", roles: ["membre"] },
  { id: "demarches-search", label: "Recherche de démarche", description: "Filtre vos dossiers par titre ou référence.", roles: ["membre"] },
  { id: "demarches-filters", label: "Filtres de statut", description: "Affiche seulement les brouillons, les dossiers en cours ou terminés.", roles: ["membre"] },
  { id: "nouvelle-kind", label: "Type de démarche", description: "Choisissez d'abord le motif : changement de situation, famille, logement, santé, retraite, cotisations, emploi.", roles: ["membre"] },
  { id: "nouvelle-required", label: "Pièces à préparer", description: "La liste des justificatifs utiles apparaît ici avant l'envoi.", roles: ["membre"] },
  { id: "nouvelle-submit", label: "Bouton Envoyer ma demande", description: "Envoie la demande à votre bureau. Un brouillon est enregistré automatiquement avant.", roles: ["membre"] },
  { id: "case-message", label: "Zone de message du dossier", description: "Permet de répondre au gestionnaire et de joindre un justificatif.", roles: ["membre", "gestionnaire"] },
  { id: "case-attachments", label: "Pièces jointes du dossier", description: "Les documents déjà transmis, téléchargeables.", roles: ["membre", "gestionnaire"] },
  { id: "case-status-form", label: "Formulaire de gestion du dossier", description: "Change le statut, affecte un agent et demande une pièce manquante.", roles: ["gestionnaire"] },
  { id: "documents-search", label: "Recherche de document", description: "Filtre vos documents par nom ou catégorie.", roles: ["membre"] },
  { id: "documents-specimens", label: "Attestations SPÉCIMEN", description: "Deux documents de démonstration téléchargeables, clairement marqués SPÉCIMEN.", roles: ["membre"] },
  { id: "documents-upload", label: "Déposer un document", description: "Le dépôt se fait depuis un dossier existant, dans la conversation.", roles: ["membre"] },
  { id: "payments-search", label: "Recherche de paiement", description: "Filtre l'historique par libellé, type ou référence.", roles: ["membre"] },
  { id: "payments-table", label: "Historique des opérations", description: "Les opérations fictives les plus récentes en premier.", roles: ["membre"] },
  { id: "echanges-message-form", label: "Message au bureau", description: "Écrit un message général à votre bureau.", roles: ["membre"] },
  { id: "echanges-appointment-form", label: "Demande de rendez-vous", description: "Choisit un motif, une date et l'associe éventuellement à un dossier.", roles: ["membre"] },
  { id: "backoffice-search", label: "Recherche de dossier", description: "Cherche par référence, titre ou nom d'adhérent.", roles: ["gestionnaire", "administrateur"] },
  { id: "backoffice-filters", label: "Filtres de statut", description: "Isole les dossiers envoyés, en cours, en attente de pièce ou terminés.", roles: ["gestionnaire", "administrateur"] },
  { id: "backoffice-table", label: "Liste des dossiers", description: "Chaque ligne ouvre le dossier correspondant.", roles: ["gestionnaire", "administrateur"] },
  { id: "carte-map", label: "Carte interactive", description: "Cliquez sur une épingle pour voir le détail et les actions rapides.", roles: ALL_ROLES },
  { id: "carte-filters", label: "Filtres de la carte", description: "Affiche ou masque les agences, les productions locales et les jeunes disponibles.", roles: ALL_ROLES },
  { id: "carte-place", label: "Déposer un point", description: "Cliquez sur la carte pour situer votre production, votre présence ou votre disponibilité.", roles: ["membre"] },
  { id: "lma-publish", label: "Bouton Publier", description: "Ouvre le formulaire d'annonce ou de trajet de l'initiative indépendante.", roles: ["membre"] },
  { id: "lma-filters", label: "Filtres des offres locales", description: "Filtre produits, dons, objets, trajets et services.", roles: ["visiteur", "membre"] },
  { id: "lma-map", label: "Carte Le Monde Aime", description: "Cliquez sur la carte pour centrer le rayon ou choisir une zone approximative.", roles: ["visiteur", "membre"] },
  { id: "lma-detail", label: "Fiche détaillée sur la carte", description: "Cliquez sur un marqueur : la fiche complète s’affiche dans le panneau, avec les actions possibles.", roles: ["visiteur", "membre"] },
  { id: "lma-listing-form", label: "Formulaire de publication", description: "Choisissez Je donne, Je prête, Je loue, Je vends ou Je cherche.", roles: ["membre"] },
  { id: "lma-request", label: "Bouton Demander", description: "Envoie une demande au propriétaire ; l'annonce n'est pas réservée sans son accord.", roles: ["membre"] },
  { id: "lma-private-exchanges", label: "Mes échanges privés", description: "Demandes, statuts et conversations accessibles seulement aux participants.", roles: ["membre"] },
  { id: "lma-trip-form", label: "Formulaire Sur mon trajet", description: "Renseignez départ, destination, date, transport et capacité.", roles: ["membre"] },
  { id: "lma-event-form", label: "Préparer mon événement", description: "Enregistrez une date, un lieu et la liste des objets recherchés.", roles: ["membre"] },
  { id: "admin-users-table", label: "Tableau des comptes", description: "Modifie le rôle et le bureau autorisé de chaque compte.", roles: ["administrateur"] },
  { id: "admin-audit", label: "Journal d'audit", description: "Historique des actions enregistrées sur la plateforme.", roles: ["administrateur"] },
  { id: "admin-content-form", label: "Formulaire de contenu", description: "Rédige ou modifie un article puis choisit de le publier.", roles: ["administrateur"] },
];

/** Une étape d'un parcours guidé. */
export type AssistantStep = {
  /** Texte affiché à l'adhérent ou à l'employé. */
  text: string;
  /** Page à ouvrir avant l'étape. */
  navigate?: string;
  /** Identifiant d'élément à mettre en évidence (voir TARGETS). */
  highlight?: string;
  /** Ce que la personne doit saisir ou faire. */
  action?: string;
};

export type AssistantScenario = {
  id: string;
  /** Rôles autorisés à voir ce parcours. */
  roles: AssistantRole[];
  /** Pages où ce parcours est proposé en priorité (facultatif). */
  pages?: string[];
  /** Question formulée par la personne, telle qu'elle pourrait la taper. */
  question: string;
  /** Mots-clés et synonymes reconnus. */
  keywords: string[];
  /** Réponse courte affichée avant les étapes. */
  answer: string;
  steps: AssistantStep[];
};

export const SCENARIOS: AssistantScenario[] = [
  // ------------------------------------------------------------------ Adhérents
  {
    id: "attestation",
    roles: ["membre"],
    pages: ["/espace", "/espace/documents"],
    question: "Je cherche mon attestation",
    keywords: ["attestation", "certificat", "justificatif de situation", "papier", "document officiel", "télécharger attestation", "specimen"],
    answer: "Vos attestations se trouvent dans « Mes documents ». Deux modèles SPÉCIMEN sont téléchargeables immédiatement.",
    steps: [
      { text: "Je vous emmène dans vos documents.", navigate: "/espace/documents" },
      { text: "En haut de page, deux attestations de démonstration sont proposées au téléchargement.", highlight: "documents-specimens", action: "Cliquez sur « Attestation de situation » ou « Synthèse de démonstration »." },
      { text: "Le fichier porte la mention SPÉCIMEN : il est fictif et n'a aucune valeur officielle.", action: "Enregistrez-le sur votre appareil si vous voulez le conserver." },
      { text: "Vous avez terminé ce parcours. Vos autres justificatifs déposés dans vos dossiers sont listés juste en dessous.", highlight: "documents-specimens" },
    ],
  },
  {
    id: "paiements",
    roles: ["membre"],
    pages: ["/espace", "/espace/paiements"],
    question: "Consulter mes paiements",
    keywords: ["paiement", "paiements", "virement", "remboursement", "prestation", "cotisation", "argent", "verse", "montant", "historique"],
    answer: "L'historique de vos opérations fictives est consultable dans « Mes paiements ».",
    steps: [
      { text: "J'ouvre votre historique de paiements.", navigate: "/espace/paiements" },
      { text: "Le tableau liste les opérations les plus récentes : date, libellé, référence et montant.", highlight: "payments-table" },
      { text: "Vous pouvez filtrer avec le champ de recherche.", highlight: "payments-search", action: "Tapez par exemple « remboursement » ou une référence." },
      { text: "Ces montants sont fictifs et servent uniquement à la démonstration.", action: "Aucune opération réelle n'est effectuée." },
    ],
  },
  {
    id: "suivre-demande",
    roles: ["membre"],
    pages: ["/espace", "/espace/demarches"],
    question: "Suivre une demande",
    keywords: ["suivre", "suivi", "ou en est", "avancement", "statut", "dossier", "demande", "etat dossier", "reference"],
    answer: "Chaque demande porte une référence et un statut. Vous retrouvez tout dans « Mes démarches ».",
    steps: [
      { text: "J'ouvre la liste de vos démarches.", navigate: "/espace/demarches" },
      { text: "Le statut de chaque dossier est affiché à droite.", highlight: "demarches-filters", action: "Utilisez les filtres pour ne voir que les dossiers en cours." },
      { text: "Cliquez sur un dossier pour voir son historique complet et échanger avec votre bureau.", highlight: "case-message", action: "Le bouton « Consulter » ouvre le détail." },
      { text: "Les statuts possibles sont : Brouillon, Envoyée, En cours, Pièce manquante, Terminée.", action: "« Pièce manquante » signifie qu'un justificatif est attendu de votre part." },
    ],
  },
  {
    id: "envoyer-document",
    roles: ["membre"],
    pages: ["/espace/demarches"],
    question: "Envoyer un document",
    keywords: ["envoyer document", "joindre", "deposer", "televerser", "upload", "piece justificative", "piece manquante", "ajouter fichier", "scanner"],
    answer: "Les justificats se déposent dans la conversation du dossier concerné, pas en vrac.",
    steps: [
      { text: "Ouvrez d'abord le dossier concerné dans « Mes démarches ».", navigate: "/espace/demarches", highlight: "demarches-search", action: "Retrouvez-le par son titre ou sa référence." },
      { text: "Dans le dossier, la zone de message permet de répondre et de joindre un fichier.", highlight: "case-message", action: "Écrivez un mot puis cliquez sur « Joindre un fichier »." },
      { text: "Formats acceptés : PDF, PNG, JPEG ou texte, 5 Mo maximum.", action: "N'envoyez aucune donnée médicale ni numéro de sécurité sociale réel." },
      { text: "Après l'envoi, le document apparaît dans les pièces jointes du dossier.", highlight: "case-attachments" },
    ],
  },
  {
    id: "changement-situation",
    roles: ["membre"],
    pages: ["/espace", "/espace/demarches"],
    question: "Signaler un changement de situation",
    keywords: ["changement", "changer", "mariage", "pacs", "naissance", "naissance enfant", "demenagement", "demenager", "separation", "divorce", "adresse", "nouvelle adresse", "situation"],
    answer: "Un changement de situation se déclare en créant une démarche dédiée.",
    steps: [
      { text: "Je vous emmène au formulaire de nouvelle démarche.", navigate: "/espace/demarches/nouvelle" },
      { text: "Choisissez le motif correspondant à votre situation.", highlight: "nouvelle-kind", action: "Sélectionnez « Changement de situation », « Famille » ou « Logement » selon le cas." },
      { text: "Vos informations connues sont déjà préremplies : vous n'avez rien à ressaisir.", action: "Complétez seulement ce qui a changé." },
      { text: "La liste des pièces utiles s'affiche avant l'envoi.", highlight: "nouvelle-required" },
      { text: "Vous pouvez envoyer tout de suite ou laisser le brouillon se sauvegarder.", highlight: "nouvelle-submit", action: "Cliquez sur « Envoyer ma demande » quand tout est prêt." },
    ],
  },
  {
    id: "rendez-vous",
    roles: ["membre"],
    pages: ["/espace/echanges"],
    question: "Demander un rendez-vous",
    keywords: ["rendez vous", "rdv", "rendezvous", "creneau", "entretien", "rencontrer", "conseiller", "telephonique", "visio"],
    answer: "Les demandes de rendez-vous se font depuis « Mes échanges ».",
    steps: [
      { text: "J'ouvre la page des échanges.", navigate: "/espace/echanges" },
      { text: "Renseignez le motif, la date souhaitée et, si vous voulez, le dossier concerné.", highlight: "echanges-appointment-form", action: "Une date dans les six mois à venir est acceptée." },
      { text: "Votre bureau reçoit la demande et vous répond dans vos notifications.", action: "Le statut passe de « Demandée » à « Confirmée »." },
    ],
  },
  {
    id: "preparer-message",
    roles: ["membre"],
    pages: ["/espace/echanges"],
    question: "Préparer un message à mon bureau",
    keywords: ["message", "ecrire", "contacter", "question", "poser question", "messagerie", "aide", "conseiller", "bureau"],
    answer: "Vous pouvez écrire à votre bureau depuis « Mes échanges », ou répondre directement dans un dossier.",
    steps: [
      { text: "J'ouvre la page des échanges.", navigate: "/espace/echanges" },
      { text: "Pour une question générale, utilisez le formulaire de message.", highlight: "echanges-message-form", action: "Décrivez votre demande en quelques phrases." },
      { text: "Pour une question sur un dossier précis, répondez dans le dossier lui-même : l'historique reste regroupé.", navigate: "/espace/demarches", highlight: "case-message" },
      { text: "Un conseiller fictif vous répond dans le même fil de discussion." },
    ],
  },
  {
    id: "carte-produits",
    roles: ["membre"],
    pages: ["/carte"],
    question: "Commander un produit local sur la carte",
    keywords: ["carte", "produit", "produits", "local", "commander", "commande", "retrait", "producteur", "ferme", "panier", "proximite", "livraison", "disponible", "entraide"],
    answer: "Sur la carte, les points verts sont des productions locales : cliquez dessus pour voir les produits et commander en retrait sur place.",
    steps: [
      { text: "J'ouvre la carte de France.", navigate: "/carte" },
      { text: "Choisissez les calques à afficher.", highlight: "carte-filters", action: "« Production & entraide » montre les points déposés par les adhérents." },
      { text: "Cliquez sur une épingle pour voir le détail et les produits disponibles.", highlight: "carte-map" },
      { text: "Le bouton « Commander » ouvre un formulaire de retrait sur place, sans paiement en ligne.", action: "Indiquez la quantité et le créneau de retrait." },
      { text: "Vos commandes et vos points se retrouvent dans « Mon espace local », en bas de la carte." },
    ],
  },

  // ------------------------------------------------------------------ Employés
  {
    id: "retrouver-dossier",
    roles: ["gestionnaire", "administrateur"],
    pages: ["/back-office", "/back-office/dossiers"],
    question: "Retrouver un dossier",
    keywords: ["dossier", "retrouver", "chercher dossier", "reference", "adherent", "nom", "recherche", "trouver"],
    answer: "La liste des dossiers se trouve dans « Dossiers ». Vous ne voyez que ceux de votre bureau.",
    steps: [
      { text: "J'ouvre la liste des dossiers.", navigate: "/back-office/dossiers" },
      { text: "Utilisez la recherche par référence, titre ou nom d'adhérent.", highlight: "backoffice-search", action: "Tapez par exemple une référence du type DEMO-2026-…" },
      { text: "Les filtres de statut permettent d'isoler une catégorie.", highlight: "backoffice-filters" },
      { text: "Cliquez sur « Ouvrir » pour accéder au détail complet du dossier.", highlight: "backoffice-table" },
    ],
  },
  {
    id: "comprendre-statuts",
    roles: ["gestionnaire", "administrateur"],
    pages: ["/back-office/dossiers"],
    question: "Comprendre les statuts d'un dossier",
    keywords: ["statut", "statuts", "brouillon", "envoyee", "en cours", "piece manquante", "terminee", "comprendre", "signification"],
    answer: "Un dossier suit cinq statuts, dans cet ordre.",
    steps: [
      { text: "Brouillon : la demande n'est pas encore envoyée, elle reste invisible pour vous.", highlight: "backoffice-filters" },
      { text: "Envoyée : l'adhérent vient de la transmettre, elle attend votre prise en charge." },
      { text: "En cours : vous travaillez dessus, ou l'adhérent vous a répondu." },
      { text: "Pièce manquante : vous avez demandé un justificatif, l'adhérent doit le fournir." },
      { text: "Terminée : le dossier est clos, l'historique reste consultable en lecture seule." },
    ],
  },
  {
    id: "pieces-manquantes",
    roles: ["gestionnaire", "administrateur"],
    pages: ["/back-office/dossiers"],
    question: "Identifier les pièces manquantes",
    keywords: ["piece manquante", "pieces", "manquant", "justificatif", "document manquant", "relancer", "attente"],
    answer: "Les dossiers en attente de pièce sont isolés par un filtre dédié.",
    steps: [
      { text: "J'ouvre la liste des dossiers.", navigate: "/back-office/dossiers" },
      { text: "Activez le filtre « Pièce manquante ».", highlight: "backoffice-filters", action: "Seuls les dossiers en attente d'un justificatif restent affichés." },
      { text: "Dans le dossier, les documents déjà reçus sont listés.", highlight: "case-attachments" },
      { text: "Pour demander une pièce, utilisez le formulaire de gestion : choisissez le statut « Pièce manquante » et rédigez le message.", highlight: "case-status-form" },
    ],
  },
  {
    id: "modele-reponse",
    roles: ["gestionnaire", "administrateur"],
    pages: ["/back-office/dossiers"],
    question: "Utiliser un modèle de réponse",
    keywords: ["modele", "reponse type", "repondre", "message", "rediger", "texte", "courrier"],
    answer: "Vous pouvez rédiger une réponse directement dans le dossier, elle s'ajoute à l'historique.",
    steps: [
      { text: "Ouvrez le dossier concerné.", navigate: "/back-office/dossiers", highlight: "backoffice-search" },
      { text: "La zone de message du dossier accueille votre réponse.", highlight: "case-message", action: "Formulez d'abord l'accueil, puis l'état d'avancement, puis l'action attendue." },
      { text: "Exemple de structure : « Bonjour, votre dossier est en cours d'étude. Il nous manque … Merci de le transmettre depuis cette page. »" },
      { text: "L'adhérent reçoit une notification et voit votre message dans son espace.", action: "L'historique est conservé après actualisation." },
    ],
  },
  {
    id: "rendez-vous-employe",
    roles: ["gestionnaire", "administrateur"],
    pages: ["/back-office/rendez-vous"],
    question: "Gérer les rendez-vous",
    keywords: ["rendez vous", "rdv", "agenda", "creneau", "confirmer", "annuler", "planning"],
    answer: "Les demandes de rendez-vous de votre bureau se traitent dans « Rendez-vous ».",
    steps: [
      { text: "J'ouvre l'agenda.", navigate: "/back-office/rendez-vous" },
      { text: "Chaque demande affiche le motif, l'adhérent et le créneau souhaité." },
      { text: "Le menu déroulant permet de confirmer, replanifier, annuler ou clôturer.", action: "L'adhérent est averti par une notification." },
    ],
  },
  {
    id: "messages-bureau",
    roles: ["gestionnaire", "administrateur"],
    pages: ["/back-office/messages"],
    question: "Répondre à un message d'adhérent",
    keywords: ["message", "messagerie", "repondre", "boite", "contact", "question adherent"],
    answer: "La messagerie regroupe les messages adressés à votre bureau.",
    steps: [
      { text: "J'ouvre la messagerie.", navigate: "/back-office/messages" },
      { text: "Les conversations sont regroupées par adhérent.", action: "Faites défiler pour retrouver la personne concernée." },
      { text: "Le formulaire de réponse envoie votre message dans le même fil." },
    ],
  },

  // ------------------------------------------------------------------ Le Monde Aime : initiative indépendante
  {
    id: "lma-publier",
    roles: ["membre"],
    pages: ["/le-monde-aime"],
    question: "Publier une annonce locale",
    keywords: ["publier annonce", "donner", "preter", "louer", "vendre", "chercher", "partager un objet", "panier local", "materiel evenement"],
    answer: "Un seul bouton « Publier », puis trois choix : une proposition, un besoin ou un projet. Aucun paiement en ligne.",
    steps: [
      { text: "Je vous montre le bouton de publication.", navigate: "/le-monde-aime", highlight: "lma-publish" },
      { text: "Choisissez le type de publication : proposition, besoin ou projet.", highlight: "lma-listing-form", action: "Pour une proposition : je donne, je prête, je loue, je vends, je propose une prestation ou je transmets." },
      { text: "Choisissez une catégorie, renseignez l'état, la quantité, la commune et les modalités.", action: "Pour les vêtements et chaussures, précisez la taille ou la pointure. Les produits locaux peuvent préciser l'unité, la quantité, le prix annoncé et le retrait." },
      { text: "Cliquez sur une position approximative de la carte. L'adresse exacte ne sera visible qu'aux participants de l'échange privé." },
      { text: "Publiez. Une demande reçue reste en attente jusqu'à votre acceptation explicite." },
    ],
  },
  {
    id: "lma-demander",
    roles: ["membre"],
    pages: ["/le-monde-aime"],
    question: "Demander une annonce et suivre mon échange",
    keywords: ["demander un objet", "reserver", "annonce", "don", "pret", "location", "accepter demande", "echanges locaux"],
    answer: "Vous pouvez envoyer une demande depuis une annonce. Le propriétaire doit confirmer avant toute réservation.",
    steps: [
      { text: "Je vous ramène à la carte : cliquez sur un marqueur pour ouvrir sa fiche.", navigate: "/le-monde-aime", highlight: "lma-detail" },
      { text: "Choisissez une annonce qui vous intéresse et cliquez sur « Demander ».", highlight: "lma-request" },
      { text: "Indiquez la quantité et, pour un prêt ou une location, une période souhaitée. Votre message est privé aux participants." },
      { text: "L'annonce n'est réservée qu'après l'acceptation explicite du propriétaire.", action: "Suivez la conversation dans « Mes échanges »." },
      { text: "Après la remise, chaque participant confirme son étape. Pour un prêt ou une location, le retour reste à confirmer." },
    ],
  },
  {
    id: "lma-trajet",
    roles: ["membre"],
    pages: ["/le-monde-aime"],
    question: "Proposer ou demander un trajet de proximité",
    keywords: ["trajet", "livraison", "velo", "transporter panier", "sur mon trajet", "transporteur", "collecter", "remettre"],
    answer: "Un trajet est une proposition. Aucune collecte n'est garantie avant acceptation explicite du transporteur.",
    steps: [
      { text: "Je vous montre le bouton de publication.", navigate: "/le-monde-aime", highlight: "lma-publish" },
      { text: "Choisissez « Publier un trajet », puis indiquez départ, destination, date, transport, capacité et conditions.", highlight: "lma-trip-form" },
      { text: "Publiez le trajet. Une demande reçue reste en attente jusqu'à votre confirmation." },
      { text: "Le transporteur confirme ensuite la collecte, puis la remise. Le retrait direct reste toujours possible." },
    ],
  },

  // ------------------------------------------------------------------ Administration
  {
    id: "admin-roles",
    roles: ["administrateur"],
    pages: ["/admin/utilisateurs"],
    question: "Attribuer un rôle ou un bureau",
    keywords: ["role", "roles", "permission", "gestionnaire", "administrateur", "membre", "compte", "bureau autorise", "acces"],
    answer: "Les rôles et les bureaux autorisés se modifient dans « Utilisateurs ».",
    steps: [
      { text: "J'ouvre la gestion des comptes.", navigate: "/admin/utilisateurs" },
      { text: "Chaque ligne permet de changer le rôle et le bureau.", highlight: "admin-users-table", action: "Pensez à cliquer sur « Enregistrer » après modification." },
      { text: "Un gestionnaire doit être rattaché à un bureau : il ne verra que les dossiers de ce bureau." },
    ],
  },
  {
    id: "admin-audit",
    roles: ["administrateur"],
    pages: ["/admin"],
    question: "Consulter le journal d'audit",
    keywords: ["audit", "journal", "trace", "tracabilite", "historique actions", "qui a fait"],
    answer: "Le journal d'audit liste les actions enregistrées sur la plateforme.",
    steps: [
      { text: "J'ouvre le tableau de bord d'administration.", navigate: "/admin" },
      { text: "Le journal affiche la date, l'auteur, l'action et l'objet concerné.", highlight: "admin-audit" },
    ],
  },
  {
    id: "admin-contenus",
    roles: ["administrateur"],
    pages: ["/admin/contenus"],
    question: "Publier un article public",
    keywords: ["article", "contenu", "publier", "guide", "redaction", "site public", "information"],
    answer: "Les articles et guides du site public se gèrent dans « Contenus ».",
    steps: [
      { text: "J'ouvre la gestion des contenus.", navigate: "/admin/contenus" },
      { text: "Le formulaire du haut permet de créer un article.", highlight: "admin-content-form", action: "Renseignez le titre, la thématique, le résumé et le contenu." },
      { text: "Cochez « Publier immédiatement » pour le rendre visible sur le site public." },
    ],
  },

  // ------------------------------------------------------------------ Transverse
  {
    id: "contacter-conseiller",
    roles: ["visiteur", "membre"],
    pages: ["/annuaire", "/espace/echanges"],
    question: "Contacter un conseiller",
    keywords: ["contacter", "conseiller", "telephone", "appeler", "humain", "joindre", "parler a quelqu'un"],
    answer: "Vous pouvez appeler votre bureau directement depuis l'annuaire, ou lui écrire depuis votre espace.",
    steps: [
      { text: "L'annuaire liste les bureaux avec téléphone, adresse et horaires.", navigate: "/annuaire" },
      { text: "Si vous êtes connecté, « Mes échanges » permet d'envoyer un message écrit à votre bureau.", navigate: "/espace/echanges", highlight: "echanges-message-form" },
    ],
  },
];

/** Suggestions affichées selon la page consultée. */
export type Suggestion = { label: string; scenarioId?: string; href?: string; kind: "scenario" | "link" };

export const DEFAULT_SUGGESTIONS: Suggestion[] = [
  { label: "À quoi sert cette page ?", kind: "scenario", scenarioId: "__page__" },
  { label: "Guidez-moi", kind: "scenario", scenarioId: "__guide__" },
  { label: "Je cherche une démarche", kind: "scenario", scenarioId: "__search__" },
  { label: "Contacter un conseiller", kind: "scenario", scenarioId: "contacter-conseiller" },
];

const PAGE_SPECIFIC: Record<string, Suggestion[]> = {
  "/": [
    { label: "Je déménage", kind: "link", href: "/accompagnement?besoin=demenagement" },
    { label: "Un proche est décédé", kind: "link", href: "/accompagnement?besoin=deces_proche" },
    { label: "Explorer la carte", kind: "link", href: "/le-monde-aime" },
  ],
  "/accompagnement": [
    { label: "Je déménage", kind: "link", href: "/accompagnement?besoin=demenagement" },
    { label: "Un proche est décédé", kind: "link", href: "/accompagnement?besoin=deces_proche" },
  ],
  "/espace": [
    { label: "Je déménage", kind: "link", href: "/espace/demarches/nouvelle?situation=demenagement" },
    { label: "Un proche est décédé", kind: "link", href: "/espace/demarches/nouvelle?situation=deces_proche" },
    { label: "Trouver mon attestation", kind: "scenario", scenarioId: "attestation" },
    { label: "Voir mes paiements", kind: "scenario", scenarioId: "paiements" },
    { label: "Suivre ma demande", kind: "scenario", scenarioId: "suivre-demande" },
  ],
  "/espace/demarches/nouvelle": [
    { label: "Je déménage", kind: "link", href: "/espace/demarches/nouvelle?situation=demenagement" },
    { label: "Un proche est décédé", kind: "link", href: "/espace/demarches/nouvelle?situation=deces_proche" },
  ],
  "/espace/documents": [
    { label: "Télécharger une attestation SPÉCIMEN", kind: "scenario", scenarioId: "attestation" },
    { label: "Envoyer un justificatif", kind: "scenario", scenarioId: "envoyer-document" },
  ],
  "/espace/demarches": [
    { label: "Suivre une demande", kind: "scenario", scenarioId: "suivre-demande" },
    { label: "Signaler un changement", kind: "scenario", scenarioId: "changement-situation" },
    { label: "Envoyer un document", kind: "scenario", scenarioId: "envoyer-document" },
  ],
  "/espace/paiements": [{ label: "Comprendre mes paiements", kind: "scenario", scenarioId: "paiements" }],
  "/espace/echanges": [
    { label: "Demander un rendez-vous", kind: "scenario", scenarioId: "rendez-vous" },
    { label: "Préparer un message", kind: "scenario", scenarioId: "preparer-message" },
  ],
  "/carte": [
    { label: "Commander un produit local", kind: "scenario", scenarioId: "carte-produits" },
    { label: "Déposer mon point sur la carte", kind: "scenario", scenarioId: "carte-produits" },
  ],
  "/le-monde-aime": [
    { label: "Publier une annonce", kind: "scenario", scenarioId: "lma-publier" },
    { label: "Demander un objet", kind: "scenario", scenarioId: "lma-demander" },
    { label: "Proposer un trajet", kind: "scenario", scenarioId: "lma-trajet" },
  ],
  "/back-office": [
    { label: "Retrouver un dossier", kind: "scenario", scenarioId: "retrouver-dossier" },
    { label: "Voir les pièces manquantes", kind: "scenario", scenarioId: "pieces-manquantes" },
  ],
  "/back-office/dossiers": [
    { label: "Comprendre les statuts", kind: "scenario", scenarioId: "comprendre-statuts" },
    { label: "Demander une pièce manquante", kind: "scenario", scenarioId: "pieces-manquantes" },
    { label: "Utiliser un modèle de réponse", kind: "scenario", scenarioId: "modele-reponse" },
  ],
  "/back-office/rendez-vous": [{ label: "Gérer les rendez-vous", kind: "scenario", scenarioId: "rendez-vous-employe" }],
  "/back-office/messages": [{ label: "Répondre à un adhérent", kind: "scenario", scenarioId: "messages-bureau" }],
  "/admin": [{ label: "Consulter le journal d'audit", kind: "scenario", scenarioId: "admin-audit" }],
  "/admin/utilisateurs": [{ label: "Attribuer un rôle", kind: "scenario", scenarioId: "admin-roles" }],
  "/admin/contenus": [{ label: "Publier un article", kind: "scenario", scenarioId: "admin-contenus" }],
};

export function suggestionsForPath(pathname: string, role: AssistantRole): Suggestion[] {
  const normalized = normalizePath(pathname);
  const specific = PAGE_SPECIFIC[normalized] ?? [];
  const base = DEFAULT_SUGGESTIONS.filter((s) => !specific.some((sp) => sp.label === s.label));
  const merged = [...specific, ...base];
  const filtered = merged.filter((s) => {
    if (!s.scenarioId || s.scenarioId.startsWith("__")) return true;
    const scenario = SCENARIOS.find((sc) => sc.id === s.scenarioId);
    return scenario ? scenario.roles.includes(role) : false;
  });
  return filtered.slice(0, 6);
}

/** Ramène une URL vers la route enregistrée la plus proche. */
export function normalizePath(pathname: string): string {
  const clean = pathname.split("?")[0].replace(/\/+$/, "") || "/";
  const exact = ROUTES.find((route) => route.path === clean);
  if (exact) return exact.path;
  const segments = clean.split("/").filter(Boolean);
  while (segments.length > 1) {
    segments.pop();
    const candidate = `/${segments.join("/")}`;
    const found = ROUTES.find((route) => route.path === candidate);
    if (found) return found.path;
  }
  return "/";
}

export function routeForPath(pathname: string): RouteEntry | undefined {
  return ROUTES.find((route) => route.path === normalizePath(pathname));
}

export function scenariosForRole(role: AssistantRole): AssistantScenario[] {
  return SCENARIOS.filter((scenario) => scenario.roles.includes(role));
}
