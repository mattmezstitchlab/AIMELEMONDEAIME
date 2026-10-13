import bcrypt from "bcryptjs";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import {
  offices,
  users,
  procedureTypes,
  cases,
  caseEvents,
  documents,
  messages,
  payments,
  appointments,
  articles,
  notifications,
  auditLogs,
  localPoints,
  localProducts,
  localOrders,
  workerAvailabilities,
  communityListings,
  communityRequests,
  communityMessages,
  communityTrips,
  communityTransportRequests,
  communityEventPlans,
  communitySavedSearches,
  communityReports,
  contentReports,
  projectMessages,
  projectDocuments,
  projectNeeds,
  projectMembers,
  projects,
  circlePosts,
  circleMembers,
  circles,
  artistProfiles,
  profilePhotos,
  documentShares,
  artistEngagements,
  journeyEvents,
  journeyTasks,
  journeys,
  type FormFieldDef,
} from "./schema";

export async function seedDatabase(db: NodePgDatabase) {

  console.log("Nettoyage des tables existantes…");
  // TRUNCATE CASCADE : purge toutes les tables en respectant les contraintes
  // d'intégrité référentielle, quelle que soit l'ordre de suppression.
  await db.execute(sql`TRUNCATE
    community_transport_requests, community_messages, community_requests,
    community_trips, community_event_plans, community_saved_searches,
    community_listings, community_reports, document_shares, artist_engagements,
    journey_events, journey_tasks, journeys, content_reports,
    project_messages, project_documents, project_needs, project_members,
    projects, circle_posts, circle_members, circles, artist_profiles,
    profile_photos, local_orders, local_products, local_points,
    worker_availabilities, audit_logs, notifications, messages,
    appointments, payments, documents, case_events, cases,
    procedure_types, articles, users, offices
    RESTART IDENTITY CASCADE`);

  console.log("Création des bureaux locaux…");
  const officeRows = await db
    .insert(offices)
    .values([
        {
          name: 'Bureau Beauce-Val de Loire',
          code: 'BVL01',
          address: '12 rue des Moissons',
          city: 'Chartres',
          postalCode: '28000',
          phone: '02 37 00 00 01',
          hours: 'Lun-Ven 9h-17h, accueil sans RDV le mardi',
          region: 'Centre-Val de Loire',
          lat: "48.4485",
          lng: "1.487",
        },
        {
          name: 'Bureau Armor-Finistère',
          code: 'ARF02',
          address: '5 quai des Primeurs',
          city: 'Saint-Brieuc',
          postalCode: '22000',
          phone: '02 96 00 00 02',
          hours: 'Lun-Ven 8h30-16h30',
          region: 'Bretagne',
          lat: "48.5136",
          lng: "-2.7654",
        },
        {
          name: 'Bureau Provence-Alpilles',
          code: 'PVA03',
          address: '18 avenue des Vergers',
          city: 'Salon-de-Provence',
          postalCode: '13300',
          phone: '04 90 00 00 03',
          hours: 'Lun-Jeu 9h-17h, Ven 9h-12h',
          region: "Provence-Alpes-Côte d'Azur",
          lat: "43.6403",
          lng: "5.0972",
        },
        {
          name: 'Bureau Aquitaine-Landes',
          code: 'AQL04',
          address: '27 rue des Vignerons',
          city: 'Mont-de-Marsan',
          postalCode: '40000',
          phone: '05 58 00 00 04',
          hours: 'Lun-Ven 9h-17h',
          region: 'Nouvelle-Aquitaine',
          lat: "43.891",
          lng: "-0.5007",
        },
        {
          name: 'Bureau Portes de Bretagne',
          code: 'PDB05',
          address: '3 esplanade de la Gare',
          city: 'Rennes',
          postalCode: '35000',
          phone: '02 99 00 00 05',
          hours: 'Lun-Ven 8h45-17h15',
          region: 'Bretagne',
          lat: "48.1173",
          lng: "-1.6778",
        },
        {
          name: 'Bureau Cornouaille',
          code: 'CRN06',
          address: "14 rue du Guilligomarc'h",
          city: 'Quimper',
          postalCode: '29000',
          phone: '02 98 00 00 06',
          hours: 'Lun-Ven 9h-16h30',
          region: 'Bretagne',
          lat: "47.9957",
          lng: "-4.1023",
        },
        {
          name: 'Bureau Pays de Léon',
          code: 'PDL07',
          address: '22 avenue de la Fontaine Blanche',
          city: 'Brest',
          postalCode: '29200',
          phone: '02 98 00 00 07',
          hours: 'Lun-Ven 8h30-16h30',
          region: 'Bretagne',
          lat: "48.3904",
          lng: "-4.4861",
        },
        {
          name: 'Bureau Mayenne-Sarthe',
          code: 'MYS08',
          address: '9 boulevard Carnot',
          city: 'Le Mans',
          postalCode: '72000',
          phone: '02 43 00 00 08',
          hours: 'Lun-Ven 9h-17h',
          region: 'Pays de la Loire',
          lat: "48.0061",
          lng: "0.1996",
        },
        {
          name: 'Bureau Vendée-Loire',
          code: 'VDL09',
          address: '45 rue Maréchal Joffre',
          city: 'La Roche-sur-Yon',
          postalCode: '85000',
          phone: '02 51 00 00 09',
          hours: 'Lun-Ven 9h-16h45',
          region: 'Pays de la Loire',
          lat: "46.6702",
          lng: "-1.4264",
        },
        {
          name: 'Bureau Anjou-Touraine',
          code: 'ANT10',
          address: '7 place du Ralliement',
          city: 'Angers',
          postalCode: '49000',
          phone: '02 41 00 00 10',
          hours: 'Lun-Ven 9h-17h',
          region: 'Pays de la Loire',
          lat: "47.4784",
          lng: "-0.5632",
        },
        {
          name: 'Bureau Loire-Atlantique',
          code: 'LOA11',
          address: '2 rue des Halles',
          city: 'Nantes',
          postalCode: '44000',
          phone: '02 40 00 00 11',
          hours: 'Lun-Ven 8h30-17h',
          region: 'Pays de la Loire',
          lat: "47.2184",
          lng: "-1.5536",
        },
        {
          name: 'Bureau Normandie-Manche',
          code: 'NMC12',
          address: '30 quai de Juillet',
          city: 'Caen',
          postalCode: '14000',
          phone: '02 31 00 00 12',
          hours: 'Lun-Ven 9h-17h',
          region: 'Normandie',
          lat: "49.1829",
          lng: "-0.3707",
        },
        {
          name: 'Bureau Seine-Normandie',
          code: 'SNR13',
          address: "18 rue Jeanne d'Arc",
          city: 'Rouen',
          postalCode: '76000',
          phone: '02 35 00 00 13',
          hours: 'Lun-Ven 8h45-16h45',
          region: 'Normandie',
          lat: "49.4432",
          lng: "1.0999",
        },
        {
          name: 'Bureau Picardie-Aisne',
          code: 'PCA14',
          address: '11 rue Saint-Fuscien',
          city: 'Amiens',
          postalCode: '80000',
          phone: '03 22 00 00 14',
          hours: 'Lun-Ven 9h-17h',
          region: 'Hauts-de-France',
          lat: "49.8941",
          lng: "2.2958",
        },
        {
          name: 'Bureau Flandre-Artois',
          code: 'FLA15',
          address: '6 rue Gambetta',
          city: 'Arras',
          postalCode: '62000',
          phone: '03 21 00 00 15',
          hours: 'Lun-Ven 9h-16h30',
          region: 'Hauts-de-France',
          lat: "50.293",
          lng: "2.78",
        },
        {
          name: 'Bureau Nord-Picardie',
          code: 'NOP16',
          address: '24 boulevard de Belfort',
          city: 'Lille',
          postalCode: '59000',
          phone: '03 20 00 00 16',
          hours: 'Lun-Ven 8h30-17h',
          region: 'Hauts-de-France',
          lat: "50.6292",
          lng: "3.0573",
        },
        {
          name: 'Bureau Champagne-Ardenne',
          code: 'CHA17',
          address: '8 rue de Tambise',
          city: 'Reims',
          postalCode: '51100',
          phone: '03 26 00 00 17',
          hours: 'Lun-Ven 9h-17h',
          region: 'Grand Est',
          lat: "49.2583",
          lng: "4.0317",
        },
        {
          name: 'Bureau Lorraine',
          code: 'LOR18',
          address: '1 avenue de la Liberté',
          city: 'Metz',
          postalCode: '57000',
          phone: '03 87 00 00 18',
          hours: 'Lun-Ven 9h-17h',
          region: 'Grand Est',
          lat: "49.1193",
          lng: "6.1757",
        },
        {
          name: 'Bureau Alsace',
          code: 'ALS19',
          address: '5 rue des Clefs',
          city: 'Colmar',
          postalCode: '68000',
          phone: '03 89 00 00 19',
          hours: 'Lun-Jeu 9h-17h, Ven 9h-12h',
          region: 'Grand Est',
          lat: "48.0793",
          lng: "7.3554",
        },
        {
          name: 'Bureau Bourgogne',
          code: 'BOU20',
          address: '12 rue de la Liberté',
          city: 'Dijon',
          postalCode: '21000',
          phone: '03 80 00 00 20',
          hours: 'Lun-Ven 9h-17h',
          region: 'Bourgogne-Franche-Comté',
          lat: "47.322",
          lng: "5.0415",
        },
        {
          name: 'Bureau Franche-Comté',
          code: 'FRC21',
          address: '9 rue de la Préfecture',
          city: 'Besançon',
          postalCode: '25000',
          phone: '03 81 00 00 21',
          hours: 'Lun-Ven 9h-17h',
          region: 'Bourgogne-Franche-Comté',
          lat: "47.2378",
          lng: "6.0204",
        },
        {
          name: 'Bureau Alpes-du-Nord',
          code: 'ALN22',
          address: '4 place du Château',
          city: 'Chambéry',
          postalCode: '73000',
          phone: '04 79 00 00 22',
          hours: 'Lun-Ven 9h-17h',
          region: 'Auvergne-Rhône-Alpes',
          lat: "45.565",
          lng: "5.9177",
        },
        {
          name: 'Bureau Rhône-Loire',
          code: 'RHL23',
          address: '16 rue de la Barre',
          city: 'Lyon',
          postalCode: '69000',
          phone: '04 72 00 00 23',
          hours: 'Lun-Ven 8h30-17h30',
          region: 'Auvergne-Rhône-Alpes',
          lat: "45.764",
          lng: "4.8357",
        },
        {
          name: 'Bureau Auvergne',
          code: 'AUV24',
          address: '21 rue Montlosier',
          city: 'Clermont-Ferrand',
          postalCode: '63000',
          phone: '04 73 00 00 24',
          hours: 'Lun-Ven 9h-17h',
          region: 'Auvergne-Rhône-Alpes',
          lat: "45.7772",
          lng: "3.087",
        },
        {
          name: 'Bureau Limousin-Quercy',
          code: 'LIQ25',
          address: '10 rue des Écoles',
          city: 'Limoges',
          postalCode: '87000',
          phone: '05 55 00 00 25',
          hours: 'Lun-Ven 9h-17h',
          region: 'Nouvelle-Aquitaine',
          lat: "45.8336",
          lng: "1.2611",
        },
        {
          name: 'Bureau Poitou-Charentes',
          code: 'POC26',
          address: "3 rue du Puits-d'Enfer",
          city: 'Poitiers',
          postalCode: '86000',
          phone: '05 49 00 00 26',
          hours: 'Lun-Ven 9h-17h',
          region: 'Nouvelle-Aquitaine',
          lat: "46.5802",
          lng: "0.3404",
        },
        {
          name: 'Bureau Gironde-Gascogne',
          code: 'GIG27',
          address: "13 cours de l'Intendance",
          city: 'Bordeaux',
          postalCode: '33000',
          phone: '05 56 00 00 27',
          hours: 'Lun-Ven 8h30-17h',
          region: 'Nouvelle-Aquitaine',
          lat: "44.8378",
          lng: "-0.5792",
        },
        {
          name: 'Bureau Béarn-Pyrénées',
          code: 'BEP28',
          address: '2 rue Serviez',
          city: 'Pau',
          postalCode: '64000',
          phone: '05 59 00 00 28',
          hours: 'Lun-Ven 9h-16h45',
          region: 'Nouvelle-Aquitaine',
          lat: "43.3017",
          lng: "-0.3706",
        },
        {
          name: 'Bureau Midi-Pyrénées',
          code: 'MIP29',
          address: '7 allées Jean Jaurès',
          city: 'Toulouse',
          postalCode: '31000',
          phone: '05 61 00 00 29',
          hours: 'Lun-Ven 8h45-17h',
          region: 'Occitanie',
          lat: "43.6047",
          lng: "1.4442",
        },
        {
          name: 'Bureau Languedoc-Roussillon',
          code: 'LGR30',
          address: '19 avenue de Toulouse',
          city: 'Montpellier',
          postalCode: '34000',
          phone: '04 67 00 00 30',
          hours: 'Lun-Ven 9h-17h',
          region: 'Occitanie',
          lat: "43.6108",
          lng: "3.8767",
        },
        {
          name: 'Bureau Alpes-Maritimes',
          code: 'ALM31',
          address: '5 rue de la Buffa',
          city: 'Nice',
          postalCode: '06000',
          phone: '04 93 00 00 31',
          hours: 'Lun-Ven 9h-17h',
          region: "Provence-Alpes-Côte d'Azur",
          lat: "43.7031",
          lng: "7.2663",
        },
        {
          name: 'Bureau Corse',
          code: 'COR32',
          address: '1 cours Napoléon',
          city: 'Ajaccio',
          postalCode: '20000',
          phone: '04 95 00 00 32',
          hours: 'Lun-Ven 9h-16h',
          region: 'Corse',
          lat: "41.9267",
          lng: "8.7369",
        },
    ])
    .returning();

  const [beauce, armor, provence, aquitaine, bretagne, cornouaille, leon, sarthe, vendee, anjou, loireAtlantique, normandie, seine, picardie, flandre, nord, champagne, lorraine, alsace, bourgogne, francheComte, alpes, rhone, auvergne, limousin, poitou, gironde, bearn, midi, languedoc, alpesMaritimes, corse] = officeRows;

  console.log("Création des utilisateurs de démonstration…");
  const pw = await bcrypt.hash("Demo1234!", 10);

  const [admin] = await db
    .insert(users)
    .values({
      email: "admin@aime-demo.fr",
      passwordHash: pw,
      role: "administrateur",
      fullName: "Sophie Bernard",
      phone: "01 23 45 67 89",
      onboardingCompleted: true,
    })
    .returning();

  const [agentBeauce] = await db
    .insert(users)
    .values({
      email: "agent.beauce@aime-demo.fr",
      passwordHash: pw,
      role: "gestionnaire",
      fullName: "Nicolas Petit",
      phone: "02 37 00 00 10",
      officeId: beauce.id,
      onboardingCompleted: true,
    })
    .returning();

  const [agentArmor] = await db
    .insert(users)
    .values({
      email: "agent.armor@aime-demo.fr",
      passwordHash: pw,
      role: "gestionnaire",
      fullName: "Claire Morvan",
      phone: "02 96 00 00 11",
      officeId: armor.id,
      onboardingCompleted: true,
    })
    .returning();

  const [jean] = await db
    .insert(users)
    .values({
      email: "jean.dupont@exemple.fr",
      passwordHash: pw,
      role: "membre",
      fullName: "Jean Dupont",
      phone: "06 12 34 56 78",
      officeId: beauce.id,
      situation: "salarie_agricole",
      address: "3 chemin des Blés",
      city: "Chartres",
      postalCode: "28000",
      birthDate: "1988-04-12",
      familyStatus: "Marié, 2 enfants",
      onboardingCompleted: true,
    })
    .returning();

  const [marie] = await db
    .insert(users)
    .values({
      email: "marie.lefevre@exemple.fr",
      passwordHash: pw,
      role: "membre",
      fullName: "Marie Lefèvre",
      phone: "06 23 45 67 89",
      officeId: armor.id,
      situation: "exploitant",
      address: "8 route des Herbages",
      city: "Saint-Brieuc",
      postalCode: "22000",
      birthDate: "1979-09-03",
      familyStatus: "Pacsée, 1 enfant",
      onboardingCompleted: true,
    })
    .returning();

  const [paul] = await db
    .insert(users)
    .values({
      email: "paul.martin@exemple.fr",
      passwordHash: pw,
      role: "membre",
      fullName: "Paul Martin",
      phone: "06 34 56 78 90",
      officeId: beauce.id,
      situation: "retraite",
      address: "22 impasse du Verger",
      city: "Chartres",
      postalCode: "28000",
      birthDate: "1958-01-20",
      familyStatus: "Marié",
      onboardingCompleted: true,
    })
    .returning();

  // Compte de visite guidée (voir /decouvrir) : session marquée « demo »,
  // écritures bloquées par le proxy — lecture seule dans la vraie interface.
  await db.insert(users).values({
    email: "demo@aime-demo.fr",
    passwordHash: pw,
    role: "membre",
    fullName: "Visiteur de démonstration",
    officeId: beauce.id,
    onboardingCompleted: true,
    isDemo: true,
  });

  const [lucas] = await db
    .insert(users)
    .values({
      email: "lucas.moreau@exemple.fr",
      passwordHash: pw,
      role: "membre",
      fullName: "Lucas Moreau",
      phone: "06 45 67 89 01",
      officeId: beauce.id,
      situation: "famille",
      address: "5 rue des Tisserands",
      city: "Chartres",
      postalCode: "28000",
      birthDate: "2001-06-17",
      familyStatus: "Célibataire",
      onboardingCompleted: true,
    })
    .returning();

  const [amelie] = await db
    .insert(users)
    .values({
      email: "amelie.roux@exemple.fr",
      passwordHash: pw,
      role: "membre",
      fullName: "Amélie Roux",
      phone: "06 56 78 90 12",
      officeId: loireAtlantique.id,
      situation: "exploitant",
      address: "1 lieu-dit Les Champs",
      city: "Nantes",
      postalCode: "44000",
      birthDate: "1990-03-22",
      familyStatus: "Célibataire",
      onboardingCompleted: true,
    })
    .returning();

  void provence;
  void aquitaine;
  void bretagne;
  void cornouaille;
  void leon;
  void sarthe;
  void vendee;
  void anjou;
  void normandie;
  void seine;
  void picardie;
  void flandre;
  void nord;
  void champagne;
  void lorraine;
  void alsace;
  void bourgogne;
  void francheComte;
  void alpes;
  void rhone;
  void auvergne;
  void limousin;
  void poitou;
  void gironde;
  void bearn;
  void midi;
  void languedoc;
  void alpesMaritimes;
  void corse;

  console.log("Création des types de démarches…");
  const prefillCommon: FormFieldDef[] = [];
  const procRows = await db
    .insert(procedureTypes)
    .values([
      {
        slug: "changement-situation-familiale",
        title: "Déclarer un changement de situation familiale",
        description: "Mariage, Pacs, naissance, séparation : signalez tout changement affectant votre dossier familial.",
        category: "famille",
        kind: "changement",
        requiredDocuments: ["Justificatif d'état civil", "Livret de famille ou attestation Pacs"],
        fields: [
          { name: "nature", label: "Nature du changement", type: "select", options: ["Mariage", "Pacs", "Naissance", "Séparation", "Autre"], required: true },
          { name: "dateEvenement", label: "Date de l'événement", type: "date", required: true },
          { name: "nomComplet", label: "Nom complet", type: "text", prefillFrom: "fullName", required: true },
          { name: "adresse", label: "Adresse", type: "text", prefillFrom: "address", required: true },
          { name: "precisions", label: "Précisions complémentaires", type: "textarea" },
        ],
      },
      {
        slug: "demande-prestation-familiale",
        title: "Demander une prestation familiale",
        description: "Formulez une demande de prestation familiale (allocations, complément, aide à la garde).",
        category: "famille",
        kind: "demande",
        requiredDocuments: ["Avis d'imposition", "RIB", "Justificatif de scolarité si applicable"],
        fields: [
          { name: "typePrestation", label: "Type de prestation demandée", type: "select", options: ["Allocation familiale", "Complément familial", "Aide à la garde d'enfant"], required: true },
          { name: "situationFamiliale", label: "Situation familiale", type: "text", prefillFrom: "familyStatus" },
          { name: "precisions", label: "Précisions", type: "textarea" },
        ],
      },
      {
        slug: "demande-aide-logement",
        title: "Demander une aide au logement",
        description: "Sollicitez une aide personnelle au logement adaptée à votre situation agricole.",
        category: "logement",
        kind: "demande",
        requiredDocuments: ["Bail ou titre de propriété", "Avis d'imposition", "RIB"],
        fields: [
          { name: "adresseLogement", label: "Adresse du logement", type: "text", prefillFrom: "address", required: true },
          { name: "ville", label: "Ville", type: "text", prefillFrom: "city", required: true },
          { name: "typeLogement", label: "Type de logement", type: "select", options: ["Locataire", "Propriétaire", "Logement de fonction"], required: true },
          { name: "montantLoyer", label: "Montant du loyer ou de la charge (€)", type: "number" },
        ],
      },
      {
        slug: "declaration-revenus-exploitant",
        title: "Déclarer mes revenus professionnels",
        description: "Déclarez vos revenus professionnels agricoles pour le calcul de vos cotisations.",
        category: "cotisations",
        kind: "declaration",
        requiredDocuments: ["Liasse fiscale", "Bilan comptable"],
        fields: [
          { name: "exercice", label: "Exercice concerné", type: "text", required: true },
          { name: "revenuProfessionnel", label: "Revenu professionnel déclaré (€)", type: "number", required: true },
          { name: "commentaire", label: "Commentaire", type: "textarea" },
        ],
      },
      {
        slug: "demande-retraite-agricole",
        title: "Demander ma retraite agricole",
        description: "Déposez votre demande de liquidation de retraite de base et complémentaire agricole.",
        category: "retraite",
        kind: "demande",
        requiredDocuments: ["Relevé de carrière", "Pièce d'identité", "RIB"],
        fields: [
          { name: "dateDepartSouhaitee", label: "Date de départ souhaitée", type: "date", required: true },
          { name: "carriereComplete", label: "Carrière agricole complète", type: "select", options: ["Oui", "Non", "Je ne sais pas"], required: true },
          { name: "precisions", label: "Précisions", type: "textarea" },
        ],
      },
      {
        slug: "declaration-arret-travail",
        title: "Déclarer un arrêt de travail",
        description: "Transmettez votre arrêt de travail pour le calcul de vos indemnités journalières.",
        category: "sante",
        kind: "declaration",
        requiredDocuments: ["Avis d'arrêt de travail", "Attestation de salaire"],
        fields: [
          { name: "dateDebut", label: "Date de début", type: "date", required: true },
          { name: "dateFin", label: "Date de fin prévue", type: "date", required: true },
          { name: "motif", label: "Motif (facultatif)", type: "textarea" },
        ],
      },
      {
        slug: "embauche-salarie-agricole",
        title: "Déclarer l'embauche d'un salarié agricole",
        description: "Effectuez la déclaration préalable à l'embauche d'un salarié agricole.",
        category: "emploi",
        kind: "declaration",
        requiredDocuments: ["Pièce d'identité du salarié", "Contrat de travail"],
        fields: [
          { name: "nomSalarie", label: "Nom du salarié", type: "text", required: true },
          { name: "dateEmbauche", label: "Date d'embauche", type: "date", required: true },
          { name: "typeContrat", label: "Type de contrat", type: "select", options: ["CDI", "CDD", "Saisonnier"], required: true },
        ],
      },
      {
        slug: "demande-attestation",
        title: "Demander une attestation",
        description: "Obtenez une attestation (affiliation, droits, paiement) à usage de vos démarches.",
        category: "cotisations",
        kind: "demande",
        requiredDocuments: [],
        fields: [
          { name: "typeAttestation", label: "Type d'attestation", type: "select", options: ["Attestation d'affiliation", "Attestation de droits", "Attestation de paiement"], required: true },
          { name: "usage", label: "Usage de l'attestation", type: "text" },
        ],
      },
    ])
    .returning();
  void prefillCommon;

  const procBySlug = Object.fromEntries(procRows.map((p) => [p.slug, p]));

  console.log("Création des dossiers de démonstration (cases)…");

  // Case 1 — acceptance flow: envoyée -> piece_manquante avec pièce jointe déjà fournie
  const [case1] = await db
    .insert(cases)
    .values({
      reference: "MSA-2026-100245",
      memberId: jean.id,
      procedureTypeId: procBySlug["declaration-arret-travail"].id,
      officeId: beauce.id,
      assignedCaseworkerId: agentBeauce.id,
      status: "piece_manquante",
      title: "Déclarer un arrêt de travail",
      data: { dateDebut: "2026-01-12", dateFin: "2026-01-26", motif: "Lombalgie aiguë, arrêt prescrit par le médecin traitant." },
      requestedDocuments: ["Attestation de salaire des 3 derniers mois"],
      submittedAt: new Date("2026-01-13T09:12:00Z"),
      createdAt: new Date("2026-01-12T18:03:00Z"),
      updatedAt: new Date("2026-01-15T11:00:00Z"),
    })
    .returning();

  const [doc1] = await db
    .insert(documents)
    .values({
      ownerId: jean.id,
      caseId: case1.id,
      category: "arret_travail",
      filename: "avis-arret-travail-SPECIMEN.txt",
      mimeType: "text/plain",
      sizeBytes: 0,
      content: Buffer.from(specimenCertificate("Avis d'arrêt de travail", jean.fullName, "Du 12/01/2026 au 26/01/2026 — Document fictif à usage de démonstration.")),
      isSpecimen: true,
      uploadedById: jean.id,
    })
    .returning();
  await db.update(documents).set({ sizeBytes: doc1.content.length }).where(eqId(doc1.id));

  await db.insert(caseEvents).values([
    { caseId: case1.id, actorId: jean.id, type: "creation", message: "Brouillon créé à partir de la démarche « Déclarer un arrêt de travail ».", createdAt: new Date("2026-01-12T18:03:00Z") },
    { caseId: case1.id, actorId: jean.id, type: "document_ajoute", message: "Document ajouté : avis-arret-travail-SPECIMEN.txt", createdAt: new Date("2026-01-12T18:05:00Z") },
    { caseId: case1.id, actorId: jean.id, type: "soumission", message: "Dossier envoyé pour instruction.", createdAt: new Date("2026-01-13T09:12:00Z") },
    { caseId: case1.id, actorId: jean.id, type: "affectation", message: "Dossier affecté à un gestionnaire du bureau MSA.", createdAt: new Date("2026-01-13T09:12:05Z") },
    { caseId: case1.id, actorId: agentBeauce.id, type: "changement_statut", message: "Dossier pris en charge, instruction en cours.", createdAt: new Date("2026-01-14T08:30:00Z") },
    {
      caseId: case1.id,
      actorId: agentBeauce.id,
      type: "changement_statut",
      message: "Il manque l'attestation de salaire des 3 derniers mois pour poursuivre l'instruction.",
      createdAt: new Date("2026-01-15T11:00:00Z"),
    },
  ]);

  // Case 2 — en cours, exploitant
  const [case2] = await db
    .insert(cases)
    .values({
      reference: "MSA-2026-100198",
      memberId: marie.id,
      procedureTypeId: procBySlug["declaration-revenus-exploitant"].id,
      officeId: armor.id,
      assignedCaseworkerId: agentArmor.id,
      status: "en_cours",
      title: "Déclarer mes revenus professionnels",
      data: { exercice: "2025", revenuProfessionnel: "28400", commentaire: "Revenu stable par rapport à l'exercice précédent." },
      requestedDocuments: [],
      submittedAt: new Date("2026-01-08T10:00:00Z"),
      createdAt: new Date("2026-01-07T16:00:00Z"),
      updatedAt: new Date("2026-01-09T09:00:00Z"),
    })
    .returning();

  await db.insert(caseEvents).values([
    { caseId: case2.id, actorId: marie.id, type: "creation", message: "Brouillon créé à partir de la démarche « Déclarer mes revenus professionnels ».", createdAt: new Date("2026-01-07T16:00:00Z") },
    { caseId: case2.id, actorId: marie.id, type: "soumission", message: "Dossier envoyé pour instruction.", createdAt: new Date("2026-01-08T10:00:00Z") },
    { caseId: case2.id, actorId: marie.id, type: "affectation", message: "Dossier affecté à un gestionnaire du bureau MSA.", createdAt: new Date("2026-01-08T10:00:05Z") },
    { caseId: case2.id, actorId: agentArmor.id, type: "changement_statut", message: "Dossier en cours d'instruction.", createdAt: new Date("2026-01-09T09:00:00Z") },
  ]);

  // Case 3 — terminée, retraite
  const [case3] = await db
    .insert(cases)
    .values({
      reference: "MSA-2025-099321",
      memberId: paul.id,
      procedureTypeId: procBySlug["demande-attestation"].id,
      officeId: beauce.id,
      assignedCaseworkerId: agentBeauce.id,
      status: "terminee",
      title: "Demander une attestation",
      data: { typeAttestation: "Attestation de paiement", usage: "Dossier bancaire" },
      requestedDocuments: [],
      submittedAt: new Date("2025-12-02T09:00:00Z"),
      createdAt: new Date("2025-12-01T14:00:00Z"),
      updatedAt: new Date("2025-12-05T15:00:00Z"),
    })
    .returning();

  await db.insert(caseEvents).values([
    { caseId: case3.id, actorId: paul.id, type: "creation", message: "Brouillon créé à partir de la démarche « Demander une attestation ».", createdAt: new Date("2025-12-01T14:00:00Z") },
    { caseId: case3.id, actorId: paul.id, type: "soumission", message: "Dossier envoyé pour instruction.", createdAt: new Date("2025-12-02T09:00:00Z") },
    { caseId: case3.id, actorId: agentBeauce.id, type: "changement_statut", message: "Attestation en cours de génération.", createdAt: new Date("2025-12-03T09:00:00Z") },
    { caseId: case3.id, actorId: agentBeauce.id, type: "changement_statut", message: "Attestation disponible dans vos documents.", createdAt: new Date("2025-12-05T15:00:00Z") },
  ]);

  const [doc3] = await db
    .insert(documents)
    .values({
      ownerId: paul.id,
      caseId: case3.id,
      category: "attestation",
      filename: "attestation-paiement-SPECIMEN.txt",
      mimeType: "text/plain",
      sizeBytes: 0,
      content: Buffer.from(specimenCertificate("Attestation de paiement", paul.fullName, "Document fictif délivré à titre de démonstration, sans valeur légale.")),
      isSpecimen: true,
      uploadedById: agentBeauce.id,
    })
    .returning();
  await db.update(documents).set({ sizeBytes: doc3.content.length }).where(eqId(doc3.id));

  // Draft case for Jean (not yet submitted) to illustrate autosave
  await db.insert(cases).values({
    reference: "MSA-2026-100302",
    memberId: jean.id,
    procedureTypeId: procBySlug["demande-prestation-familiale"].id,
    officeId: beauce.id,
    status: "brouillon",
    title: "Demander une prestation familiale",
    data: { typePrestation: "Complément familial", situationFamiliale: "Marié, 2 enfants" },
    requestedDocuments: [],
  });

  await db.insert(caseEvents).values({
    caseId: (await db.select().from(cases).where(eqRef("MSA-2026-100302")).limit(1))[0].id,
    actorId: jean.id,
    type: "creation",
    message: "Brouillon créé à partir de la démarche « Demander une prestation familiale ».",
  });

  console.log("Ajout de documents complémentaires (spécimens)…");
  await db.insert(documents).values([
    {
      ownerId: jean.id,
      category: "affiliation",
      filename: "attestation-affiliation-SPECIMEN.txt",
      mimeType: "text/plain",
      sizeBytes: Buffer.byteLength(specimenCertificate("Attestation d'affiliation", jean.fullName, "Affilié au régime agricole — salarié agricole.")),
      content: Buffer.from(specimenCertificate("Attestation d'affiliation", jean.fullName, "Affilié au régime agricole — salarié agricole.")),
      isSpecimen: true,
      uploadedById: jean.id,
    },
    {
      ownerId: marie.id,
      category: "affiliation",
      filename: "attestation-affiliation-SPECIMEN.txt",
      mimeType: "text/plain",
      sizeBytes: Buffer.byteLength(specimenCertificate("Attestation d'affiliation", marie.fullName, "Affiliée au régime agricole — exploitante.")),
      content: Buffer.from(specimenCertificate("Attestation d'affiliation", marie.fullName, "Affiliée au régime agricole — exploitante.")),
      isSpecimen: true,
      uploadedById: marie.id,
    },
  ]);

  console.log("Création des paiements…");
  await db.insert(payments).values([
    { memberId: jean.id, type: "prestation", label: "Indemnités journalières", amount: "412.60", status: "verse", reference: "VRS-10022301", date: new Date("2026-01-20") },
    { memberId: jean.id, type: "remboursement", label: "Consultation médecin traitant", amount: "18.90", status: "verse", reference: "VRS-10022144", date: new Date("2026-01-05") },
    { memberId: jean.id, type: "cotisation", label: "Cotisation mensuelle", amount: "156.40", status: "preleve", reference: "VRS-10021980", date: new Date("2025-12-28") },
    { memberId: jean.id, type: "remboursement", label: "Frais pharmacie", amount: "9.40", status: "en_attente", reference: "VRS-10022355", date: new Date("2026-01-22") },
    { memberId: marie.id, type: "cotisation", label: "Cotisation exploitant - 4e trimestre", amount: "612.00", status: "verse", reference: "VRS-10021700", date: new Date("2025-12-15") },
    { memberId: marie.id, type: "prestation", label: "Aide au répit agricole", amount: "280.00", status: "verse", reference: "VRS-10021850", date: new Date("2025-12-20") },
    { memberId: marie.id, type: "remboursement", label: "Consultation spécialiste", amount: "35.00", status: "rejete", reference: "VRS-10022010", date: new Date("2026-01-02") },
    { memberId: paul.id, type: "prestation", label: "Pension de retraite agricole", amount: "1120.35", status: "verse", reference: "VRS-10021500", date: new Date("2025-12-09") },
    { memberId: paul.id, type: "prestation", label: "Pension de retraite agricole", amount: "1120.35", status: "verse", reference: "VRS-10022500", date: new Date("2026-01-09") },
    { memberId: paul.id, type: "remboursement", label: "Frais optique", amount: "64.20", status: "verse", reference: "VRS-10021600", date: new Date("2025-12-12") },
  ]);

  console.log("Création des rendez-vous…");
  await db.insert(appointments).values([
    {
      memberId: jean.id,
      officeId: beauce.id,
      caseworkerId: agentBeauce.id,
      caseId: case1.id,
      reason: "Point sur mon arrêt de travail et les indemnités journalières",
      requestedSlot: new Date("2026-02-03T10:00:00Z"),
      status: "confirmee",
    },
    {
      memberId: marie.id,
      officeId: armor.id,
      reason: "Question sur le calcul de mes cotisations",
      requestedSlot: new Date("2026-02-05T14:30:00Z"),
      status: "demandee",
    },
  ]);

  console.log("Ajout de messages et notifications…");
  await db.insert(messages).values([
    {
      senderId: jean.id,
      officeId: beauce.id,
      subject: "Message au bureau MSA",
      body: "Bonjour, je souhaite savoir si mon dossier d'arrêt de travail a bien été reçu. Merci.",
    },
    {
      senderId: agentBeauce.id,
      recipientId: jean.id,
      officeId: beauce.id,
      subject: "Réponse du bureau MSA",
      body: "Bonjour Monsieur Dupont, votre dossier est bien reçu et en cours d'instruction. Une pièce complémentaire vous a été demandée sur votre dossier.",
    },
  ]);

  await db.insert(notifications).values([
    { userId: jean.id, title: "Pièce manquante", body: "Une pièce complémentaire est demandée sur votre dossier MSA-2026-100245.", link: "/espace/demarches/" + case1.id },
    { userId: marie.id, title: "Dossier en cours", body: "Votre dossier MSA-2026-100198 est en cours d'instruction.", link: "/espace/demarches/" + case2.id },
    { userId: agentBeauce.id, title: "Nouveau dossier à instruire", body: "Un nouveau dossier a été envoyé par Jean Dupont.", link: "/back-office/dossiers/" + case1.id },
  ]);

  console.log("Création des articles et guides publics…");
  await db.insert(articles).values([
    {
      slug: "comprendre-vos-remboursements-sante",
      title: "Comprendre vos remboursements santé",
      category: "sante",
      audience: "Salariés et exploitants",
      summary: "Le fonctionnement des remboursements de soins pour les agriculteurs et leurs familles.",
      content:
        "Le régime agricole prend en charge une partie de vos frais de santé (consultations, pharmacie, hospitalisation) selon les mêmes principes que le régime général. Ce guide explique les délais de remboursement, le rôle de la carte vitale fictive de démonstration et les démarches à effectuer en cas de reste à charge important. Dans cette démonstration, aucun remboursement réel n'est effectué : les montants affichés sont fictifs.",
      kind: "article",
    },
    {
      slug: "arret-de-travail-mode-emploi",
      title: "Arrêt de travail : mode d'emploi",
      category: "sante",
      audience: "Salariés agricoles",
      summary: "Les étapes pour déclarer un arrêt de travail et percevoir vos indemnités journalières.",
      content:
        "En cas d'arrêt de travail prescrit par un professionnel de santé, transmettez votre avis d'arrêt et votre attestation de salaire via votre espace personnel. Le gestionnaire instruit votre dossier et peut vous demander des pièces complémentaires. Le versement des indemnités journalières fictives intervient après validation complète du dossier.",
      kind: "guide",
    },
    {
      slug: "allocations-familiales-agricoles",
      title: "Allocations familiales en milieu agricole",
      category: "famille",
      audience: "Familles",
      summary: "Panorama des prestations familiales accessibles aux familles agricoles.",
      content:
        "Les familles affiliées au régime agricole peuvent bénéficier de prestations familiales (allocations familiales, complément familial, aide à la garde d'enfants). Ce guide détaille les conditions de ressources et les pièces à fournir pour une demande.",
      kind: "article",
    },
    {
      slug: "declarer-naissance-ou-mariage",
      title: "Déclarer une naissance, un mariage ou un Pacs",
      category: "famille",
      audience: "Familles",
      summary: "Les démarches à réaliser rapidement après un changement de situation familiale.",
      content:
        "Tout changement de situation familiale doit être signalé afin de mettre à jour vos droits et prestations. Utilisez la démarche guidée « Déclarer un changement de situation familiale » dans votre espace personnel pour transmettre les justificatifs nécessaires.",
      kind: "guide",
    },
    {
      slug: "aide-au-logement-exploitants",
      title: "Aide au logement pour les exploitants et salariés",
      category: "logement",
      audience: "Exploitants et salariés",
      summary: "Conditions d'accès à l'aide personnelle au logement pour les familles agricoles.",
      content:
        "L'aide au logement est calculée selon vos revenus, la composition de votre foyer et le montant de votre loyer ou de vos charges de propriété. Elle peut être demandée directement en ligne grâce à une démarche guidée avec dépôt de justificatifs.",
      kind: "article",
    },
    {
      slug: "logement-de-fonction-agricole",
      title: "Le logement de fonction en exploitation agricole",
      category: "logement",
      audience: "Employeurs et salariés",
      summary: "Ce qu'il faut savoir sur le logement de fonction et son impact sur vos droits.",
      content:
        "Lorsqu'un salarié agricole bénéficie d'un logement de fonction, les modalités de calcul des aides et cotisations diffèrent. Ce guide détaille les justificatifs à transmettre à votre bureau local.",
      kind: "guide",
    },
    {
      slug: "retraite-agricole-les-etapes",
      title: "Retraite agricole : les étapes clés",
      category: "retraite",
      audience: "Futurs retraités",
      summary: "De la demande de relevé de carrière à la liquidation de votre retraite agricole.",
      content:
        "La préparation de votre retraite agricole commence par la vérification de votre relevé de carrière, suivie du dépôt de votre demande de liquidation plusieurs mois avant la date de départ souhaitée. Ce guide détaille le calendrier recommandé et les pièces justificatives.",
      kind: "guide",
    },
    {
      slug: "cumul-emploi-retraite-agricole",
      title: "Cumul emploi-retraite dans le secteur agricole",
      category: "retraite",
      audience: "Retraités",
      summary: "Les règles applicables si vous souhaitez reprendre une activité après votre retraite.",
      content:
        "Le cumul emploi-retraite est possible sous certaines conditions de plafond de revenus. Ce guide présente les règles générales applicables aux retraités agricoles souhaitant reprendre une activité.",
      kind: "article",
    },
    {
      slug: "calcul-des-cotisations-exploitants",
      title: "Calcul des cotisations des exploitants agricoles",
      category: "cotisations",
      audience: "Exploitants",
      summary: "Comprendre le calcul de vos cotisations sociales en fonction de vos revenus professionnels.",
      content:
        "Les cotisations des exploitants agricoles sont calculées sur la base des revenus professionnels déclarés. Ce guide explique les échéances de déclaration et les régularisations possibles en cours d'année.",
      kind: "guide",
    },
    {
      slug: "echeancier-cotisations-employeurs",
      title: "Échéancier des cotisations pour les employeurs",
      category: "cotisations",
      audience: "Employeurs",
      summary: "Le calendrier annuel des cotisations patronales agricoles.",
      content:
        "Les employeurs agricoles doivent respecter un calendrier de déclaration et de paiement des cotisations sociales de leurs salariés. Ce guide récapitule les échéances trimestrielles types.",
      kind: "article",
    },
    {
      slug: "embaucher-un-saisonnier",
      title: "Embaucher un salarié saisonnier",
      category: "emploi",
      audience: "Employeurs",
      summary: "Les formalités à accomplir avant l'embauche d'un travailleur saisonnier agricole.",
      content:
        "Avant toute embauche, l'employeur doit réaliser une déclaration préalable à l'embauche et s'assurer de la conformité du contrat de travail saisonnier. Ce guide détaille les pièces à préparer.",
      kind: "guide",
    },
    {
      slug: "securite-au-travail-agricole",
      title: "Prévention et sécurité au travail agricole",
      category: "emploi",
      audience: "Employeurs et salariés",
      summary: "Les bonnes pratiques de prévention des risques professionnels en exploitation.",
      content:
        "La prévention des risques professionnels agricoles repose sur l'évaluation des risques, la formation des salariés et l'entretien du matériel. Ce guide présente les axes principaux de prévention.",
      kind: "article",
    },
  ]);

  console.log("Création de la carte : production locale et disponibilités…");

  // Points de production / présence déposés par des adhérents (données fictives).
  const points = await db
    .insert(localPoints)
    .values([
      {
        ownerId: marie.id,
        kind: "producteur",
        name: "Ferme des Herbages — Marie Lefèvre",
        description:
          "Légumes de saison, œufs fermiers et pain au levain. Retrait sur place le vendredi après-midi et le samedi matin.",
        city: "Saint-Brieuc",
        lat: "48.5211",
        lng: "-2.7489",
        phone: "06 23 45 67 89",
      },
      {
        ownerId: amelie.id,
        kind: "producteur",
        name: "Les Champs d'Amélie — maraîchage",
        description:
          "Paniers de légumes, fraises de Plougastel et miel de nos ruches. Vente directe à la ferme tous les samedis.",
        city: "Nantes",
        lat: "47.2411",
        lng: "-1.5312",
        phone: "06 56 78 90 12",
      },
      {
        ownerId: jean.id,
        kind: "producteur",
        name: "Les Blés de Jean — céréales & farine",
        description:
          "Farine paysanne moulue à la meule de pierre et huile de colza. Point de dépôt à l'entrée de l'exploitation.",
        city: "Chartres",
        lat: "48.4522",
        lng: "1.5012",
        phone: "06 12 34 56 78",
      },
      {
        ownerId: paul.id,
        kind: "presence",
        name: "Point d'échange du Verger — Paul Martin",
        description:
          "Je rends service aux voisins : dépôt de colis, coup de main au potager et conduite pour les rendez-vous.",
        city: "Chartres",
        lat: "48.4601",
        lng: "1.4721",
        phone: "06 34 56 78 90",
      },
      {
        ownerId: marie.id,
        kind: "presence",
        name: "Accueil à la ferme — Anne-Laure",
        description:
          "Présence régulière sur le marché de Saint-Brieuc le samedi matin, stand de producteurs locaux.",
        city: "Saint-Brieuc",
        lat: "48.5089",
        lng: "-2.7601",
        phone: "06 23 45 67 89",
      },
    ])
    .returning();

  const [ptMarie, ptAmelie, ptJean, ptPaul, ptAnne] = points;

  await db.insert(localProducts).values([
    {
      pointId: ptMarie.id,
      name: "Panier de légumes de saison",
      description: "7 à 9 légumes bio de la ferme, environ 6 kg.",
      category: "Légumes",
      price: "18.00",
      unit: "le panier",
      stock: 12,
    },
    {
      pointId: ptMarie.id,
      name: "Œufs fermiers (x6)",
      description: "Pondus le matin, poules élevées en plein air.",
      category: "Œufs",
      price: "3.20",
      unit: "la boîte de 6",
      stock: 30,
    },
    {
      pointId: ptMarie.id,
      name: "Pain au levain",
      description: "Cuit au four à bois, 1,2 kg.",
      category: "Boulangerie",
      price: "5.50",
      unit: "la miche",
      stock: 8,
    },
    {
      pointId: ptAmelie.id,
      name: "Fraises de Plougastel (500 g)",
      description: "Variété Gariguettes, cueillies le matin.",
      category: "Fruits",
      price: "6.00",
      unit: "la barquette",
      stock: 20,
    },
    {
      pointId: ptAmelie.id,
      name: "Miel de printemps (500 g)",
      description: "Récolte de mai, miel toutes fleurs.",
      category: "Épicerie",
      price: "9.50",
      unit: "le pot",
      stock: 15,
    },
    {
      pointId: ptAmelie.id,
      name: "Panier solidaire découverte",
      description: "Légumes et fruits de la semaine, prix adapté.",
      category: "Légumes",
      price: "12.00",
      unit: "le panier",
      stock: 10,
    },
    {
      pointId: ptJean.id,
      name: "Farine T65 (2 kg)",
      description: "Blé fermier moulu à la meule de pierre.",
      category: "Épicerie",
      price: "4.80",
      unit: "le sachet",
      stock: 25,
    },
    {
      pointId: ptJean.id,
      name: "Huile de colza (75 cl)",
      description: "Pressée à la ferme, bouteille consignée.",
      category: "Épicerie",
      price: "8.00",
      unit: "la bouteille",
      stock: 18,
    },
  ]).returning();

  const products = await db
    .select({ id: localProducts.id, name: localProducts.name, pointId: localProducts.pointId })
    .from(localProducts);
  const productByName = new Map(products.map((p) => [p.name, p]));

  await db.insert(localOrders).values([
    {
      reference: "LOC-DEMO-2026-0001",
      productId: productByName.get("Panier de légumes de saison")!.id,
      pointId: ptMarie.id,
      buyerId: jean.id,
      quantity: 2,
      status: "commandee",
      pickupAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      note: "Retrait samedi matin si possible.",
    },
    {
      reference: "LOC-DEMO-2026-0002",
      productId: productByName.get("Fraises de Plougastel (500 g)")!.id,
      pointId: ptAmelie.id,
      buyerId: paul.id,
      quantity: 3,
      status: "prete",
      pickupAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      note: "",
    },
    {
      reference: "LOC-DEMO-2026-0003",
      productId: productByName.get("Farine T65 (2 kg)")!.id,
      pointId: ptJean.id,
      buyerId: marie.id,
      quantity: 1,
      status: "recuperee",
      pickupAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      note: "Déposé au point de retrait.",
    },
  ]);

  // Jeunes qui se rendent disponibles pour des missions de proximité.
  await db.insert(workerAvailabilities).values([
    {
      userId: lucas.id,
      city: "Chartres",
      lat: "48.4474",
      lng: "1.4877",
      skills: ["Livraison de proximité", "Aide aux champs", "Coup de main au marché"],
      availabilityNote: "Disponible les mercredis, samedis et pendant les vacances scolaires.",
      status: "disponible",
    },
    {
      userId: marie.id,
      city: "Saint-Brieuc",
      lat: "48.5142",
      lng: "-2.7692",
      skills: ["Tenue de stand", "Préparation de paniers"],
      availabilityNote: "Samedis matin, sur le marché.",
      status: "disponible",
    },
    {
      userId: amelie.id,
      city: "Nantes",
      lat: "47.2389",
      lng: "-1.5342",
      skills: ["Livraison à vélo", "Accueil à la ferme"],
      availabilityNote: "Jeudis et vendredis en fin de journée.",
      status: "indisponible",
    },
  ]);

  console.log("Ajout d'annonces fictives Le Monde Aime…");
  const [demoCoat, demoTables, demoBasket, demoShoes] = await db.insert(communityListings).values([
    {
      ownerId: marie.id,
      action: "don",
      category: "besoins_essentiels",
      title: "Exemple · Manteau d'hiver taille M",
      description: "Manteau chaud en bon état, lavé et prêt à être remis en main propre. Exemple fictif pour tester une demande de don.",
      condition: "bon_etat",
      quantity: 2,
      unit: "manteau",
      attributes: { size: "M" },
      city: "Chartres",
      lat: "48.45",
      lng: "1.49",
      pickupDetails: "Retrait à convenir dans le centre de Chartres (exemple).",
      isDemo: true,
    },
    {
      ownerId: marie.id,
      action: "loue",
      category: "evenementiel",
      title: "Exemple · Tables pliantes pour un événement",
      description: "Trois tables pliantes, location de démonstration. Dates, caution et état à convenir avec le propriétaire.",
      condition: "bon_etat",
      quantity: 3,
      unit: "table",
      price: "15.00",
      deposit: "30.00",
      attributes: { eventDetails: "3 tables · démonstration" },
      city: "Chartres",
      lat: "48.45",
      lng: "1.49",
      availableFrom: new Date(Date.now() + 24 * 60 * 60 * 1000),
      availableUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      pickupDetails: "Retrait sur place, créneau à convenir.",
      isDemo: true,
    },
    {
      ownerId: amelie.id,
      action: "vends",
      category: "produits_locaux",
      title: "Exemple · Panier de légumes de saison",
      description: "Panier de légumes cultivés à proximité. Offre fictive, retrait direct à la ferme.",
      condition: "neuf",
      quantity: 8,
      unit: "panier",
      price: "12.00",
      attributes: { unit: "panier" },
      city: "Nantes",
      lat: "47.24",
      lng: "-1.53",
      availableFrom: new Date(Date.now() + 24 * 60 * 60 * 1000),
      pickupDetails: "Retrait à la ferme, sur rendez-vous convenu dans l'échange.",
      isDemo: true,
    },
    {
      ownerId: paul.id,
      action: "don",
      category: "besoins_essentiels",
      title: "Exemple · Chaussures de marche pointure 38",
      description: "Chaussures propres en bon état, disponibles en don fictif.",
      condition: "bon_etat",
      quantity: 1,
      unit: "paire",
      attributes: { size: "38" },
      city: "Chartres",
      lat: "48.46",
      lng: "1.47",
      pickupDetails: "Remise directe à convenir.",
      isDemo: true,
    },
  ]).returning();

  const [demoEvent] = await db.insert(communityEventPlans).values({
    ownerId: jean.id,
    title: "Exemple fictif · Repas associatif",
    eventDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    city: "Chartres",
    lat: "48.45",
    lng: "1.49",
    participants: 30,
    needs: [
      { text: "tables pliantes", quantity: 3, category: "evenementiel" },
      { text: "verres", quantity: 30, category: "evenementiel" },
      { text: "enceinte", quantity: 1, category: "evenementiel" },
    ],
  }).returning();

  const [demoReservation] = await db.insert(communityRequests).values({
    reference: "LMA-DEMO-0001",
    listingId: demoCoat.id,
    requesterId: jean.id,
    quantity: 1,
    message: "Bonjour, cette annonce est fictive. Puis-je passer samedi après-midi ?",
    eventPlanId: demoEvent.id,
    status: "demandee",
  }).returning();
  await db.insert(communityMessages).values({
    requestId: demoReservation.id,
    senderId: jean.id,
    body: "Exemple de conversation privée. Le propriétaire doit encore répondre à cette demande.",
  });

  await db.insert(communityRequests).values({
    reference: "LMA-DEMO-0002",
    listingId: demoShoes.id,
    requesterId: lucas.id,
    quantity: 1,
    message: "Exemple fictif : je confirme la réception de cette paire.",
    status: "terminee",
    ownerConfirmedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    requesterConfirmedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  });

  const [demoTrip] = await db.insert(communityTrips).values({
    ownerId: lucas.id,
    startCity: "Chartres",
    endCity: "Saint-Brieuc",
    startLat: "48.45",
    startLng: "1.49",
    endLat: "48.51",
    endLng: "-2.77",
    departureAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    transportMode: "vélo",
    capacity: 1,
    availableCapacity: 1,
    terms: "Exemple fictif : panier de petite taille, trajet à confirmer avec le transporteur.",
    compensation: "0.00",
  }).returning();
  await db.insert(communityTransportRequests).values({
    tripId: demoTrip.id,
    requesterId: jean.id,
    description: "Exemple fictif : un petit panier de légumes.",
    status: "demandee",
  });

  console.log("Journal d'audit initial…");
  await db.insert(auditLogs).values([
    { actorId: admin.id, action: "initialisation_demo", entityType: "system", metadata: { info: "Jeu de données de démonstration initialisé." } },
  ]);

  console.log("Terminé. Comptes de démonstration (mot de passe : Demo1234!) :");
  console.log("  Administrateur : admin@aime-demo.fr");
  console.log("  Gestionnaire Beauce : agent.beauce@aime-demo.fr");
  console.log("  Gestionnaire Armor : agent.armor@aime-demo.fr");
  console.log("  Membre : jean.dupont@exemple.fr");
  console.log("  Membre : marie.lefevre@exemple.fr");
  console.log("  Membre : paul.martin@exemple.fr");
  console.log("  Visite guidée (lecture seule, sans mot de passe) : demo@aime-demo.fr");

}

function specimenCertificate(title: string, name: string, detail: string) {
  return `============================================
            SPÉCIMEN — DOCUMENT FICTIF
============================================

${title}

Délivré à : ${name}
Date d'édition : ${new Date().toLocaleDateString("fr-FR")}

${detail}

--------------------------------------------
Ce document est un exemple généré dans le cadre
d'une démonstration indépendante. Il n'a aucune
valeur légale et n'est pas émis par la MSA.
============================================
`;
}

function eqId(id: number) {
  return eq(documents.id, id);
}

function eqRef(reference: string) {
  return eq(cases.reference, reference);
}
