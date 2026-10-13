import bcrypt from "bcryptjs";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { and, eq, inArray, isNull, like, sql } from "drizzle-orm";
import {
  offices,
  organisms,
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
  weddingSettings,
  weddingGuests,
  weddingTables,
  weddingBudgetItems,
  type FormFieldDef,
} from "./schema";
import { defaultUniverses } from "../lib/lma";
import { ORGANISMS_SEED, RULES_VERSION, SITUATION_BY_KEY, computeDueAt } from "../lib/situations";

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
    procedure_types, articles, organisms, users, offices
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
    birthDate: "1985-05-14",
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
      {
        slug: "difficultes-paiement",
        title: "Difficultés de paiement : être accompagné pour s'en sortir",
        description: "Factures, loyer, crédits, impôts : votre bureau reprend votre parcours, vos étapes et vos pièces, et vous aide à contacter les bons interlocuteurs. Aucune aide ni décision n'est prise par l'application : chaque organisme décide pour ce qui le concerne.",
        category: "parcours",
        kind: "parcours",
        requiredDocuments: ["Dernier avis d'imposition", "Justificatifs de revenus des trois derniers mois", "Factures, échéances et relances concernées"],
        fields: [
          { name: "nature", label: "Ce qui devient difficile à payer", type: "select", options: ["Loyer ou logement", "Factures (énergie, eau, téléphone)", "Courses et quotidien", "Crédit ou dettes", "Impôts et charges", "Plusieurs à la fois", "Autre"], required: true },
          { name: "depuis", label: "Depuis quand ?", type: "select", options: ["Moins d'un mois", "Quelques mois", "Plus de six mois"] },
          { name: "relances", label: "Relances ou procédure en cours", type: "select", options: ["Non", "Oui, sans procédure", "Oui, une procédure est engagée"] },
          { name: "attente", label: "Ce que vous attendez de votre bureau", type: "textarea" },
        ],
      },
      {
        // Procédure d'accueil des parcours transmis (chantier 2, temps 2) :
        // quand un membre transmet son parcours guidé à son bureau, il
        // « devient » un dossier de ce type (sauf correspondance nommée).
        slug: "parcours-transmis",
        title: "Dossier transmis depuis un parcours guidé",
        description: "Votre parcours, vos étapes et vos pièces, repris par votre bureau d'accompagnement qui vous répond dans le dossier.",
        category: "parcours",
        kind: "parcours",
        requiredDocuments: [],
        fields: [
          { name: "resume", label: "Votre situation, avec vos mots", type: "textarea" },
          { name: "attente", label: "Ce que vous attendez de votre bureau", type: "textarea" },
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

  console.log("Création du fonds mariage : 12 guides et articles publics…");
  await db.insert(articles).values([
    {
      slug: "se-marier-par-ou-commencer",
      title: "Se marier : par où commencer ?",
      category: "mariage",
      audience: "Futurs mariés",
      summary: "La date, la mairie, le lieu : les trois premières décisions qui structurent tout le reste.",
      content: "Tout commence par une date. C'est elle qui commande le dossier de mairie, la publication des bans, la disponibilité des lieux et des prestataires — presque tout le reste en découle.\n\nDeuxième pas : un premier rendez-vous à la mairie du lieu de cérémonie, simplement pour connaître ses modalités de dépôt du dossier et ses délais. Chaque mairie organise ce rendez-vous à sa façon ; le prendre tôt évite la seule vraie mauvaise surprise d'un mariage, un dossier incomplet qui décale la date.\n\nTroisième pas : décider où aura lieu la fête, car aucun prestataire ne donne de devis ferme sans le lieu et sa capacité.\n\nDans votre espace AIME®, le parcours « Nous nous marions » enchaîne ces étapes dans le bon ordre et calcule votre rétroplanning à rebours depuis la date choisie.",
      kind: "guide",
    },
    {
      slug: "dossier-mariage-mairie",
      title: "Le dossier de mariage en mairie, pièces et délais",
      category: "mariage",
      audience: "Futurs mariés",
      summary: "Actes de naissance, témoins, dépôt du dossier et publication des bans : le seul volet vraiment officiel du mariage.",
      content: "Le dossier de mariage se dépose à la mairie du domicile ou de la résidence de l'un des futurs époux. Il comprend en principe : un acte de naissance récent de chacun (en principe daté de moins de 3 mois au dépôt), une pièce d'identité, un justificatif de domicile, et les informations complètes des témoins — état civil, profession, domicile — avec copies de leurs pièces d'identité. Deux témoins majeurs au minimum sont présents le jour de la cérémonie, quatre au maximum.\n\nSi vous signez un contrat de mariage, le certificat du notaire se joint au dossier, avant la cérémonie.\n\nLe seul délai légal à connaître par cœur : la publication des bans. Les bans sont affichés aux portes des mairies concernées pendant 10 jours, et la cérémonie ne peut pas avoir lieu avant la fin de ce délai (source : service-public.fr). Tout le reste — dates de dépôt, rendez-vous — dépend de votre mairie : demandez-lui tôt.\n\nLe parcours « Nous nous marions » prépare ces pièces une à une et pose l'échéance des bans à 10 jours avant votre date, ni avant, ni après.",
      kind: "guide",
    },
    {
      slug: "retroplanning-mariage",
      title: "Le rétroplanning d'un mariage, un an avant le jour J",
      category: "mariage",
      audience: "Futurs mariés",
      summary: "Lieu à un an, prestataires à six mois, convives figés à trois semaines : des repères, pas des lois.",
      content: "Un mariage se prépare à rebours. Voici les repères que les professionnels et les mairies voient revenir chaque année — ce sont des repères de préparation, pas des délais officiels.\n\nÀ environ un an : le lieu de réception, qui conditionne tout. À six-neuf mois : le photographe, le traiteur, les musiciens — les plus demandés partent les premiers. À quatre-six mois : la robe et les costumes, les alliances. À deux mois : les faire-part, avec une date limite de réponse écrite noir sur blanc. À trois semaines : le nombre de convives est figé, il part au traiteur. Dernière semaine : le plan de table et le déroulé du jour J, écrits et partagés.\n\nLe seul délai qui ne soit pas un repère est officiel : les bans, affichés 10 jours avant la cérémonie (service-public.fr).\n\nLe rétroplanning AIME® calcule chacun de ces jalons depuis votre date et vous les rappelle au bon moment — jamais comme des obligations, toujours comme des aides.",
      kind: "guide",
    },
    {
      slug: "contrat-de-mariage-notaire",
      title: "Contrat de mariage : faut-il passer chez le notaire ?",
      category: "mariage",
      audience: "Futurs mariés",
      summary: "Régime légal ou contrat : ce que change le choix, et pourquoi il se fait avant la cérémonie.",
      content: "Sans contrat, c'est le régime légal qui s'applique — la communauté réduite aux acquêts : ce qui est acquis pendant le mariage est commun, ce qui était à chacun avant (ou reçu par succession et donation) reste personnel.\n\nUn contrat de mariage, signé chez le notaire avant la cérémonie, permet de choisir un autre régime, par exemple la séparation de biens — souvent envisagée quand l'un des époux exerce une activité indépendante ou exploite une entreprise ou une ferme. Le certificat délivré par le notaire se joint alors au dossier de mairie.\n\nAprès la cérémonie, changer de régime est une procédure toute différente, plus lourde. La question se tranche donc avant.\n\nQuel régime convient à votre situation ? C'est une question de patrimoine, d'activité et de famille : seul un notaire peut vous conseiller utilement. Le parcours « Nous nous marions » se contente de poser la question au bon moment et de prévoir le certificat dans vos pièces.",
      kind: "article",
    },
    {
      slug: "choisir-lieu-reception",
      title: "Choisir et réserver le lieu de réception",
      category: "mariage",
      audience: "Futurs mariés",
      summary: "Salle communale, lieu privé ou jardin familial : ce qui se confirme par écrit avant de signer.",
      content: "Le lieu est le premier verrou du mariage : sa capacité donne le nombre d'invités possible, ses règles donnent l'heure de fin de soirée.\n\nSalle communale ou des fêtes : elle se réserve en mairie, avec une convention de location qui fixe tarif, caution, horaires, état des lieux et règles (musique, fin de soirée). Lieu privé : confirmez par écrit les horaires d'installation, l'accès la veille, la caution et ce qui est compris (tables, cuisine, couchage). À domicile ou dans un jardin : toute la logistique repose sur vous — chapiteau, électricité, sanitaires, stationnement, et un mot aux voisins.\n\nDans tous les cas, deux vérifications évitent les soirées écourtées : votre assurance, et les autorisations du lieu (bruit en extérieur, fin de soirée ; un feu d'artifice relève d'une déclaration en mairie).\n\nLes lieux partent 9 à 12 mois à l'avance : c'est un repère, mais il est têtu.",
      kind: "article",
    },
    {
      slug: "budget-mariage-sans-derapage",
      title: "Un budget de mariage qui ne dérape pas",
      category: "mariage",
      audience: "Futurs mariés",
      summary: "Estimé, devis confirmé, déjà réglé : les trois chiffres qui évitent les mauvaises surprises.",
      content: "Un budget de mariage dérape rarement d'un coup. Il dérape poste par poste : le traiteur calculé pour 100 convives qui en reçoit 120, l'option « au cas où », le devis signé sans relire ce qui est compris.\n\nLa méthode qui tient : une enveloppe globale notée dès le départ, puis chaque poste suivi en trois chiffres — le montant estimé, le montant du devis confirmé, et ce qui est déjà réglé. L'écart entre l'estimé total et l'enveloppe se voit des mois à l'avance, quand il est encore temps d'arbitrer calmement : réduire un poste, pas découvrir la facture.\n\nDans le projet de votre mariage sur AIME®, le suivi de budget tient ces trois chiffres poste par poste. AIME® ne perçoit ni ne verse aucun paiement : c'est un carnet de bord, pas un portefeuille.",
      kind: "guide",
    },
    {
      slug: "invites-faire-part-reponses",
      title: "Invités, faire-part et réponses : tenir le bon nombre",
      category: "mariage",
      audience: "Futurs mariés",
      summary: "La liste par foyers, une date limite écrite, et le nombre qui part au traiteur trois semaines avant.",
      content: "Le nombre de convives décide de tout : la salle, le repas, le budget final. Il se construit tôt — foyer par foyer, avec le nombre de personnes — et il vit jusqu'au bout.\n\nSur le faire-part, envoyez environ deux mois avant (repère), écrivez la date limite de réponse. Puis notez les réponses au fur et à mesure : confirmé, peut-être, sans réponse, décliné. Les relances sont les vôtres — un message court, envoyé par vos canaux, vaut mieux qu'un tableur silencieux.\n\nTrois semaines avant le mariage (repère), le nombre se fige : c'est celui qui part au traiteur ou au restaurant et qui sert au plan de table. C'est pour cela que le compteur qui compte n'est pas l'estimation du début, mais les confirmés du jour.\n\nAu-delà d'une cinquantaine d'invités, préparez aussi leurs questions : hébergements, trajets, covoiturage. Une page claire évite cinquante fois la même réponse.",
      kind: "guide",
    },
    {
      slug: "engager-musiciens-dj-mariage",
      title: "Engager des musiciens ou un DJ pour son mariage",
      category: "mariage",
      audience: "Futurs mariés",
      summary: "Demande écrite, proposition, acceptation — et le cadre d'emploi à vérifier avant de signer.",
      content: "La musique fait la soirée, et les bons groupes se réservent tôt. La méthode sûre tient en une phrase : rien n'est réservé tant qu'une proposition écrite n'a pas été acceptée par les deux parties.\n\nLe cadre, ensuite, se vérifie avant de signer. Pour le spectacle vivant, l'artiste rémunéré est présumé salarié (article L7121-3 du Code du travail) : un particulier qui emploie directement un artiste passe en principe par le Guso, le guichet unique du spectacle occasionnel (guso.fr). Un professionnel qui facture avec son entreprise ne relève pas du même cadre. Une facture ou un numéro de Siret ne suffit pas toujours à établir la situation : demandez le cadre par écrit, ainsi que le matériel fourni et l'heure de fin.\n\nDepuis le suivi de votre parcours AIME®, vous pouvez envoyer une demande aux artistes de la carte : proposition écrite, acceptation explicite, puis les étapes se suivent sans qu'aucune ne soit sautée.",
      kind: "guide",
    },
    {
      slug: "photographe-mariage",
      title: "Photographe de mariage : bien choisir, ou bien préparer un proche",
      category: "mariage",
      audience: "Futurs mariés",
      summary: "Style, horaires et photos de groupe : ce qui se décide des mois avant, pas le matin même.",
      content: "Les photographes de mariage les plus demandés sont réservés 6 à 9 mois à l'avance — c'est un repère, mais il se vérifie chaque printemps. Au moment de signer le devis, précisez les horaires de présence, le style (reportage, posé, les deux), le délai de livraison des images et ce qui est inclus.\n\nLe point que tous les mariés regrettent quand il manque : les photos de groupe. Écrivez la liste des groupes à l'avance — familles, témoins, amis — et désignez un proche qui rassemblera les gens au bon moment. Le jour J, personne n'y pense spontanément, et dix minutes de flottement coûtent les plus belles lumières.\n\nSi un proche talentueux tient l'appareil, préparez-le comme un professionnel : la même liste de groupes, un essai du lieu et de sa lumière, et un second appareil ou téléphone chargé en secours.",
      kind: "article",
    },
    {
      slug: "plan-de-table-mode-emploi",
      title: "Le plan de table, quand les convives sont figés",
      category: "mariage",
      audience: "Futurs mariés",
      summary: "Ni trop tôt, ni la veille : le placement se fait sur les confirmés, et se partage avec ceux qui accueilleront.",
      content: "Le plan de table se dresse après le nombre figé, dans la dernière semaine : avant, il bouge à chaque réponse ; après, il devient une course.\n\nPlacez par foyers d'abord, puis par affinités : les familles qui se connaissent, les célibataires entourés plutôt qu'isolés, les anciens camarades ensemble. La capacité de chaque table est un repère de confort, pas une règle absolue — mieux vaut une table de dix joyeuse qu'une table de huit tendue.\n\nUne fois dressé, partagez-le avec les témoins et les proches qui accueilleront vos invités : le matin du mariage, ce sont eux qui guideront chacun à sa place. Imprimé et posé à l'entrée de la salle, il évite le seul vrai moment de flottement d'un dîner de mariage.\n\nDans votre projet AIME®, le plan de table place les foyers confirmés, table par table, et signale ceux qui restent à placer.",
      kind: "guide",
    },
    {
      slug: "jour-j-deroule",
      title: "Le jour J : le déroulé qui évite de coordonner sa propre fête",
      category: "mariage",
      audience: "Futurs mariés",
      summary: "Horaires, qui fait quoi, numéros utiles : une page écrite avant, pour ne plus y penser le jour même.",
      content: "Le jour du mariage, les mariés ne devraient coordonner personne. Ce qui coordonne à leur place tient sur une page : le déroulé.\n\nÉcrivez les horaires et l'enchaînement — cérémonie, vin d'honneur, photos, dîner, ouverture du bal — avec, pour chaque moment, qui s'en occupe : le témoin qui a les alliances, la cousine qui lance la playlist, le traiteur qui attend le signal du dessert. Ajoutez les numéros utiles : lieu, prestataires, témoins.\n\nConfiez la page à un proche « chef d'orchestre » et imprimez-la en plusieurs exemplaires. Le papier ne tombe jamais en panne de batterie, et il se prête sans déverrouiller un téléphone.\n\nLa page du jour J de votre projet AIME® rassemble exactement cela : déroulé, plan de table, prestataires engagés et notes des invités, prêts à imprimer.",
      kind: "article",
    },
    {
      slug: "apres-le-mariage",
      title: "Après le mariage : remerciements et démarches",
      category: "mariage",
      audience: "Futurs mariés",
      summary: "Les mots qui comptent dans les semaines qui suivent, puis l'administratif qui prend le relais.",
      content: "D'abord, les remerciements. Un mot parti dans les semaines qui suivent se remarque ; un an après, il s'excuse. Repartez de la liste des foyers qui avaient confirmé, et cochez au fil de vos envois — cartes, messages, appels. Un mot particulier pour les proches qui ont aidé : ils ont donné du temps, et cela se dit.\n\nEnsuite, rangez ce qui servira partout : le livret de famille, remis par la mairie le jour du mariage, et l'acte de mariage. Photographiez-les dès le retour.\n\nCôté démarches, le mariage change votre situation auprès de presque tous les organismes : nom d'usage si vous le choisissez, impôts, prestations. Le parcours « Ma famille change » prend le relais dans votre espace, sans tout ressaisir.\n\nEt le projet du mariage reste là, avec ses photos à venir et ses souvenirs : il se referme quand vous le décidez.",
      kind: "guide",
    },
  ]);

  console.log("Création du fonds difficultés de paiement : 4 guides et articles publics…");
  await db.insert(articles).values([
    {
      slug: "ne-plus-arriver-a-payer-par-ou-commencer",
      title: "Je n'arrive plus à payer : par où commencer ?",
      category: "argent",
      audience: "Foyers en difficulté",
      summary: "Faire le point, protéger l'essentiel, contacter avant que ça s'aggrave : l'ordre des premiers gestes.",
      content: "Une perte d'emploi, une séparation, une maladie, ou simplement des fins de mois qui se resserrent depuis trop longtemps : les difficultés de paiement arrivent à des foyers qui n'ont rien fait de travers. Ce qui les aggrave presque toujours, c'est d'attendre.\n\nPremier geste : faire le point, sur une page. Ce qui rentre chaque mois, ce qui doit sortir, ce qui est déjà en retard. Sans vous juger — ce document servira partout : bailleur, fournisseur, CCAS, banque.\n\nDeuxième geste : trier par urgence. Le logement et l'énergie d'abord, parce que ce sont eux qui protègent tout le reste. Les impôts et les crédits ensuite, le reste après.\n\nTroisième geste : contacter avant que ça s'aggrave, et par écrit quand c'est possible. Un échéancier demandé tôt coûte presque toujours moins cher qu'un silence suivi de frais. Et répondez aux relances, même simplement pour demander un délai : beaucoup de procédures naissent d'une absence de réponse.\n\nQuatrième geste : vérifier les droits que vous ne réclamez peut-être pas. Le simulateur officiel « Mes droits sociaux » donne une estimation des aides de votre foyer — une estimation, pas une décision : chaque organisme instruit ensuite.\n\nVous n'avez pas à faire tout cela seul : le CCAS de votre commune, les France Services et les points-justice conseillent gratuitement. Dans votre espace AIME®, le parcours « Je n'arrive pas à payer » met ces gestes dans l'ordre, selon ce qui vous pèse le plus, sans promettre ni montant ni décision.",
      kind: "guide",
    },
    {
      slug: "loyer-en-retard-parler-au-bailleur",
      title: "Loyer en retard : parler à son bailleur avant que ça s'aggrave",
      category: "argent",
      audience: "Foyers en difficulté",
      summary: "Un bailleur prévenu tôt a plus de marge qu'un bailleur qui découvre trois impayés.",
      content: "Le premier loyer en retard est le moment où tout se joue. Un bailleur prévenu dès ce moment-là peut proposer un échéancier ; un bailleur qui découvre trois impayés n'a souvent plus que la voie des relances.\n\nExpliquez la situation simplement, avec vos chiffres : ce qui rentre, ce qui est en retard, ce que vous proposez. Demandez l'échéancier par écrit, et ne promettez que ce que vous pourrez tenir — un échéancier réaliste respecté vaut mieux qu'un engagement rapide qui casse au deuxième mois.\n\nEn parallèle, si vos revenus ont baissé, si vous avez perdu un emploi ou si votre foyer a changé, signalez-le à la CAF : votre aide au logement peut être réexaminée. La décision lui appartient ; le signalement, lui, ne doit pas attendre — et il évite les trop-perçus à rembourser.\n\nPour un conseil gratuit et neutre, l'ADIL de votre département informe sur les rapports locatifs et les démarches amiables, sans prendre parti. Si vous êtes salarié, regardez aussi du côté d'Action Logement : des aides liées au logement existent selon les situations, leurs conditions se vérifient auprès d'eux.\n\nEt si un document d'un commissaire de justice (huissier) arrive, gardez-le, notez ses dates et ne le laissez pas sans réponse : sur une procédure, les délais pour réagir sont courts. Un point-justice vous aide gratuitement à le comprendre.\n\nDans votre espace AIME®, le parcours « Je n'arrive pas à payer » prépare ces étapes dans l'ordre quand le loyer est ce qui pèse le plus.",
      kind: "guide",
    },
    {
      slug: "surendettement-explique-simplement",
      title: "Le surendettement, expliqué simplement",
      category: "argent",
      audience: "Foyers en difficulté",
      summary: "Quand rembourser est devenu impossible, une voie existe — gratuite, et pensée pour protéger.",
      content: "On parle de surendettement quand les dettes — crédits, factures, loyers, découverts — dépassent durablement ce qu'un foyer peut rembourser, même en serrant toutes les dépenses. Ce n'est ni une faute ni une honte : c'est une situation prévue, avec une procédure faite pour elle.\n\nCette procédure passe par la commission de surendettement, dont le secrétariat est assuré par la Banque de France. Le dépôt d'un dossier est gratuit. C'est un point à retenir fermement : si une société vous propose de monter votre dossier contre paiement, passez votre chemin — la démarche elle-même ne coûte rien, et des aides gratuites existent pour la préparer.\n\nQue peut-il en sortir ? La commission étudie votre situation complète — revenus, charges, dettes — et cherche une solution adaptée : rééchelonnement, mesures négociées, ou d'autres dispositions selon les cas. Rien n'est automatique et rien n'est promis d'avance : c'est précisément pour cela que le dossier doit être complet et sincère.\n\nDeux réflexes à garder en tête. D'abord, ne souscrivez pas un nouveau crédit pour rembourser les anciens : c'est le réflexe le plus coûteux, il transforme une difficulté passagère en dette durable. Ensuite, ne restez pas seul face aux formulaires : un point-justice ou le CCAS de votre commune vous aide gratuitement à vérifier si cette voie est la vôtre et à rassembler les pièces.\n\nLa première pièce à préparer, c'est la liste complète de vos crédits et dettes, avec montants et dates. Dans votre espace AIME®, le parcours « Je n'arrive pas à payer » vous aide à la constituer avant d'en parler à un interlocuteur.",
      kind: "article",
    },
    {
      slug: "demander-un-delai-impots-factures",
      title: "Impôts, factures : demander un délai avant que les frais ne s'ajoutent",
      category: "argent",
      audience: "Foyers en difficulté",
      summary: "Un délai demandé tôt coûte presque toujours moins cher qu'un silence suivi de majorations.",
      content: "Un impôt ou une facture qu'on sait ne pas pouvoir payer à la date prévue se traite presque toujours mieux avant l'échéance qu'après. Le principe est le même partout : signaler tôt, proposer un rythme réaliste, garder une trace écrite.\n\nPour les impôts, la demande de délai de paiement ou d'échéancier se fait depuis votre espace en ligne sur impots.gouv.fr ou auprès de votre centre des finances publiques. Expliquez la difficulté, proposez un rythme que vous pourrez tenir. Pour les situations les plus tendues, des remises gracieuses existent ; dans tous les cas, la décision appartient à l'administration — mais un impôt signalé se traite, un impôt ignoré se majore. Si vos revenus ont baissé, vérifiez aussi que vos prélèvements mensuels correspondent encore à votre situation.\n\nPour les factures — énergie, eau, téléphone, assurances —, appelez le fournisseur avant la coupure, la réduction ou les frais : la plupart peuvent proposer un échéancier quand on les joint à temps. Pour l'énergie, vérifiez que votre chèque énergie, si vous le recevez, a bien été pris en compte.\n\nSi la facture reste impossible, le CCAS de votre commune peut instruire des aides ponctuelles et, selon les départements, des aides pour les factures d'énergie ou d'eau. Et répondez toujours aux relances, même par un simple courrier demandant un délai : le silence est ce qui transforme une facture en procédure.\n\nDans votre espace AIME®, le parcours « Je n'arrive pas à payer » prépare ces demandes dans l'ordre, avec les pièces qui serviront partout.",
      kind: "guide",
    },
  ]);

  console.log("Création du fonds famille : 5 guides et articles publics…");
  await db.insert(articles).values([
    {
      slug: "naissance-premieres-demarches",
      title: "Une naissance : les démarches des premiers jours",
      category: "famille",
      audience: "Futurs et jeunes parents",
      summary: "Déclaration en mairie sous 5 jours, livret de famille, caisse, carte Vitale : l'ordre simple des premières démarches.",
      content: "Un enfant arrive, et avec lui quelques démarches — moins nombreuses qu'on le craint, à condition de les prendre dans l'ordre.\n\nLa première est la seule vraiment datée : la déclaration de naissance, à la mairie du lieu de naissance, dans les 5 jours qui suivent la naissance (source : service-public.fr). En pratique, la maternité s'en charge souvent ou vous guide ; elle se fait avec le certificat d'accouchement. C'est elle qui établit l'état civil de votre enfant.\n\nDemandez dans la foulée des copies de l'acte de naissance et faites établir ou mettre à jour le livret de famille : presque tous les organismes vous les demanderont.\n\nEnsuite, déclarez la naissance à votre caisse — la CAF, ou la MSA si vous relevez du régime agricole. La composition du foyer conditionne vos prestations ; ne pas déclarer retarde les aides et peut créer des trop-perçus. S'il s'agit d'un premier enfant, certaines aides liées à l'arrivée d'un enfant existent (prime, prestation d'accueil) : le simulateur officiel « Mes droits sociaux » donne une estimation, votre caisse vérifie ensuite les conditions — c'est elle qui décide.\n\nPensez aussi au rattachement de l'enfant à la carte Vitale d'un parent (ou des deux), pour que ses soins soient pris en charge sans friction, et, si vous envisagez un congé parental ou partagé, renseignez-vous tôt auprès de votre employeur : les délais pour le prévenir varient selon votre situation et votre convention.\n\nDans votre espace AIME®, le parcours « Ma famille change » met ces étapes dans l'ordre depuis la date de naissance, avec l'échéance officielle des 5 jours signalée comme telle.",
      kind: "guide",
    },
    {
      slug: "se-separer-les-demarches",
      title: "Se séparer : les démarches à ne pas oublier",
      category: "famille",
      audience: "Personnes qui se séparent",
      summary: "Documents annotés, caisse, impôts, logement : la liste posée, une fois la décision prise ou le jugement rendu.",
      content: "Une séparation n'est jamais seulement administrative, mais l'administratif, lui, se traite avec une liste. Voici celle qui évite les blocages des mois suivants.\n\nD'abord, les documents qui fondent tout le reste : le jugement de divorce ou la convention de séparation — ils fixent notamment la résidence des enfants et les contributions de chacun. Faites ensuite annoter le livret de famille et l'acte de mariage auprès de la mairie : des pièces à jour débloquent presque toutes les démarches suivantes.\n\nAvant de signer quoi que ce soit d'engageant, un détour gratuit s'impose : les points-justice informent sans frais sur la pension alimentaire, la garde des enfants et la médiation familiale. Être informé avant de décider vaut mieux que contester après.\n\nCôté organismes, déclarez le changement de situation à votre caisse (CAF ou MSA selon votre régime) : la composition du foyer change, vos prestations et votre aide au logement peuvent être réexaminées — la décision appartient à la caisse, le signalement à vous. Les impôts aussi : séparation et divorce modifient le foyer fiscal et le taux de prélèvement, et le déclarer tôt évite les régularisations l'année suivante.\n\nEnfin, si payer devient difficile dans la période de transition — deux logements, des frais qui se dédoublent —, un parcours dédié « Je n'arrive pas à payer » existe dans votre espace : mieux vaut l'ouvrir tôt que tard.\n\nDans votre espace AIME®, le parcours « Ma famille change » prépare ces étapes dans l'ordre, selon votre situation.",
      kind: "guide",
    },
    {
      slug: "deces-dun-proche-premieres-demarches",
      title: "Un proche est décédé : les premières démarches, à votre rythme",
      category: "famille",
      audience: "Proches confrontés à un deuil",
      summary: "Déclaration selon le lieu, acte de décès, organismes à prévenir un par un : ce qui doit se faire, et ce qui peut attendre.",
      content: "Dans les premiers jours d'un deuil, on vous demandera beaucoup de choses à la fois. L'essentiel tient en quelques gestes — et beaucoup de démarches peuvent attendre que vous ayez soufflé.\n\nLa première étape dépend du lieu. Si le décès a eu lieu à l'hôpital ou en Ehpad, l'établissement effectue en général la déclaration à la mairie. À domicile, un professionnel de santé constate le décès, et la déclaration se fait ensuite en mairie. À l'étranger, l'autorité locale et le consulat de France sont vos interlocuteurs. AIME® ne réalise aucune de ces déclarations : elle vous aide à les préparer.\n\nDemandez à la mairie compétente plusieurs copies de l'acte de décès : banques, caisses et organismes vous en demanderont un exemplaire presque à chaque fois.\n\nVient ensuite le tour des organismes à prévenir — il n'existe pas de service unique qui prévient toutes les administrations d'un décès. Selon la situation : la banque, les caisses de retraite, la CAF ou la MSA, l'Assurance Maladie, et le cas échéant l'employeur du défunt. Allez-y un par un, en gardant la trace de qui a été prévenu et quand.\n\nSi un logement doit être organisé (bail, assurance, départ ou maintien des lieux), l'ADIL de votre département informe gratuitement sur les règles applicables. Et pour la succession, un notaire est l'interlocuteur naturel dès qu'il y a des biens ou des questions entre héritiers.\n\nSurtout : vous n'avez pas à porter cela seul. Les espaces France Services aident gratuitement à identifier et à mener ces démarches, à votre rythme.\n\nDans votre espace AIME®, le parcours « Un proche est décédé » vous accompagne étape par étape, sans rien précipiter.",
      kind: "guide",
    },
    {
      slug: "conjoint-survivant-pension-de-reversion",
      title: "Veuvage : la pension de réversion se demande, elle ne vient pas toute seule",
      category: "famille",
      audience: "Conjoints survivants",
      summary: "Jamais automatique, un dossier unique pour la plupart des régimes, des règles différentes selon le lien : l'essentiel à vérifier.",
      content: "C'est le point le plus important, et le plus souvent ignoré : la pension de réversion n'est jamais versée automatiquement. Même lorsque vous y avez droit, rien ne se déclenche tant que la demande n'est pas déposée.\n\nBonne nouvelle : pour la plupart des régimes, un seul dossier suffit. Le service en ligne inter-régimes (info-retraite.fr) transmet votre demande aux caisses concernées par la carrière de votre conjoint. Si sa carrière comprenait une part agricole, la MSA applique aussi ses règles propres : faites-la confirmer.\n\nQui peut y prétendre ? Dans la plupart des régimes de base, la réversion est réservée aux conjoints mariés — y compris, sous conditions, aux ex-conjoints divorcés. Le Pacs et le concubinage n'ouvrent pas les mêmes droits : ce n'est pas un jugement, c'est l'état des règles, et mieux vaut une réponse vérifiée qu'un renoncement ou un espoir infondés. L'âge compte aussi (souvent autour de 55 ans selon les régimes), ainsi que, dans plusieurs régimes, vos ressources.\n\nSi vous êtes plus jeune, renseignez-vous sur l'allocation veuvage : sous conditions, elle peut être versée pendant une durée limitée, en attendant l'âge d'ouverture de la réversion.\n\nAu-delà de la retraite, le décès d'un conjoint change presque tous les droits du foyer — logement, famille, santé. Le simulateur officiel « Mes droits sociaux » en donne une vue d'ensemble ; chaque organisme confirme ensuite ce qui le concerne.\n\nLes pièces qui serviront partout : l'acte de décès, le livret de famille à jour, votre dernier avis d'imposition et vos justificatifs de ressources.\n\nDans votre espace AIME®, le parcours « Je suis veuf ou veuve : mes droits et ma pension » vérifie ces étapes selon votre lien et le régime de votre conjoint.",
      kind: "article",
    },
    {
      slug: "se-pacser-ce-que-ca-change",
      title: "Se pacser : la démarche, et ce que ça change (et ne change pas)",
      category: "famille",
      audience: "Couples qui se pacsent",
      summary: "Convention et déclaration en mairie, impôts, livret de famille — et la différence avec le mariage qui compte le plus.",
      content: "Le Pacs se conclut en deux temps : une convention, que vous rédigez librement (des modèles officiels existent), et une déclaration conjointe, déposée à la mairie de votre domicile ou chez un notaire. Après enregistrement, un certificat vous est remis — gardez-le, il sera votre justificatif de situation.\n\nFaites ensuite mettre à jour ce qui doit l'être : le livret de famille, et votre situation auprès des organismes — à commencer par votre caisse (CAF ou MSA selon votre régime), car la composition du foyer conditionne plusieurs prestations. Côté impôts, la situation de famille influe sur l'imposition et le taux de prélèvement : l'année du Pacs, des choix existent, expliqués sur le site officiel des impôts.\n\nCe que le Pacs change, concrètement : une vie commune reconnue, des droits et devoirs réciproques (aide matérielle, solidarité pour les dettes du quotidien), et une séparation qui se règle par une déclaration, bien plus simplement qu'un divorce.\n\nCe qu'il ne change pas — et c'est la différence la plus lourde avec le mariage : dans la plupart des régimes de base, le partenaire pacsé survivant n'a pas droit à la pension de réversion, réservée aux conjoints mariés. Si cette protection compte pour vous, elle mérite d'être regardée en face, éventuellement avec un notaire, avant de choisir la forme de votre union.\n\nDans votre espace AIME®, le parcours « Ma famille change » prépare les démarches d'un mariage comme d'un Pacs, et le parcours mariage en raconte la version longue si le cœur vous en dit.",
      kind: "article",
    },
  ]);

  console.log("Création du fonds santé : 5 guides et articles publics…");
  await db.insert(articles).values([
    {
      slug: "accident-du-travail-les-bons-reflexes",
      title: "Accident du travail : les bons réflexes des premières 48 heures",
      category: "sante",
      audience: "Salariés, exploitants et employeurs",
      summary: "C'est l'employeur qui déclare, la feuille d'accident évite l'avance de frais : ce qui se joue tout de suite.",
      content: "Un accident du travail ne se traite pas comme une maladie ordinaire — et c'est une bonne nouvelle, à condition de le déclarer comme tel dès le départ.\n\nLe premier réflexe : prévenir votre employeur sans attendre. C'est à lui de déclarer l'accident à votre caisse (MSA ou Assurance Maladie selon votre régime) dans les 48 heures (source : service-public.fr). S'il tarde ou hésite, ce délai court quand même : signalez-le par écrit.\n\nLe deuxième : demandez à l'employeur la feuille d'accident du travail. Présentée aux médecins, pharmaciens et soignants, elle vous évite d'avancer les frais des soins liés à l'accident. Sans elle, les soins risquent d'être remboursés comme une maladie ordinaire — moins bien, et avec des démarches pour régulariser.\n\nLe troisième : le certificat médical. Le médecin qui vous examine décrit les lésions constatées ; ce certificat initial est la pièce maîtresse du dossier. Gardez l'original accessible, photographiez-le, et conservez chaque prolongation.\n\nSi un arrêt de travail est prescrit, les règles habituelles s'appliquent en plus : avis d'arrêt transmis à la caisse et à l'employeur dans les 48 heures, attestation de salaire complétée par l'employeur pour le calcul des indemnités — dont le montant dépend de votre situation et que seule la caisse calcule.\n\nDans votre espace AIME®, le parcours « Je suis malade ou en arrêt de travail » pose ces échéances officielles à 48 heures depuis la date de l'accident, et distingue ce qui relève de vous, de l'employeur et de la caisse.",
      kind: "guide",
    },
    {
      slug: "arret-long-preparer-la-reprise",
      title: "Arrêt long : préparer la reprise avant d'y être obligé",
      category: "sante",
      audience: "Personnes en arrêt prolongé",
      summary: "Visite de pré-reprise, médecine du travail, reprise impossible : les questions à ouvrir pendant l'arrêt, pas au pied du mur.",
      content: "Un arrêt qui dure change la question. Au début, il s'agit de se soigner et de déclarer ; après quelques semaines, il s'agit aussi de préparer la suite — quelle qu'elle soit.\n\nL'interlocuteur central de la reprise, c'est la médecine du travail. Vous pouvez demander une visite de pré-reprise pendant l'arrêt : elle sert à regarder, sans engager, ce qu'un retour pourrait donner — poste aménagé, rythme, gestes à éviter. Le médecin du travail est tenu au secret médical vis-à-vis de l'employeur : il ne transmet que des conclusions d'aptitude et des propositions d'aménagement, jamais votre dossier de santé.\n\nÀ la fin d'un arrêt long, une visite de reprise est en principe organisée à l'initiative de l'employeur. Ne la subissez pas comme un examen : c'est le moment où se décide concrètement dans quelles conditions vous reprenez.\n\nEt si la reprise au même poste semble impossible ? Mieux vaut ouvrir la question pendant l'arrêt qu'au pied du mur. Trois portes existent : l'inaptitude, que seul le médecin du travail peut prononcer ; la pension d'invalidité, que la caisse instruit si travailler comme avant devient durablement impossible ; et la MDPH, qui évalue la reconnaissance du handicap et les compensations. Aucun de ces organismes ne décide vite, ni à votre place de demander : ce sont des dossiers qui se préparent.\n\nDans votre espace AIME®, le parcours « Je suis malade ou en arrêt de travail » fait apparaître ces étapes quand l'arrêt se prolonge, et le parcours « Mon handicap ou ma santé m'empêche de travailler comme avant » prend le relais si la reprise devient un changement de cap.",
      kind: "guide",
    },
    {
      slug: "maladie-professionnelle-la-faire-reconnaitre",
      title: "Maladie professionnelle : la faire reconnaître, étape par étape",
      category: "sante",
      audience: "Salariés et exploitants concernés",
      summary: "Un certificat qui relie la maladie au travail, une caisse qui instruit : la reconnaissance ouvre des droits spécifiques.",
      content: "Certaines maladies viennent du travail — gestes répétés, produits, postures, bruits. Quand c'est le cas, les faire reconnaître comme maladies professionnelles change la prise en charge et ouvre des droits spécifiques. Encore faut-il le demander : rien ne se déclenche tout seul.\n\nLa démarche commence chez le médecin. Demandez un certificat médical initial qui décrive la maladie et le travail que vous exercez : c'est ce lien, écrit par un médecin, qui fonde la demande. Sans lui, la caisse n'a rien à instruire.\n\nLa déclaration se dépose ensuite auprès de votre caisse — MSA ou Assurance Maladie selon votre régime. C'est elle qui instruit : elle vérifie notamment si votre maladie figure dans les tableaux de maladies professionnelles ou peut être reconnue par une autre voie, elle peut demander des examens et des avis complémentaires. Cette instruction prend du temps ; c'est normal, et ce n'est ni un refus ni une acceptation tant qu'elle n'est pas terminée.\n\nPendant ce temps, si vous êtes en arrêt, les règles habituelles continuent de courir : avis transmis dans les 48 heures, attestation de salaire, indemnités calculées par la caisse. Conservez tout ce qui décrit votre exposition au travail — postes occupés, produits, durées : le dossier se nourrit de faits datés.\n\nDans votre espace AIME®, le parcours « Je suis malade ou en arrêt de travail » prépare la déclaration et ses pièces quand vous reliez votre maladie à votre travail ; la décision, elle, appartiendra toujours à la caisse.",
      kind: "article",
    },
    {
      slug: "handicap-travailler-autrement",
      title: "Handicap et travail : adapter, se reconvertir, faire reconnaître",
      category: "sante",
      audience: "Personnes en situation de handicap",
      summary: "MDPH, médecine du travail, Cap emploi, invalidité : les interlocuteurs dans l'ordre, sans qu'on décide d'un taux à votre place.",
      content: "Quand la santé empêche durablement de travailler comme avant, il n'y a pas une seule porte mais plusieurs — et elles ne s'ouvrent pas dans n'importe quel ordre.\n\nLa première est souvent la MDPH de votre département. Son dossier — en ligne, avec un certificat médical récent — fonde la reconnaissance de la qualité de travailleur handicapé (RQTH), l'allocation aux adultes handicapés (AAH) et les orientations vers l'accompagnement adapté. Les délais d'instruction sont longs : un dossier complet dès le départ est le meilleur moyen de ne pas les allonger.\n\nLa deuxième porte se trouve au travail même. La médecine du travail peut proposer des aménagements — poste, outils, horaires, temps partiel — que l'employeur met ensuite en œuvre ; des aides financières à l'aménagement existent (Agefiph pour le secteur privé, dispositifs de la MSA pour l'agricole), et Cap emploi accompagne salariés comme employeurs dans ces ajustements. Beaucoup de situations se débloquent par un aménagement plutôt que par un arrêt définitif.\n\nSi changer de métier devient la piste, Cap emploi aide à évaluer ce qui reste possible et souhaitable, un bilan de compétences peut être financé selon votre situation, et vos droits sur Mon Compte Formation restent mobilisables pour une formation de reconversion.\n\nReste la question des revenus quand travailler comme avant n'est plus possible : la pension d'invalidité. C'est le médecin-conseil de votre caisse qui évalue votre capacité de travail et le droit qui peut en découler — jamais une application, jamais un simulateur. Invalidité et AAH répondent à des règles différentes : les deux pistes valent d'être vérifiées plutôt que choisies à l'aveugle.\n\nDans votre espace AIME®, le parcours « Mon handicap ou ma santé m'empêche de travailler comme avant » ordonne ces démarches selon votre situation — en poste, en arrêt, ou sans activité.",
      kind: "guide",
    },
    {
      slug: "ne-pas-renoncer-aux-soins",
      title: "Ne pas renoncer aux soins quand l'argent manque",
      category: "sante",
      audience: "Personnes aux revenus modestes",
      summary: "Complémentaire santé solidaire, suivi de vos remboursements, aides à vérifier : se soigner sans s'endetter.",
      content: "Différer un soin parce qu'il coûte est un réflexe compréhensible — et presque toujours le plus cher, en santé d'abord, et souvent en argent ensuite. Avant de renoncer, plusieurs vérifications valent la peine.\n\nLa première : la complémentaire santé solidaire. Selon vos ressources, elle peut prendre en charge la part complémentaire de vos soins, gratuitement ou pour une participation modeste. C'est votre caisse — MSA ou Assurance Maladie — qui instruit la demande et décide ; le simulateur officiel « Mes droits sociaux » donne une première estimation des aides de votre foyer, sans valeur de décision.\n\nLa deuxième : vos remboursements actuels. Sur le site de votre caisse (ameli ou MSA), vous suivez ce qui est pris en charge, ce qui reste à votre charge, et vous contestez à temps une erreur plutôt que de la découvrir des mois plus tard.\n\nLa troisième : parlez-en. À votre médecin d'abord — beaucoup adaptent ordonnances et parcours quand ils savent ; au CCAS de votre commune ou à un France Services ensuite, qui connaissent les aides locales et peuvent regarder votre situation dans son ensemble.\n\nSi c'est l'ensemble du budget qui ne tient plus, soins compris, un parcours dédié « Je n'arrive pas à payer » existe dans votre espace : il commence par vérifier les droits non réclamés avant de toucher à l'essentiel.\n\nDans votre espace AIME®, les parcours santé préparent vos démarches de soins, et « Je n'arrive pas à payer » prend le relais quand c'est le budget qui bloque.",
      kind: "guide",
    },
  ]);

  console.log("Création du fonds retraite : 4 guides et articles publics…");
  await db.insert(articles).values([
    {
      slug: "releve-de-carriere-verifier-tot",
      title: "Relevé de carrière : le vérifier des années avant de partir",
      category: "retraite",
      audience: "Actifs et futurs retraités",
      summary: "Un seul document rassemble toute votre carrière, tous régimes confondus — et il contient presque toujours quelque chose à corriger.",
      content: "Votre retraite se calculera sur ce que les caisses savent de votre carrière. La première démarche utile n'est donc pas de demander sa retraite : c'est de vérifier ce qu'elles en savent.\n\nLe relevé de carrière, accessible via Info Retraite, rassemble vos périodes d'activité dans tous vos régimes — salariat, agriculture, indépendance. C'est le seul endroit où votre vie professionnelle apparaît entière, et c'est là que se voient les oublis : un emploi saisonnier jamais transmis, une période travaillée à l'étranger, un changement de statut mal enchaîné, des années d'exploitation agricole incomplètes.\n\nCes corrections prennent du temps — recherches de justificatifs, échanges avec les caisses. Faites-les des années avant le départ envisagé, pas dans les derniers mois : le plus tôt est le mieux, et en tout cas bien avant l'année du départ. Chaque période régularisée compte pour le calcul ; chaque période manquante peut le diminuer ou retarder l'instruction.\n\nGardez vos justificatifs au fil de la vie active : bulletins de salaire, attestations d'employeurs, documents d'exploitation. Le jour où une période est contestée, ce sont eux qui parlent.\n\nDans votre espace AIME®, le parcours « Je prépare ma retraite » commence par cette vérification du relevé, puis oriente vers la MSA pour la part agricole et vers l'Assurance retraite pour le régime général, selon votre carrière.",
      kind: "guide",
    },
    {
      slug: "retraite-de-base-complementaire-qui-paye-quoi",
      title: "Retraite de base et complémentaire : qui paie quoi ?",
      category: "retraite",
      audience: "Salariés et futurs retraités",
      summary: "Deux étages, deux logiques, parfois deux caisses : comprendre la structure avant de croire une estimation.",
      content: "Une retraite de salarié tient en deux étages, versés séparément, selon deux logiques différentes. Comprendre cette structure évite la plupart des malentendus.\n\nLe premier étage est la retraite de base : elle dépend de votre durée d'assurance (les périodes validées au fil de la carrière) et de vos revenus d'activité. Elle est gérée par l'Assurance retraite pour les salariés du régime général, et par la MSA pour les salariés et exploitants agricoles.\n\nLe deuxième étage est la retraite complémentaire. Pour les salariés du secteur privé, c'est l'Agirc-Arrco : elle fonctionne par points, accumulés tout au long de la carrière et convertis en pension au départ. Deux carrières au même salaire final peuvent donc donner des retraites différentes — c'est l'ensemble du parcours qui compte, pas la dernière feuille de paie.\n\nConséquence pratique : une estimation lue sur un simulateur n'est jamais une promesse. Elle dépend des périodes connues des caisses (d'où l'importance du relevé de carrière à jour), des règles en vigueur au moment du départ, et de vos choix d'âge. Les caisses calculent et décident ; un simulateur donne un ordre de grandeur.\n\nDans votre espace AIME®, le parcours « Je prépare ma retraite » vous oriente vers le bon interlocuteur pour chaque étage — Info Retraite pour la vue d'ensemble, votre caisse de base, et l'Agirc-Arrco pour la complémentaire.",
      kind: "article",
    },
    {
      slug: "carrieres-mixtes-retraite",
      title: "Carrières mixtes : quand une vie de travail tient en plusieurs régimes",
      category: "retraite",
      audience: "Exploitants, salariés, carrières variées",
      summary: "Saisonnier agricole, salariat, indépendance : chaque période compte quelque part, à condition de vérifier qu'elle y figure.",
      content: "À la campagne, les carrières droites sont l'exception : quelques saisons comme salarié agricole, des années d'exploitation, une parenthèse salariée ailleurs, parfois une activité indépendante en plus. Bonne nouvelle : aucune de ces périodes n'est perdue par principe. Chacune compte dans un régime — à condition qu'elle y soit correctement enregistrée.\n\nLe point de départ reste le relevé de carrière inter-régimes, sur Info Retraite : c'est lui qui montre, régime par régime, ce qui est connu de votre parcours. Parcourez-le période par période, surtout aux jonctions — changement de statut, passage de salarié à exploitant, années partagées entre plusieurs activités.\n\nEnsuite, chaque caisse confirme sa part : la MSA pour tout ce qui relève de l'agricole (salarié comme exploitant), l'Assurance retraite pour le salariat du régime général, l'Agirc-Arrco pour la complémentaire des périodes salariées du privé. Ne supposez jamais qu'une caisse « voit » ce que l'autre détient : c'est votre vérification qui fait la jonction.\n\nAu moment du départ, la demande en ligne inter-régimes transmet votre dossier aux caisses concernées pour les retraites de base et complémentaires : une seule démarche, mais elle s'appuie sur ce que chaque régime connaît déjà de vous. D'où, encore une fois, l'intérêt de corriger le relevé tôt.\n\nDans votre espace AIME®, le parcours « Je prépare ma retraite » tient compte des carrières en partie agricoles et vous oriente vers chaque interlocuteur pour sa part.",
      kind: "guide",
    },
    {
      slug: "demander-sa-retraite-une-seule-demande",
      title: "Demander sa retraite : une seule demande pour presque tous les régimes",
      category: "retraite",
      audience: "Futurs retraités",
      summary: "Quand le départ approche, la demande en ligne transmet votre dossier aux caisses concernées — à préparer sans se presser.",
      content: "Le jour où le départ approche, la démarche est plus simple qu'on l'imagine : la demande de retraite en ligne, via le service inter-régimes, transmet votre dossier aux caisses concernées par votre carrière — retraites de base et complémentaires. Une seule demande, au lieu d'un courrier par régime.\n\nElle se prépare sans se presser. Le parcours AIME® vous la propose lorsque votre départ est à moins d'un an : c'est le moment de vérifier une dernière fois votre relevé de carrière, de rassembler les justificatifs que le service vous listera au fil de la demande (identité, carrière, situation de famille, dernier avis d'imposition le plus souvent), et de choisir votre date de départ en connaissance de cause.\n\nCar c'est bien un choix : l'âge et la date de départ influent sur le calcul, et les règles applicables sont celles en vigueur au moment où vous partez. Les estimations obtenues avant la demande donnent un ordre de grandeur ; seule l'instruction des caisses aboutit à une décision et à un montant.\n\nUne fois la demande déposée, suivez son avancement auprès de chaque caisse et conservez les notifications reçues : ce sont elles qui font foi en cas de question. Si votre carrière comprend une part agricole, la MSA confirme sa part comme les autres régimes.\n\nDans votre espace AIME®, le parcours « Je prépare ma retraite » vous amène à cette demande dans l'ordre : relevé vérifié d'abord, interlocuteurs identifiés, demande unique ensuite.",
      kind: "guide",
    },
  ]);

  console.log("Création du fonds logement : 5 guides et articles publics…");
  await db.insert(articles).values([
    {
      slug: "aide-au-logement-estimer-sans-se-tromper",
      title: "Aide au logement : estimer, demander, signaler les changements",
      category: "logement",
      audience: "Locataires et futurs locataires",
      summary: "Une estimation sur le simulateur, une décision par la CAF ou la MSA, et des changements à signaler sans tarder.",
      content: "Les aides personnelles au logement sont versées par la CAF ou, pour le régime agricole, par la MSA. Leur montant dépend de votre loyer, de vos ressources et de la composition de votre foyer — c'est dire qu'aucun barème lu sur un forum ne peut vous donner « votre » montant.\n\nLe bon point de départ est le simulateur officiel de votre caisse : il donne une estimation à partir de votre situation du moment. Gardez en tête ce qu'elle est — une estimation. La décision vient ensuite, après instruction de votre demande et de vos justificatifs, et elle appartient à la caisse.\n\nUne fois l'aide en place, le travail n'est pas fini : signalez les changements sans tarder. Revenus qui baissent ou qui montent, entrée ou départ d'une personne du foyer, séparation, déménagement : la composition du foyer et les ressources conditionnent l'aide, et un changement signalé tôt évite les trop-perçus — ces sommes versées en trop qu'il faut ensuite rembourser, souvent au pire moment.\n\nEt si le loyer devient difficile à payer malgré l'aide, ne laissez pas l'impayé s'installer : notre guide « Loyer en retard : parler à son bailleur avant que ça s'aggrave » (thématique Argent et difficultés) décrit l'ordre des gestes, et le parcours « Je n'arrive pas à payer » de votre espace les prépare avec vous.\n\nDans votre espace AIME®, le parcours « Je cherche un logement » commence par l'estimation de l'aide et le conseil gratuit de l'ADIL, avant toute signature.",
      kind: "guide",
    },
    {
      slug: "dossier-de-location-solide-sans-trop-en-donner",
      title: "Dossier de location : solide, sans trop en donner",
      category: "logement",
      audience: "Personnes qui cherchent un logement",
      summary: "Les pièces qu'un bailleur peut demander sont listées par la loi — et celles qu'il ne peut pas exiger aussi.",
      content: "Chercher un logement met vos papiers entre beaucoup de mains. Deux protections existent, et elles sont écrites dans la loi : la liste des pièces qu'un bailleur peut demander est fermée, et certaines pièces ne peuvent jamais être exigées.\n\nCôté pièces demandables, attendez-vous à : une pièce d'identité, un justificatif de domicile, des justificatifs d'activité (contrat de travail, attestation d'études…) et de ressources (avis d'imposition, fiches de paie…). Un dossier complet, propre et dans l'ordre se traite plus vite — préparez-le une fois, en copies.\n\nCôté pièces interdites : un bailleur ne peut pas vous demander de photo d'identité (hors celle de la pièce d'identité), de carte d'assuré social, de relevé de compte bancaire, de dossier médical, d'extrait de casier judiciaire ou d'attestation de « bonne tenue » de vos comptes. Si on vous les réclame, vous pouvez refuser poliment — l'ADIL de votre département confirme gratuitement ce qui est exigible dans votre cas.\n\nNe diffusez pas votre dossier partout : transmettez-le pour des logements réellement visités, et préférez les copies aux originaux. Un dossier « prêt à partir » n'a pas à devenir un dossier « parti partout ».\n\nEt si le bailleur demande un garant, sachez qu'une alternative existe : la garantie Visale, portée par Action Logement, gratuite pour le locataire comme pour le bailleur, sous conditions (salariés, jeunes, étudiants…). Notre article « Pas de garant ? La piste Visale et Action Logement » la présente.\n\nDans votre espace AIME®, le parcours « Je cherche un logement » prépare vos justificatifs de ressources et vous oriente vers l'ADIL avant la signature.",
      kind: "guide",
    },
    {
      slug: "bail-et-etat-des-lieux-ce-quil-faut-lire",
      title: "Bail et état des lieux : ce qu'il faut lire avant de signer",
      category: "logement",
      audience: "Nouveaux locataires",
      summary: "Deux documents qui vous engagent pour des années : dix minutes de lecture maintenant valent des mois de litige évités.",
      content: "Le bail et l'état des lieux sont les deux documents qui raconteront votre location du premier au dernier jour. Ils se lisent avant de signer, pas le jour du départ.\n\nLe bail fixe l'essentiel : le loyer et les charges (et ce qu'elles couvrent), la durée, les conditions de révision, le dépôt de garantie — qui est encadré par la loi : en principe un mois de loyer hors charges pour un logement vide. Si une clause vous semble étrange, ou si le bailleur refuse le bail écrit, faites relire le document gratuitement par l'ADIL de votre département avant de vous engager : c'est exactement son rôle.\n\nL'état des lieux d'entrée se fait à l'amiable, gratuitement, en présence des deux parties (ou de leurs représentants). C'est une photographie écrite du logement : sols, murs, équipements, compteurs. Prenez le temps de tout noter, y compris les petits défauts, et de compléter par des photos datées. Ce qui n'est pas écrit à l'entrée pourra vous être reproché à la sortie ; ce qui l'est vous protège.\n\nL'état des lieux de sortie, des mois ou des années plus tard, sera comparé au premier, usure normale déduite. Les retenues sur le dépôt de garantie doivent correspondre à des dégradations constatées et justifiées — là encore, en cas de désaccord, l'ADIL informe gratuitement, et des voies de conciliation existent avant tout procès.\n\nDans votre espace AIME®, le parcours « Je cherche un logement » vous dirige vers ce conseil gratuit dès le départ : un bail relu avant signature est le litige le moins cher qui soit.",
      kind: "guide",
    },
    {
      slug: "logement-urgence-qui-appeler",
      title: "Sans logement ou sur le point de le perdre : qui appeler, dans quel ordre",
      category: "logement",
      audience: "Personnes sans solution de logement",
      summary: "Le CCAS de votre commune d'abord, le 115 en urgence immédiate : des portes réelles, sans promesse de place immédiate.",
      content: "Si vous êtes sans logement ce soir, ou sur le point de perdre le vôtre, cet article ne vous promettra pas une place : il vous donne les portes qui existent, dans l'ordre où elles s'ouvrent le plus vite.\n\nEn urgence immédiate, le 115 est le numéro national gratuit de l'hébergement d'urgence, joignable tous les jours. L'appel ne crée pas une place par magie — les capacités sont limitées — mais il vous met en relation avec l'accueil et l'orientation de votre département, qui connaissent les places du soir même.\n\nDès que l'urgence immédiate est passée (ou en parallèle), le CCAS de votre commune est la porte d'entrée durable : il instruit les aides locales, connaît les associations du secteur, et peut appuyer vos demandes d'hébergement ou de logement. Les espaces France Services aident aussi à identifier les démarches et à constituer les dossiers.\n\nSi c'est un impayé de loyer qui menace votre logement, le plus tôt est le mieux : bailleur prévenu avant que le retard ne s'installe, aide au logement vérifiée auprès de la CAF ou de la MSA, conseil gratuit de l'ADIL sur vos droits et les démarches amiables. Notre guide « Loyer en retard : parler à son bailleur avant que ça s'aggrave » (thématique Argent et difficultés) détaille cet ordre des gestes.\n\nAucune de ces portes ne décide d'un logement à votre place, et les délais d'attente pour un logement durable peuvent être longs — c'est précisément pour cela qu'il faut ouvrir toutes les portes tôt, plutôt qu'une seule tard.\n\nDans votre espace AIME®, le parcours « Je cherche un logement » signale le CCAS comme premier contact en situation d'urgence, et transmet votre situation à votre bureau si vous le souhaitez.",
      kind: "guide",
    },
    {
      slug: "pas-de-garant-piste-visale-action-logement",
      title: "Pas de garant ? La piste Visale et Action Logement",
      category: "logement",
      audience: "Locataires sans garant",
      summary: "Une garantie gratuite portée par Action Logement peut remplacer le garant familial — sous conditions, à vérifier chez eux.",
      content: "« Vous avez un garant ? » est souvent la première question d'un bailleur — et le premier obstacle quand la famille ne peut pas jouer ce rôle. Une alternative existe, encore trop peu connue : la garantie Visale.\n\nPortée par Action Logement, Visale est une garantie gratuite — pour le locataire comme pour le bailleur — qui couvre les loyers impayés pendant une partie du bail si vous ne pouvez plus payer. Pour le bailleur, elle vaut engagement d'un organisme solide ; pour vous, elle remplace le garant personne physique. Elle se demande en ligne, avant la signature du bail, et le bailleur doit l'accepter : vérifiez donc son accord avant de monter le dossier.\n\nQui peut en bénéficier ? Principalement les salariés (notamment en début d'emploi ou en mobilité), les jeunes et les étudiants, sous conditions détaillées sur le site d'Action Logement — c'est là, et seulement là, que votre éligibilité se vérifie. Aucune application tierce ne peut la décider pour vous.\n\nPlus largement, si vous êtes salarié d'une entreprise du secteur privé, Action Logement propose d'autres accompagnements liés au logement — aides, garanties, solutions de mobilité. Cela vaut un détour avant de conclure que « rien n'existe » pour votre situation.\n\nEt le garant « classique » reste possible : un proche qui s'engage par écrit, en connaissance de ce que cela signifie pour lui — un engagement réel, à ne demander ni à accepter à la légère.\n\nDans votre espace AIME®, le parcours « Je cherche un logement » vous oriente vers Action Logement lorsque vous êtes salarié du secteur privé, et vers l'ADIL pour relire les clauses du bail.",
      kind: "article",
    },
  ]);

  console.log("Création du fonds emploi : 5 guides et articles publics…");
  await db.insert(articles).values([
    {
      slug: "recherche-emploi-par-ou-commencer",
      title: "Recherche d'emploi : par où commencer, selon votre situation",
      category: "emploi",
      audience: "Personnes en recherche d'emploi ou de formation",
      summary: "France Travail, mission locale, Cap emploi, Compte Formation : la bonne première porte dépend de votre âge, de votre objectif et de vos besoins.",
      content: "Chercher un emploi, ce n'est pas seulement consulter des annonces : c'est aussi ouvrir les bons dossiers auprès des bons interlocuteurs, pour que l'accompagnement — et, le cas échéant, l'indemnisation — puissent suivre.\n\nLa porte d'entrée générale est France Travail : s'y inscrire, ou mettre à jour son dossier si c'est déjà fait. C'est là que se construit l'accompagnement de votre recherche et que s'examine une éventuelle indemnisation — éventuelle, car elle dépend de votre parcours et s'instruit dossier par dossier.\n\nSi vous avez moins de 26 ans, une deuxième porte existe, souvent plus proche : la mission locale. Elle accompagne les jeunes de 16 à 25 ans sur l'emploi et la formation, mais aussi sur la vie quotidienne qui conditionne le reste — transport, logement, santé.\n\nSi un handicap fait partie de votre situation et que vous souhaitez un accompagnement adapté, Cap emploi est l'interlocuteur spécialisé de l'emploi des personnes en situation de handicap. C'est vous qui choisissez d'y recourir : cette question vous appartient.\n\nEt si votre objectif est plutôt de vous former ou de changer de métier, vos droits à la formation se consultent sur Mon Compte Formation, le service officiel : c'est là, et seulement là, que se vérifie ce à quoi vous pouvez prétendre. Dans tous les cas, un CV à jour vous servira à chaque rendez-vous.\n\nDans votre espace AIME®, le parcours « Je cherche un emploi ou une formation » vous pose ces quelques questions — âge, objectif, accompagnement souhaité — et vous indique vos interlocuteurs dans le bon ordre.",
      kind: "guide",
    },
    {
      slug: "premiere-embauche-les-gestes-dans-lordre",
      title: "Première embauche : les gestes dans le bon ordre",
      category: "emploi",
      audience: "Employeurs, première embauche ou renfort ponctuel",
      summary: "Une offre claire, une déclaration avant la prise de poste, un contrat écrit : l'ordre des gestes qui protège l'employeur comme le salarié.",
      content: "Embaucher pour la première fois impressionne surtout par le nombre de sigles. En réalité, les gestes se comptent et ils ont un ordre — et c'est cet ordre qui vous protège, vous comme la personne recrutée.\n\nTout commence par l'offre : tâches, lieu, horaires, durée, compétences réellement nécessaires. Une offre claire attire les bons candidats et cadre la suite ; vous pouvez la déposer auprès de France Travail, qui peut aussi vous aider à la rédiger.\n\nAvant la prise de poste — c'est le geste à ne jamais remettre au lendemain — vient la déclaration préalable à l'embauche (DPAE) : auprès de la MSA si votre activité relève du régime agricole, auprès de l'Urssaf sinon. Elle se fait en ligne et déclenche l'immatriculation de votre salarié·e. Embaucher sans déclaration expose à des sanctions et laisse la personne sans droits.\n\nViennent ensuite le contrat de travail écrit — durée, horaires, rémunération — et l'organisation de la visite d'information et de prévention auprès du service de santé au travail. Pour une première embauche, prévoyez aussi un temps d'installation : comptes employeur auprès de la MSA ou de l'Urssaf, convention collective applicable, interlocuteurs repérés. France Services ou votre chambre consulaire peuvent vous aider à démarrer.\n\nReste la question des aides à l'embauche : elles existent selon le public recruté, le territoire et le type de contrat, elles évoluent souvent, et elles se vérifient au moment de l'embauche sur les sites officiels. Ni AIME® ni un tiers ne peuvent vous en garantir une : seuls les organismes la confirment.\n\nDans votre espace AIME®, le parcours « J'embauche ou je recrute » déroule ces gestes selon votre secteur et votre besoin — première embauche, saisonnier, remplacement ou poste durable.",
      kind: "guide",
    },
    {
      slug: "spectacle-occasionnel-declarer-avec-le-guso",
      title: "Un artiste ou un technicien pour un soir : déclarer avec le Guso",
      category: "emploi",
      audience: "Organisateurs occasionnels de spectacles",
      summary: "Pour le spectacle vivant, l'artiste rémunéré est présumé salarié : quand le spectacle n'est pas votre métier, le Guso gère déclaration, contrat et cotisations.",
      content: "Vous organisez une fête, un mariage, un concert dans votre salle — et vous rémunérez un musicien ou un technicien pour la soirée. Le réflexe « il me fera une facture » peut vous mettre, et le mettre, hors cadre.\n\nPour le spectacle vivant, la règle de départ est protectrice : l'artiste rémunéré est présumé salarié. Autrement dit, sauf situation particulière vérifiée, la personne que vous payez pour jouer n'est pas votre prestataire indépendant, mais votre salarié·e le temps de la prestation — avec les droits qui vont avec. Une facture ou un numéro de Siret ne suffit pas toujours à établir un autre cadre.\n\nQuand le spectacle n'est pas votre activité principale, un dispositif a été créé exactement pour cela : le Guso. Il est obligatoire dans ce cadre, gratuit, et il gère pour vous la déclaration, le contrat et les cotisations liés à l'emploi de l'artiste ou du technicien. Vous déclarez la prestation, le cadre suit.\n\nLe bon moment pour vérifier tout cela, c'est avant de signer quoi que ce soit et avant la soirée — jamais après coup. Si votre situation est moins nette (activité régulière de spectacle, statuts mêlés), elle se vérifie au cas par cas auprès des organismes concernés.\n\nDans votre espace AIME®, le parcours « J'embauche ou je recrute » vous dirige vers le Guso dès que vous déclarez un recrutement dans le spectacle vivant ponctuel.",
      kind: "article",
    },
    {
      slug: "creer-son-activite-avant-les-formalites",
      title: "Créer son activité : l'accompagnement avant les formalités",
      category: "emploi",
      audience: "Personnes qui créent ou développent une activité",
      summary: "Clarifier le projet et choisir le statut avant de déclarer : la création se joue d'abord dans une conversation, ensuite au guichet unique.",
      content: "Créer une activité — agricole, artisanale, commerciale, libérale ou artistique — commence rarement par un formulaire. Elle commence par une conversation : avec un accompagnement local, qui aide à clarifier le projet et à choisir le statut adapté avant toute formalité. Ce temps-là n'est pas du temps perdu : c'est celui qui évite de devoir refaire.\n\nQuand le projet est prêt, la déclaration de création passe par un seul endroit : le guichet unique des formalités d'entreprise, en ligne. Toutes les créations y transitent ; préparez votre pièce d'identité et un justificatif de domicile, demandés lors des formalités.\n\nLa protection sociale, elle, dépend de votre régime : si votre activité relève du régime agricole, c'est la MSA qui gère votre protection sociale ; sinon, c'est l'Urssaf qui recouvre les cotisations des travailleurs indépendants. Identifier le bon interlocuteur dès le départ simplifie toutes les déclarations suivantes.\n\nUn cas mérite une vérification avant de facturer : les activités artistiques. Pour le spectacle vivant, l'artiste rémunéré est présumé salarié — votre activité relève peut-être du salariat plutôt que de l'indépendance, et ce statut se vérifie avant de choisir une forme.\n\nDans votre espace AIME®, le parcours « Je commence ou développe une activité » tient compte de votre type d'activité et de votre stade — idée, création, activité existante — pour ordonner ces étapes.",
      kind: "guide",
    },
    {
      slug: "transmettre-ou-cesser-son-activite",
      title: "Transmettre ou cesser son activité : préparer avant de déclarer",
      category: "emploi",
      audience: "Indépendants et exploitants qui transmettent ou cessent",
      summary: "Rendre l'activité transmissible, sécuriser les salarié·es, aligner la retraite : la cessation propre se prépare des mois avant la radiation.",
      content: "Transmettre ou cesser une activité — exploitation, commerce, micro-entreprise — est un chantier qui se prépare bien avant la formalité qui l'officialise. Voici l'ordre des gestes, du plus en amont au plus administratif.\n\nSi vous cherchez un repreneur, commencez par rendre l'activité transmissible : bilans, baux et autorisations à jour. Un repreneur — ou sa banque — demandera les trois derniers bilans, les baux en cours et l'état du matériel ; les chambres consulaires et les réseaux de transmission accompagnent cette préparation. Une activité dont les papiers sont prêts se transmet plus vite et à sa juste valeur. Si le repreneur est trouvé, formalisez avec un professionnel — notaire, expert-comptable, chambre consulaire : cession de fonds, de parts ou de bail, la forme choisie change les impôts, les droits et les garanties, et ce choix ne se délègue pas à un site.\n\nSi vous avez des salarié·es, leur situation se sécurise avant toute annonce de dates : transmission des contrats ou fin de contrat, documents obligatoires — les règles et les délais sont stricts. Un Point-justice ou un expert-comptable sécurise la procédure ; c'est le point le plus risqué juridiquement d'une cessation.\n\nLa formalité elle-même passe par le Guichet unique des formalités d'entreprise : c'est elle qui radie l'activité et déclenche les régularisations — cotisations de l'année de cessation auprès de la MSA (activité agricole) ou de l'Urssaf, droits santé et famille. Sans radiation, certaines cotisations et taxes continuent de courir.\n\nEnfin, cessation et départ en retraite ne coïncident pas toujours : faites le point sur votre relevé de carrière et vos dates possibles de départ pour aligner les deux — une année blanche évitée vaut quelques simulations.\n\nDans votre espace AIME®, le parcours « Je transmets ou je cesse mon activité » adapte ces étapes à votre projet : repreneur trouvé ou cherché, arrêt progressif, cessation sans repreneur.",
      kind: "guide",
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

  console.log("Ajout de l'annuaire des organismes et des exemples Le Monde Aime…");
  await seedLmaDemoIfEmpty(db);
  await seedAimeIfEmpty(db);
  await seedCommunityDemoIfEmpty(db);
  await seedVisiteGuideeIfEmpty(db);
  // Normalisation de marque : les données historiques du seed utilisent
  // encore d'anciens préfixes (MSA-) et libellés, convertis ici en DOS- /
  // « équipe d'accompagnement » comme le fait l'application.
  await rebrandData(db);

  console.log("Terminé. Comptes de démonstration (mot de passe : Demo1234!) :");
  console.log("  Administrateur : admin@aime-demo.fr");
  console.log("  Gestionnaire Beauce : agent.beauce@aime-demo.fr");
  console.log("  Gestionnaire Armor : agent.armor@aime-demo.fr");
  console.log("  Membre : jean.dupont@exemple.fr");
  console.log("  Membre : marie.lefevre@exemple.fr");
  console.log("  Membre : paul.martin@exemple.fr");
  console.log("  Visite guidée (lecture seule, sans mot de passe) : demo@aime-demo.fr");

}


const DAY = 86_400_000;

// ---------------------------------------------------------------------------
// Démonstrations réintégrées au seed principal (chantier 5, réparation) :
// ces contenus vivaient dans d'anciens fichiers jamais appelés, donc
// absents de toute base créée par `npm run db:seed`.
// ---------------------------------------------------------------------------

/** Contrôle des liens effectué le 2026-10-11 (réponse HTTP 200). 403/000 = non joignable depuis l'environnement : à vérifier. */
const LINK_OK = new Set(["msa", "caf", "mairie", "ccas", "france-travail", "mission-locale", "cap-emploi", "guichet-unique", "france-travail-spectacle", "guso", "audiens", "afdas", "thalie-sante", "assurance-retraite", "agirc-arrco", "info-retraite", "action-logement", "adil", "mdph", "personnes-agees", "mon-compte-formation", "crous", "impots", "france-titres", "point-justice", "france-services", "mes-droits-sociaux"]);
const CHECKED_AT = new Date("2026-10-11T12:00:00Z");

/** Migrations de marque non destructives (aucune ligne supprimée). */
async function rebrandData(db: NodePgDatabase) {
  await db.execute(sql`update users set email = replace(email, '@msa-demo.fr', '@aime-demo.fr') where email like '%@msa-demo.fr'`);
  await db.execute(sql`update cases set reference = replace(reference, 'MSA-', 'DOS-') where reference like 'MSA-%'`);
  await db.execute(sql`update messages set body = replace(replace(replace(body, 'bureau MSA', 'équipe d''accompagnement'), 'caisse MSA', 'équipe d''accompagnement'), 'MSA-20', 'DOS-20'), subject = replace(coalesce(subject,''), 'bureau MSA', 'équipe d''accompagnement')`);
  await db.execute(sql`update case_events set message = replace(replace(replace(message, 'bureau MSA', 'équipe d''accompagnement'), 'caisse MSA', 'équipe d''accompagnement'), 'MSA-20', 'DOS-20')`);
  await db.execute(sql`update notifications set title = replace(replace(title, 'bureau MSA', 'équipe d''accompagnement'), 'caisse MSA', 'équipe d''accompagnement'), body = replace(replace(replace(body, 'bureau MSA', 'équipe d''accompagnement'), 'caisse MSA', 'équipe d''accompagnement'), 'MSA-20', 'DOS-20')`);
}


export async function seedAimeIfEmpty(db: NodePgDatabase) {
  const [any] = await db.select({ id: organisms.id }).from(organisms).limit(1);
  if (!any) {
    await db.insert(organisms).values(ORGANISMS_SEED.map((o) => ({
      slug: o.slug, name: o.name, category: o.category, role: o.role, audience: o.audience, url: o.url,
      source: o.contentSource ?? o.url,
      linkStatus: LINK_OK.has(o.slug) ? "verifie" : "a_verifier",
      contentStatus: o.contentSource ? "verifie" : "a_verifier",
      verifiedAt: LINK_OK.has(o.slug) ? CHECKED_AT : null,
    })));
  }
  const [demo] = await db.select({ id: journeys.id }).from(journeys).where(eq(journeys.isDemo, true)).limit(1);
  if (demo) return false;
  const jean = (await db.select({ id: users.id }).from(users).where(eq(users.email, "jean.dupont@exemple.fr")).limit(1))[0]?.id;
  const tom = (await db.select({ id: users.id }).from(users).where(eq(users.email, "tom.leroy@exemple.fr")).limit(1))[0]?.id;
  const [project] = await db.select().from(projects).where(and(like(projects.title, "Exemple · Fête d'été%"))).limit(1);
  if (!jean || !project) return false;
  const answers = { event_type: "village", organizer_nature: "entreprise", date: project.startsAt.toISOString().slice(0, 10), horaires: "11 h – 23 h", lieu: project.city, acces: "public", public: "80", buvette: "oui", discipline: "Musique", budget: "600", technique: "Grange couverte, 2 prises" };
  const def = SITUATION_BY_KEY.get("evenement")!;
  const rules = def.build(answers);
  const [j] = await db.insert(journeys).values({
    userId: jean, situation: "evenement", title: `Événement à ${project.city} (exemple fictif)`, answers, status: "en_cours", projectId: project.id, rulesVersion: RULES_VERSION, isDemo: true,
    summary: "Exemple fictif : fête d'été à la ferme, ouverte au public, environ 80 personnes, buvette, recherche d'un musicien.",
  }).returning({ id: journeys.id });
  await db.insert(journeyTasks).values(rules.map((r, i) => ({ journeyId: j.id, kind: r.kind, label: r.label, detail: r.detail ?? "", reason: r.reason, organismSlugs: r.organisms ?? [], officialUrl: r.officialUrl ?? null, frameworkFlag: r.frameworkFlag ?? null, sortOrder: i, status: i === 0 ? ("pret" as const) : ("a_preparer" as const) })));
  await db.insert(journeyEvents).values([{ journeyId: j.id, actorId: jean, message: "Démarche commencée (exemple fictif)." }, { journeyId: j.id, actorId: jean, message: `Plan préparé avec les règles ${RULES_VERSION}. Projet relié.` }]);
  if (tom) await db.insert(artistEngagements).values({ journeyId: j.id, projectId: project.id, organizerId: jean, artistId: tom, eventDate: project.startsAt, requestMessage: "Exemple fictif : concert acoustique en fin de journée, dans la grange.", isDemo: true });
  return true;
}

/**
 * Visite guidée : le compte de démonstration doit montrer un espace vivant,
 * pas une coquille vide. Données entièrement fictives, datées par rapport au
 * jour du seed pour rester fraîches : un parcours « difficultés de paiement »
 * transmis au bureau (dossier avec pièce attendue + rendez-vous confirmé), un
 * parcours mariage avec son projet, ses invités, son budget et ses tables,
 * et un document d'exemple. Idempotent : ne fait rien si le compte a déjà
 * des parcours.
 */
export async function seedVisiteGuideeIfEmpty(db: NodePgDatabase) {
  const [demo] = await db.select({ id: users.id }).from(users).where(eq(users.email, "demo@aime-demo.fr")).limit(1);
  if (!demo) return false;
  const [deja] = await db.select({ id: journeys.id }).from(journeys).where(eq(journeys.userId, demo.id)).limit(1);
  if (deja) return false;
  const [agent] = await db.select({ id: users.id, officeId: users.officeId }).from(users).where(eq(users.email, "agent.beauce@aime-demo.fr")).limit(1);
  const [procDifficultes] = await db.select({ id: procedureTypes.id }).from(procedureTypes).where(eq(procedureTypes.slug, "difficultes-paiement")).limit(1);
  const now = new Date();

  // --- Parcours « Difficultés de paiement » (factures), quelques étapes déjà faites
  const defPaiement = SITUATION_BY_KEY.get("paiement")!;
  const repPaiement: Record<string, string> = { quoi: "factures", depuis: "quelques_mois", evenement: "baisse_revenus", relances: "oui_sans_procedure", aides: "non" };
  const reglesPaiement = defPaiement.build(repPaiement);
  const [jp] = await db.insert(journeys).values({
    userId: demo.id, situation: "paiement", title: defPaiement.short, answers: repPaiement, status: "en_cours",
    rulesVersion: RULES_VERSION, isDemo: true,
    summary: "Démonstration fictive : des factures d'énergie et de téléphone devenues difficiles à payer après une baisse de revenus.",
  }).returning({ id: journeys.id });
  await db.insert(journeyTasks).values(reglesPaiement.map((r, i) => ({
    journeyId: jp.id, kind: r.kind, label: r.label, detail: r.detail ?? "", reason: r.reason,
    organismSlugs: r.organisms ?? [], officialUrl: r.officialUrl ?? null, frameworkFlag: r.frameworkFlag ?? null,
    dueAt: computeDueAt(r, repPaiement, now), dueKind: r.due ? (r.due.official ? "officielle" as const : "personnelle" as const) : null, dueSource: r.due?.source ?? null,
    sortOrder: i, status: (i === 0 ? "termine" : "a_preparer") as "termine" | "a_preparer",
  })));
  await db.insert(journeyEvents).values([
    { journeyId: jp.id, actorId: demo.id, message: "Démarche commencée (visite guidée, exemple fictif)." },
    { journeyId: jp.id, actorId: demo.id, message: `Plan préparé avec les règles ${RULES_VERSION}.` },
  ]);

  // --- Le même parcours, devenu dossier au bureau (pièce attendue) + rendez-vous confirmé
  if (procDifficultes) {
    const [dossier] = await db.insert(cases).values({
      reference: "MSA-2026-900101",
      memberId: demo.id, procedureTypeId: procDifficultes.id, journeyId: jp.id,
      officeId: agent?.officeId ?? null, assignedCaseworkerId: agent?.id ?? null,
      status: "piece_manquante", title: "Difficultés de paiement : être accompagné pour s'en sortir",
      data: { nature: "Factures (énergie, eau, téléphone)", depuis: "Quelques mois", relances: "Oui, sans procédure", attente: "Être aidé à demander des échéanciers et à vérifier mes droits." },
      requestedDocuments: ["Dernier avis d'imposition"], submittedAt: now,
    }).returning({ id: cases.id });
    await db.insert(caseEvents).values([
      { caseId: dossier.id, actorId: demo.id, type: "creation", message: "Parcours transmis à votre bureau depuis « Mon espace » (visite guidée, exemple fictif)." },
      { caseId: dossier.id, actorId: agent?.id ?? null, type: "changement_statut", message: "Votre bureau a bien reçu votre parcours. Pour instruire les demandes d'échéanciers, il attend votre dernier avis d'imposition : déposez-le dans le dossier quand vous l'avez." },
    ]);
    const rdv = new Date(now.getTime() + 9 * DAY);
    rdv.setHours(10, 30, 0, 0);
    await db.insert(appointments).values({
      memberId: demo.id, officeId: agent?.officeId ?? null, caseworkerId: agent?.id ?? null, caseId: dossier.id,
      reason: "Faire le point sur les factures et les aides possibles", requestedSlot: rdv, status: "confirmee",
      notes: "Rendez-vous de démonstration (fictif).",
    });
  }

  // --- Un document d'exemple, fictif et marqué comme tel
  const contenuDoc = "Document fictif de la visite guidée — aucune valeur, aucun document réel.\n\nAvis d'imposition 2025 (exemple)\nFoyer : visiteur de démonstration AIME®\nCe fichier sert uniquement à montrer l'espace « Mes documents » pendant la visite.";
  await db.insert(documents).values({
    ownerId: demo.id, category: "revenus", filename: "avis-imposition-2025-fictif.txt", mimeType: "text/plain",
    sizeBytes: Buffer.byteLength(contenuDoc), content: Buffer.from(contenuDoc), uploadedById: demo.id,
  });

  // --- Parcours mariage + projet complet (invités, budget, plan de table)
  const dateMariage = new Date(now.getTime() + 240 * DAY);
  while (dateMariage.getDay() !== 6) dateMariage.setDate(dateMariage.getDate() + 1);
  dateMariage.setHours(12, 0, 0, 0);
  const defMariage = SITUATION_BY_KEY.get("mariage")!;
  const repMariage: Record<string, string> = { date: dateMariage.toISOString().slice(0, 10), lieu: "Vendôme", invites: "85", ceremonie: "laique", contrat: "non", salle: "salle_communale", repas: "traiteur", musique: "groupe", photo: "pro", budget: "12000" };
  const [projet] = await db.insert(projects).values({
    ownerId: demo.id, title: "Mariage à Vendôme (démonstration)", intention: "Mariage fictif de la visite guidée : cérémonie laïque dans un jardin, une centaine de proches, des prestataires du coin.",
    city: "Vendôme", lat: "47.79", lng: "1.07", startsAt: dateMariage, endsAt: null, universes: ["arts"],
    program: [{ time: "15 h", label: "Cérémonie laïque dans le jardin" }, { time: "16 h", label: "Vin d'honneur" }, { time: "19 h", label: "Dîner et soirée dansante" }],
    status: "ouvert", isDemo: true,
  }).returning({ id: projects.id });
  await db.insert(projectMembers).values({ projectId: projet.id, userId: demo.id, role: "organisateur", status: "accepte" });
  // Les fiances de la démo : Camille et Simon
  const [jm] = await db.insert(journeys).values({
    userId: demo.id, situation: "mariage", title: "Mariage à Vendôme", answers: repMariage, status: "en_cours",
    projectId: projet.id, rulesVersion: RULES_VERSION, isDemo: true,
    summary: "Démonstration fictive : le mariage de Camille et Simon, préparé ici de la mairie aux remerciements.",
  }).returning({ id: journeys.id });
  const reglesMariage = defMariage.build(repMariage);
  await db.insert(journeyTasks).values(reglesMariage.map((r, i) => ({
    journeyId: jm.id, kind: r.kind, label: r.label, detail: r.detail ?? "", reason: r.reason,
    organismSlugs: r.organisms ?? [], officialUrl: r.officialUrl ?? null, frameworkFlag: r.frameworkFlag ?? null,
    dueAt: computeDueAt(r, repMariage, now), dueKind: r.due ? (r.due.official ? "officielle" as const : "personnelle" as const) : null, dueSource: r.due?.source ?? null,
    sortOrder: i, status: (i === 0 ? "termine" : i === 1 ? "pret" : "a_preparer") as "termine" | "pret" | "a_preparer",
  })));
  await db.insert(journeyEvents).values([
    { journeyId: jm.id, actorId: demo.id, message: "Démarche commencée (visite guidée, exemple fictif)." },
    { journeyId: jm.id, actorId: demo.id, message: `Plan préparé avec les règles ${RULES_VERSION}. Projet relié.` },
  ]);
  await db.insert(weddingSettings).values({ projectId: projet.id, envelopeCents: 1200000 });
  const [tableHonneur, tableAmis] = await db.insert(weddingTables).values([
    { projectId: projet.id, name: "Table d'honneur", capacity: 8 },
    { projectId: projet.id, name: "Amis de longue date", capacity: 10 },
  ]).returning({ id: weddingTables.id });
  await db.insert(weddingGuests).values([
    { projectId: projet.id, name: "Famille Rochefort — les parents de Camille", persons: 4, groupe: "famille", status: "confirme", note: "", tableId: tableHonneur.id },
    { projectId: projet.id, name: "Famille Aubry — les parents de Simon", persons: 3, groupe: "famille", status: "confirme", note: "1 enfant", tableId: tableHonneur.id },
    { projectId: projet.id, name: "Les amis de la fac", persons: 6, groupe: "amis", status: "invite", note: "", tableId: tableAmis.id },
    { projectId: projet.id, name: "Collègues de Simon", persons: 5, groupe: "travail", status: "peut_etre", note: "" },
    { projectId: projet.id, name: "Cousins éloignés", persons: 4, groupe: "famille", status: "a_inviter", note: "Adresses à retrouver" },
  ]);
  await db.insert(weddingBudgetItems).values([
    { projectId: projet.id, label: "Salle des fêtes de Vendôme — location", category: "lieu", estimatedCents: 60000, actualCents: 60000, settled: true },
    { projectId: projet.id, label: "Traiteur — menu pour 85 convives (devis)", category: "repas", estimatedCents: 420000, actualCents: null, settled: false },
    { projectId: projet.id, label: "Groupe de musique — devis demandé", category: "musique", estimatedCents: 110000, actualCents: null, settled: false },
    { projectId: projet.id, label: "Photographe — reportage journée", category: "photo", estimatedCents: 140000, actualCents: null, settled: false },
  ]);
  console.log("Visite guidée : espace de démonstration peuplé (parcours paiement + dossier + mariage).");
  return true;
}

/** Met à niveau les anciennes annonces (univers et type de publication) sans rien supprimer. */
async function normalizeLegacyListings(db: NodePgDatabase) {
  const rows = await db.select({ id: communityListings.id, category: communityListings.category, action: communityListings.action, universes: communityListings.universes })
    .from(communityListings);
  for (const row of rows) {
    if (row.universes.length === 0) {
      await db.update(communityListings).set({ universes: defaultUniverses(row.category), publicationType: row.action === "cherche" ? "besoin" : "proposition" }).where(eq(communityListings.id, row.id));
    }
  }
}

/** Ajoute les profils, annonces, projet et cercle de démonstration (tous marqués fictifs). */
export async function seedLmaDemoIfEmpty(db: NodePgDatabase) {
  await normalizeLegacyListings(db);
  const [already] = await db.select({ id: users.id }).from(users).where(eq(users.email, "tom.leroy@exemple.fr")).limit(1);
  if (already) return false;

  const members = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.role, "membre"));
  const byEmail = (email: string) => members.find((m) => m.email === email)?.id;
  const jean = byEmail("jean.dupont@exemple.fr");
  const marie = byEmail("marie.lefevre@exemple.fr");
  const paul = byEmail("paul.martin@exemple.fr");
  const lucas = byEmail("lucas.moreau@exemple.fr");
  const amelie = byEmail("amelie.roux@exemple.fr");
  if (!jean || !marie || !paul) { console.warn("[demo] Comptes membres de base absents : démonstration Le Monde Aime ignorée."); return false; }

  const pw = await bcrypt.hash("Demo1234!", 10);
  const base = { passwordHash: pw, role: "membre" as const, onboardingCompleted: true, isDemo: true, profileVisible: true, birthDate: "1985-05-14" };
  const [tom, odette, veillees] = await db.insert(users).values([
    { ...base, email: "tom.leroy@exemple.fr", fullName: "Tom Leroy", displayName: "Tom, musicien", bio: "Guitariste et accordéoniste, j'anime bals, veillées et fêtes de village. Fiche fictive de démonstration.", activities: ["Musicien", "Technicien son", "Parent"], universes: ["arts"], offersText: "Concerts acoustiques, sonorisation légère", needsText: "Un lieu pour répéter", transmitText: "L'accordéon", profileCity: "Chartres", profileLat: "48.44", profileLng: "1.52", travelRadiusKm: 60, availabilityNote: "Week-ends et soirées d'été" } as never,
    { ...base, email: "odette.lambert@exemple.fr", fullName: "Odette Lambert", displayName: "Odette", bio: "Couturière à la retraite, j'aime transmettre les gestes simples pour réparer et créer. Fiche fictive de démonstration.", activities: ["Couturière", "Grand-mère", "Bénévole"], universes: ["savoirs"], offersText: "Ateliers couture, retouches", transmitText: "La couture et la réparation de vêtements", profileCity: "Chartres", profileLat: "48.47", profileLng: "1.46", travelRadiusKm: 20, availabilityNote: "Mercredis après-midi" } as never,
    { ...base, email: "veillees@exemple.fr", fullName: "Association Les Veillées de Beauce", displayName: "Association Les Veillées de Beauce", bio: "Association locale fictive : veillées, contes et ateliers entre générations.", activities: ["Association", "Animation culturelle"], universes: ["arts", "savoirs"], offersText: "Salle pour répéter, ateliers intergénérationnels", needsText: "Bénévoles pour l'été", transmitText: "Contes et recettes de la Beauce", profileCity: "Chartres", profileLat: "48.41", profileLng: "1.55", travelRadiusKm: 30, availabilityNote: "Week-ends" } as never,
  ]).returning({ id: users.id });

  // Profils des comptes de démonstration existants (uniquement s'ils n'ont pas encore de nom d'affichage).
  const enrich = async (id: number | undefined, set: Partial<typeof users.$inferInsert>) => {
    if (!id) return;
    await db.update(users).set({ isDemo: true, ...set }).where(and(eq(users.id, id), isNull(users.displayName)));
  };
  await enrich(jean, { displayName: "Ferme des Blés — Jean", bio: "Agriculteur en Beauce : farine à la meule, accueil à la ferme et fête d'été. Fiche fictive.", activities: ["Agriculteur", "Parent", "Bénévole"], universes: ["terre", "savoirs"], offersText: "Farine, huile de colza, accueil à la ferme", needsText: "Une sono pour la fête", transmitText: "Le travail du blé", profileVisible: true, profileCity: "Chartres", profileLat: "48.45", profileLng: "1.50", travelRadiusKm: 30, availabilityNote: "Soirées et week-ends" });
  await enrich(marie, { displayName: "Ferme des Herbages — Marie", bio: "Exploitante en Bretagne : légumes, œufs et pain au levain. Fiche fictive.", activities: ["Exploitante", "Boulangère"], universes: ["terre"], offersText: "Légumes, œufs, pain", profileVisible: true, profileCity: "Saint-Brieuc", profileLat: "48.51", profileLng: "-2.76", travelRadiusKm: 30 });
  await enrich(paul, { displayName: "Paul", bio: "Retraité jardinier et conteur. Fiche fictive.", activities: ["Retraité", "Jardinier", "Conteur"], universes: ["savoirs", "terre"], transmitText: "Le greffage des arbres fruitiers et les contes", profileVisible: true, profileCity: "Chartres", profileLat: "48.46", profileLng: "1.47", travelRadiusKm: 15 });
  await enrich(lucas, { displayName: "Lucas", bio: "Profil volontairement non affiché sur la carte (exemple de discrétion).", activities: ["Étudiant", "Coup de main à vélo"], profileVisible: false });
  await enrich(amelie, { displayName: "Amélie — maraîchage", bio: "Maraîchère près de Nantes. Fiche fictive.", activities: ["Maraîchère"], universes: ["terre"], offersText: "Paniers de légumes, miel", profileVisible: true, profileCity: "Nantes", profileLat: "47.24", profileLng: "-1.53" });

  await db.insert(artistProfiles).values({
    userId: tom.id, disciplines: ["Musique", "Son et lumière"],
    presentation: "Duo acoustique guitare et accordéon : répertoire populaire, bals et veillées. (Fiche fictive de démonstration)",
    zoneNote: "Eure-et-Loir et départements voisins", availabilityNote: "Week-ends et soirées d'été, réservation un mois à l'avance",
    techSheet: "Durée : 2 × 45 minutes.\nBesoins : 2 prises électriques, 3 m × 2 m d'espace couvert.\nSon : sonorisation légère fournie jusqu'à 80 personnes ; au-delà, prévoir une sono complémentaire.\nInstallation : 1 heure.",
  });

  const soon = new Date(Date.now() + 3 * DAY);
  const until = new Date(Date.now() + 45 * DAY);
  const mk = (ownerId: number, v: Partial<typeof communityListings.$inferInsert> & { title: string; description: string; category: typeof communityListings.$inferInsert["category"]; action: typeof communityListings.$inferInsert["action"]; city: string; lat: string; lng: string }) =>
    ({ condition: "sans_objet", quantity: 1, unit: "pièce", attributes: {}, pickupDetails: "À convenir après accord", isDemo: true, ownerId, ...v }) as typeof communityListings.$inferInsert;
  const [lConcert, lCouture, lAtelier] = await db.insert(communityListings).values([
    mk(tom.id, { action: "prestation", category: "arts_rencontres", title: "Exemple · Concert acoustique pour fête ou veillée", description: "Duo guitare et accordéon, 2 × 45 minutes, sonorisation légère comprise. Tarif défini sur devis selon le lieu et la durée.", priceMode: "devis", universes: ["arts"], unit: "prestation", city: "Chartres", lat: "48.44", lng: "1.52", availableFrom: soon, availableUntil: until }),
    mk(odette.id, { action: "transmission", category: "savoirs_transmission", title: "Exemple · Atelier couture : réparer et retoucher ses vêtements", description: "Séance conviviale pour apprendre les gestes de base. Matériel fourni, tous âges accompagnés d'un adulte.", priceMode: "gratuit", universes: ["savoirs"], quantity: 6, unit: "place", city: "Chartres", lat: "48.47", lng: "1.46", availableFrom: soon, availableUntil: until }),
    mk(veillees.id, { action: "transmission", category: "savoirs_transmission", title: "Exemple · Atelier intergénérationnel : contes et recettes de la Beauce", description: "Un après-midi pour partager récits, recettes et chansons entre générations. Les enfants viennent accompagnés de leurs responsables.", priceMode: "gratuit", universes: ["savoirs", "arts"], quantity: 12, unit: "place", city: "Chartres", lat: "48.41", lng: "1.55", availableFrom: soon, availableUntil: until }),
  ]).returning();
  await db.insert(communityListings).values([
    mk(veillees.id, { action: "pret", category: "lieux_espaces", title: "Exemple · Salle des fêtes prêtée pour répéter", description: "Salle de 60 m² disponible en semaine pour les groupes de musique ou de théâtre. Prêt gratuit, remise en état à la fin.", priceMode: "gratuit", universes: ["arts"], city: "Chartres", lat: "48.41", lng: "1.55", availableFrom: soon, availableUntil: until }),
    mk(jean, { action: "vends", category: "produits_locaux", title: "Exemple · Farine paysanne T65 (sachet 2 kg)", description: "Blé de la ferme moulu à la meule de pierre. Retrait à la ferme.", condition: "neuf", priceMode: "prix", price: "4.80", quantity: 25, unit: "sachet", universes: ["terre"], city: "Chartres", lat: "48.45", lng: "1.50" }),
    mk(jean, { action: "cherche", category: "evenementiel", title: "Exemple · Je cherche une sono pour la fête d'été à la ferme", description: "Enceinte et micro pour environ 80 personnes, un samedi de l'été. Sans budget fixé : à discuter.", publicationType: "besoin", priceMode: "prix", universes: ["arts", "terre"], city: "Chartres", lat: "48.45", lng: "1.50" }),
    mk(tom.id, { action: "cherche", category: "lieux_espaces", title: "Exemple · Nous cherchons un lieu pour répéter", description: "Petit groupe de musique, répétitions le soir, environ 10 personnes.", publicationType: "besoin", priceMode: "prix", universes: ["arts"], city: "Chartres", lat: "48.44", lng: "1.52" }),
  ]);

  // ---- Projet partagé : fête d'été à la ferme
  const [project] = await db.insert(projects).values({
    ownerId: jean, title: "Exemple · Fête d'été à la ferme des Blés",
    intention: "Réunir producteurs, musiciens, associations et voisins autour d'une journée à la ferme : repas, concert, atelier entre générations. Projet fictif de démonstration.",
    city: "Chartres", lat: "48.45", lng: "1.50", startsAt: new Date(Date.now() + 20 * DAY), endsAt: new Date(Date.now() + 20 * DAY + 9 * 3_600_000),
    universes: ["terre", "arts", "savoirs"], isDemo: true,
    program: [{ time: "11 h", label: "Accueil et visite de la ferme" }, { time: "13 h", label: "Repas partagé avec les produits locaux" }, { time: "15 h", label: "Atelier couture et contes entre générations" }, { time: "18 h", label: "Concert dans la grange" }],
  }).returning();
  await db.insert(projectMembers).values([
    { projectId: project.id, userId: jean, role: "organisateur", status: "accepte" },
    { projectId: project.id, userId: tom.id, role: "participant", status: "accepte" },
    { projectId: project.id, userId: odette.id, role: "participant", status: "accepte" },
    { projectId: project.id, userId: veillees.id, role: "participant", status: "demande" },
  ]);
  const [needTables, needMusic, needAtelier] = await db.insert(projectNeeds).values([
    { projectId: project.id, text: "tables pliantes", quantity: 3, category: "evenementiel" },
    { projectId: project.id, text: "musicien pour le concert", quantity: 1, category: "arts_rencontres" },
    { projectId: project.id, text: "atelier couture", quantity: 1, category: "savoirs_transmission" },
    { projectId: project.id, text: "pain et légumes pour le repas", quantity: 20, category: "produits_locaux" },
    { projectId: project.id, text: "sono", quantity: 1, category: "evenementiel" },
  ]).returning();

  const [tablesListing] = await db.select().from(communityListings).where(and(eq(communityListings.ownerId, marie), eq(communityListings.action, "loue"))).limit(1);
  const start = new Date(Date.now() + 20 * DAY);
  const end = new Date(Date.now() + 20 * DAY + 9 * 3_600_000);
  const reqs: Array<{ need: number; listing: number; qty: number; status: "demandee" | "reservee"; message: string; period?: boolean }> = [
    { need: needMusic.id, listing: lConcert.id, qty: 1, status: "reservee", message: "Exemple fictif : concert de la fête d'été, confirmé par Tom." },
    { need: needAtelier.id, listing: lCouture.id, qty: 1, status: "demandee", message: "Exemple fictif : pourriez-vous animer l'atelier couture ?" },
  ];
  if (tablesListing) reqs.unshift({ need: needTables.id, listing: tablesListing.id, qty: 3, status: "demandee", message: "Exemple fictif : 3 tables pour le repas partagé.", period: true });
  let n = 1;
  for (const r of reqs) {
    const [created] = await db.insert(communityRequests).values({
      reference: `LMA-DEMO-P${Date.now().toString().slice(-6)}${n++}`, listingId: r.listing, requesterId: jean, quantity: r.qty, message: r.message,
      startsAt: r.period ? start : null, endsAt: r.period ? end : null, projectId: project.id, projectNeedId: r.need, status: r.status,
      ownerConfirmedAt: r.status === "reservee" ? new Date() : null,
    }).returning({ id: communityRequests.id });
    await db.update(projectNeeds).set({ requestId: created.id }).where(eq(projectNeeds.id, r.need));
  }
  void lAtelier;

  // ---- Cercle privé familial
  const [circle] = await db.insert(circles).values({ ownerId: jean, name: "Exemple · Famille Dupont — recettes et souvenirs", kind: "famille", description: "Cercle privé fictif : recettes, photos et récits de famille.", isDemo: true }).returning();
  await db.insert(circleMembers).values([
    { circleId: circle.id, userId: jean, role: "responsable", status: "accepte" },
    { circleId: circle.id, userId: paul, role: "membre", status: "accepte" },
    { circleId: circle.id, userId: marie, role: "membre", status: "invite" },
  ]);
  await db.insert(circlePosts).values([
    { circleId: circle.id, authorId: jean, kind: "recette", title: "La tarte aux pommes de grand-mère", body: "Recette familiale fictive : pâte sablée, pommes de la ferme, un soupçon de cannelle. (Reste privée au cercle.)", visibility: "prive", isDemo: true },
    { circleId: circle.id, authorId: jean, kind: "photo", title: "Album privé du mariage", body: "Contenu privé fictif : jamais visible sur la carte ni dans la recherche.", visibility: "prive", isDemo: true },
    { circleId: circle.id, authorId: paul, kind: "recit", title: "Souvenir d'une moisson d'autrefois", body: "Récit fictif publié par son auteur : « On finissait la journée sous le noyer, avec le pain encore chaud et les histoires du village. »", visibility: "publie", isDemo: true },
  ]);

  void inArray;
  return true;
}

/** Ajoute les exemples Le Monde Aime sans effacer les comptes ou les données existantes. */
export async function seedCommunityDemoIfEmpty(db: NodePgDatabase) {
  const [existing] = await db.select({ id: communityListings.id })
    .from(communityListings).where(eq(communityListings.isDemo, true)).limit(1);
  if (existing) return false;

  const people = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.role, "membre"));
  const findUser = (email: string) => people.find((person) => person.email === email)?.id;
  const jean = findUser("jean.dupont@exemple.fr");
  const marie = findUser("marie.lefevre@exemple.fr");
  const paul = findUser("paul.martin@exemple.fr");
  const lucas = findUser("lucas.moreau@exemple.fr") ?? jean;
  const amelie = findUser("amelie.roux@exemple.fr") ?? marie;
  if (!jean || !marie || !paul || !lucas || !amelie || jean === marie) {
    console.warn("[demo] Comptes membres attendus absents, annonces Le Monde Aime non amorcées.");
    return false;
  }

  const [coat, tables, basket, shoes] = await db.insert(communityListings).values([
    { ownerId: marie, action: "don", category: "besoins_essentiels", title: "Exemple · Manteau d'hiver taille M", description: "Exemple fictif en bon état, lavé et remis en main propre.", condition: "bon_etat", quantity: 2, unit: "manteau", attributes: { size: "M" }, city: "Chartres", lat: "48.45", lng: "1.49", pickupDetails: "Retrait exact à convenir dans la conversation.", isDemo: true },
    { ownerId: marie, action: "loue", category: "evenementiel", title: "Exemple · Tables pliantes pour un événement", description: "Exemple fictif. Location et caution se conviennent directement.", condition: "bon_etat", quantity: 3, unit: "table", price: "15.00", deposit: "30.00", attributes: { eventDetails: "3 tables · démonstration" }, city: "Chartres", lat: "48.45", lng: "1.49", availableFrom: new Date(Date.now() + 24 * 3600000), availableUntil: new Date(Date.now() + 30 * 86400000), pickupDetails: "Retrait à convenir après accord.", isDemo: true },
    { ownerId: amelie, action: "vends", category: "produits_locaux", title: "Exemple · Panier de légumes de saison", description: "Offre fictive, retrait à la ferme après confirmation.", condition: "neuf", quantity: 8, unit: "panier", price: "12.00", attributes: { unit: "panier" }, city: "Nantes", lat: "47.24", lng: "-1.53", availableFrom: new Date(Date.now() + 24 * 3600000), pickupDetails: "Retrait convenu en conversation privée.", isDemo: true },
    { ownerId: paul, action: "don", category: "besoins_essentiels", title: "Exemple · Chaussures de marche pointure 38", description: "Chaussures propres en bon état, annonce fictive.", condition: "bon_etat", quantity: 1, unit: "paire", attributes: { size: "38" }, city: "Chartres", lat: "48.46", lng: "1.47", pickupDetails: "Remise directe à convenir après accord.", isDemo: true },
  ]).returning();

  const [event] = await db.insert(communityEventPlans).values({
    ownerId: jean, title: "Exemple fictif · Repas associatif", eventDate: new Date(Date.now() + 8 * 86400000),
    city: "Chartres", lat: "48.45", lng: "1.49", participants: 30,
    needs: [{ text: "tables pliantes", quantity: 3, category: "evenementiel" }, { text: "verres", quantity: 30, category: "evenementiel" }, { text: "enceinte", quantity: 1, category: "evenementiel" }],
  }).returning();
  const reference = `LMA-DEMO-${Date.now().toString().slice(-8)}`;
  const [request] = await db.insert(communityRequests).values({
    reference, listingId: coat.id, requesterId: jean, quantity: 1,
    message: "Exemple fictif : puis-je passer samedi après-midi ?", eventPlanId: event.id, status: "demandee",
  }).returning();
  await db.insert(communityMessages).values({ requestId: request.id, senderId: jean, body: "Conversation de démonstration. Le propriétaire doit encore répondre." });
  await db.insert(communityRequests).values({
    reference: `${reference}-R`, listingId: shoes.id, requesterId: lucas, quantity: 1,
    message: "Exemple fictif : demande test archivée.", status: "terminee",
    ownerConfirmedAt: new Date(Date.now() - 2 * 86400000), requesterConfirmedAt: new Date(Date.now() - 86400000),
  });
  const [trip] = await db.insert(communityTrips).values({
    ownerId: lucas, startCity: "Chartres", endCity: "Saint-Brieuc", startLat: "48.45", startLng: "1.49",
    endLat: "48.51", endLng: "-2.77", departureAt: new Date(Date.now() + 6 * 86400000),
    transportMode: "vélo", capacity: 1, availableCapacity: 1,
    terms: "Exemple fictif : demande de transport à confirmer par le transporteur.", compensation: "0.00",
  }).returning();
  await db.insert(communityTransportRequests).values({
    tripId: trip.id, requesterId: jean, communityRequestId: request.id,
    description: "Exemple fictif : un petit panier de légumes.", status: "demandee",
  });
  return true;
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
