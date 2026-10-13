/** Sources primaires consultées pour le positionnement d'AIME®.
 * Le contenu est éditorial : la disponibilité des services externes n'est pas intégrée.
 */
export type Source = { name: string; url: string; lesson: string };
export type Milestone = { title: string; present: string; next: string; status: "fonctionne" | "a_verifier" | "habilitation" };

export const SOURCES: Source[] = [
  { name: "Service-Public — Je déménage en France", url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F14128", lesson: "La déclaration groupée du changement d'adresse existe déjà ; AIME® doit y orienter et préparer ce qui n'est pas couvert, pas la recréer." },
  { name: "Service-Public — Un proche est décédé", url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F16507", lesson: "Le guide officiel adapte les étapes au lieu et à la situation. Il n'existe pas de téléservice unique pour prévenir tous les organismes." },
  { name: "Suomi.fi — services pour les moments de vie", url: "https://www.suomi.fi/frontpage", lesson: "Un portail transversal, des messages officiels et des mandats existent déjà en Finlande : l'unification administrative n'est pas une invention d'AIME®." },
  { name: "FranceConnect — Devenir fournisseur de service", url: "https://docs.partenaires.franceconnect.gouv.fr/fs/devenir-fs/", lesson: "Éligibilité, habilitation Datapass, intégration, qualification et production sont requises. AIME® n'est pas raccordé." },
  { name: "API Particulier — Conditions d'accès", url: "https://particulier.api.gouv.fr/faq", lesson: "Accès réservé aux acteurs publics investis d'une mission de service public ; un prestataire privé n'obtient pas directement ces données." },
  { name: "Annuaire de l'administration — API.gouv.fr", url: "https://api.gouv.fr/les-api/api-annuaire-administration-services-publics", lesson: "Annuaire officiel ouvert, avec coordonnées mises à jour ; candidat à une future couche de points officiels clairement identifiés." },
  { name: "DesignGouv — RGAA 4.1.2 et futur RGAA 5", url: "https://design.numerique.gouv.fr/articles/2026-03-02-rgaa5/", lesson: "Le RGAA 4.1.2 reste la base en vigueur ; le RGAA 5 est en préparation. Une déclaration de conformité exige un audit effectif." },
  { name: "W3C — WCAG 2.2", url: "https://www.w3.org/TR/WCAG22/", lesson: "Cible AA : focus non masqué, cible tactile, authentification accessible, contrastes, alternatives à la carte." },
  { name: "CNIL — Minimisation dès la conception", url: "https://www.cnil.fr/fr/tenir-compte-de-la-protection-des-donnees-dans-la-conception-du-systeme", lesson: "Une règle simple qui utilise moins de données doit être privilégiée lorsqu'elle suffit ; les données sensibles demandent une vigilance particulière." },
  { name: "Awwwards — Critères d'évaluation", url: "https://www.awwwards.com/about-evaluation/", lesson: "Évaluation annoncée : design 40 %, usability 30 %, créativité 20 %, contenu 10 %. Un beau hero ne compense pas un parcours incompréhensible." },
];

export const MILESTONES: Milestone[] = [
  { title: "Un besoin → un plan personnel", present: "Parcours guidés, brouillons, tâches et rappels personnels dans Mon espace.", next: "Tester la compréhension et la réussite des parcours avec des personnes réelles, y compris en situation de handicap.", status: "fonctionne" },
  { title: "Un territoire → des personnes et ressources", present: "Carte, marqueurs regroupés, fiche au clic, filtres, liste textuelle accessible, réservations confirmées par leur propriétaire.", next: "Mesurer la réussite sur mobile et en réseau lent ; revoir les groupes très denses avec des tests usagers.", status: "fonctionne" },
  { title: "Un document → des accès précis", present: "Stockage privé, contrôle côté serveur, partages explicites et révocables.", next: "Formaliser durées de conservation, export et suppression des données avant tout déploiement avec des données réelles.", status: "fonctionne" },
  { title: "Une question → une orientation expliquée", present: "Moteur local de mots-clés et scénarios ; aucune IA générative, aucun traitement externe de la question.", next: "Faire relire les règles, leurs sources et leur date de vérification ; tester les formulations non reconnues.", status: "fonctionne" },
  { title: "Données d'organismes publics", present: "Aucune donnée de compte administratif n'est récupérée et aucune démarche n'est transmise automatiquement.", next: "Étudier l'éligibilité juridique de chaque flux avant toute API personnelle ; une intégration n'est jamais implicite.", status: "habilitation" },
  { title: "Annuaire officiel de proximité", present: "L'annuaire interne contient des points fictifs clairement signalés. Il n'est pas le référentiel officiel des guichets.", next: "Étudier l'API ouverte de la DILA et afficher la provenance, la date et les limites de ses données si elle est intégrée.", status: "a_verifier" },
  { title: "Accessibilité mesurée", present: "Labels, focus visible, navigation clavier, alternative textuelle et mouvement réduit ont commencé à être travaillés.", next: "Audit RGAA 4.1.2 et WCAG 2.2 AA avec des personnes handicapées, correction, puis déclaration fondée sur des résultats réels.", status: "a_verifier" },
];

export const POSITIONING = [
  "Service-Public sait déjà déclarer un changement d'adresse à plusieurs organismes : AIME® ne doit pas le dupliquer.",
  "Suomi.fi relie déjà des services et mandats publics : la promesse « jamais vu dans le monde » serait fausse.",
  "AIME® peut se distinguer en liant dans la même expérience un moment de vie privé, les démarches pertinentes et les ressources humaines locales, sans confondre préparation et décision officielle.",
  "La carte et l'assistant restent deux accès au même compte et aux mêmes données ; ils ne constituent pas des systèmes séparés.",
];

export const PILOT_CRITERIA = [
  "Le parcours déménagement conduit au service officiel groupé, sans ressaisie inutile d'adresse dans AIME®.",
  "Le parcours décès n'exige ni identité de la personne défunte, ni donnée médicale.",
  "Une personne comprend la prochaine action et qui doit l'accomplir, sans connaître à l'avance l'organisme.",
  "La carte est utilisable sans souris ; ses marqueurs ont une alternative textuelle repliable.",
  "Une action « effectuée selon vous » ne devient jamais une confirmation d'organisme sans preuve vérifiable.",
  "À 200 % de zoom et sur un téléphone, les boutons, filtres et panneaux restent utilisables et le focus visible.",
  "Un audit externe et des tests usagers sont réalisés avant toute revendication de conformité ou candidature à un prix.",
];
