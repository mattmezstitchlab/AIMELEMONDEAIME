import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  jsonb,
  numeric,
  customType,
  check,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Custom bytea type for storing file contents directly in Postgres.
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const roleEnum = ["membre", "gestionnaire", "administrateur"] as const;
export type Role = (typeof roleEnum)[number];

export const situationEnum = [
  "salarie_agricole",
  "exploitant",
  "employeur",
  "retraite",
  "famille",
] as const;
export type Situation = (typeof situationEnum)[number];

export const caseStatusEnum = [
  "brouillon",
  "envoyee",
  "en_cours",
  "piece_manquante",
  "terminee",
] as const;
export type CaseStatus = (typeof caseStatusEnum)[number];

export const offices = pgTable("offices", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  address: varchar("address", { length: 200 }).notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  postalCode: varchar("postal_code", { length: 10 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  hours: varchar("hours", { length: 200 }).notNull(),
  region: varchar("region", { length: 120 }).notNull(),
  lat: numeric("lat", { precision: 9, scale: 6 }),
  lng: numeric("lng", { precision: 9, scale: 6 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 180 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: varchar("role", { length: 20 }).notNull().$type<Role>(),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    officeId: integer("office_id").references(() => offices.id),
    situation: varchar("situation", { length: 30 }).$type<Situation>(),
    address: varchar("address", { length: 200 }),
    city: varchar("city", { length: 120 }),
    postalCode: varchar("postal_code", { length: 10 }),
    birthDate: varchar("birth_date", { length: 10 }),
    familyStatus: varchar("family_status", { length: 60 }),
    onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
    displayName: varchar("display_name", { length: 80 }),
    bio: varchar("bio", { length: 600 }),
    activities: jsonb("activities").$type<string[]>().notNull().default([]),
    interests: jsonb("interests").$type<string[]>().notNull().default([]),
    universes: jsonb("universes").$type<string[]>().notNull().default([]),
    offersText: varchar("offers_text", { length: 300 }),
    needsText: varchar("needs_text", { length: 300 }),
    transmitText: varchar("transmit_text", { length: 300 }),
    travelRadiusKm: integer("travel_radius_km").notNull().default(20),
    availabilityNote: varchar("availability_note", { length: 300 }),
    profileVisible: boolean("profile_visible").notNull().default(false),
    profileCity: varchar("profile_city", { length: 120 }),
    profileLat: numeric("profile_lat", { precision: 8, scale: 2 }),
    profileLng: numeric("profile_lng", { precision: 8, scale: 2 }),
    isDemo: boolean("is_demo").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)]
);

export const procedureTypes = pgTable("procedure_types", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 40 }).notNull(),
  kind: varchar("kind", { length: 30 }).notNull().default("changement"),
  requiredDocuments: jsonb("required_documents").$type<string[]>().notNull().default([]),
  fields: jsonb("fields").$type<FormFieldDef[]>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
});

export type FormFieldDef = {
  name: string;
  label: string;
  type: "text" | "textarea" | "date" | "select" | "number";
  options?: string[];
  prefillFrom?: string;
  required?: boolean;
};

export const cases = pgTable("cases", {
  id: serial("id").primaryKey(),
  reference: varchar("reference", { length: 30 }).notNull().unique(),
  memberId: integer("member_id")
    .notNull()
    .references(() => users.id),
  procedureTypeId: integer("procedure_type_id")
    .notNull()
    .references(() => procedureTypes.id),
  /** Parcours guidé dont ce dossier est issu (chantier 2, temps 2) : le parcours « devient » dossier. */
  journeyId: integer("journey_id").references(() => journeys.id),
  officeId: integer("office_id").references(() => offices.id),
  assignedCaseworkerId: integer("assigned_caseworker_id").references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().$type<CaseStatus>().default("brouillon"),
  title: varchar("title", { length: 200 }).notNull(),
  data: jsonb("data").$type<Record<string, string>>().notNull().default({}),
  requestedDocuments: jsonb("requested_documents").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
});

export const caseEventTypeEnum = [
  "creation",
  "soumission",
  "changement_statut",
  "message",
  "document_ajoute",
  "affectation",
] as const;

export const caseEvents = pgTable("case_events", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  actorId: integer("actor_id").references(() => users.id),
  type: varchar("type", { length: 30 }).notNull(),
  message: text("message"),
  metadata: jsonb("metadata").$type<Record<string, string>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => users.id),
  caseId: integer("case_id").references(() => cases.id, { onDelete: "set null" }),
  category: varchar("category", { length: 60 }).notNull(),
  filename: varchar("filename", { length: 200 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  content: bytea("content").notNull(),
  isSpecimen: boolean("is_specimen").notNull().default(false),
  uploadedById: integer("uploaded_by_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").references(() => cases.id, { onDelete: "cascade" }),
  officeId: integer("office_id").references(() => offices.id),
  senderId: integer("sender_id")
    .notNull()
    .references(() => users.id),
  recipientId: integer("recipient_id").references(() => users.id),
  subject: varchar("subject", { length: 200 }),
  body: text("body").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentTypeEnum = ["prestation", "remboursement", "cotisation"] as const;

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id")
    .notNull()
    .references(() => users.id),
  type: varchar("type", { length: 20 }).notNull(),
  label: varchar("label", { length: 160 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("verse"),
  reference: varchar("reference", { length: 40 }).notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appointmentStatusEnum = ["demandee", "confirmee", "annulee", "terminee"] as const;

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id")
    .notNull()
    .references(() => users.id),
  officeId: integer("office_id").references(() => offices.id),
  caseworkerId: integer("caseworker_id").references(() => users.id),
  caseId: integer("case_id").references(() => cases.id, { onDelete: "set null" }),
  reason: varchar("reason", { length: 200 }).notNull(),
  requestedSlot: timestamp("requested_slot", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("demandee"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  category: varchar("category", { length: 40 }).notNull(),
  audience: varchar("audience", { length: 60 }).notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  kind: varchar("kind", { length: 20 }).notNull().default("article"),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  isPublished: boolean("is_published").notNull().default(true),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 160 }).notNull(),
  body: text("body").notNull(),
  link: varchar("link", { length: 200 }),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Circuits : fiches de proximité (producteurs, associations) et coups de main
// ---------------------------------------------------------------------------

/** Type d'une fiche. « association » est déclaré pour le circuit à venir. */
export const localPointKindEnum = ["producteur", "presence", "association", "artisan"] as const;
export type LocalPointKind = (typeof localPointKindEnum)[number];

/** Fiche déposée par un adhérent : lieu de production, association ou présence. */
export const localPoints = pgTable("local_points", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 20 }).notNull().$type<LocalPointKind>().default("presence"),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description").notNull().default(""),
  city: varchar("city", { length: 120 }).notNull().default(""),
  lat: numeric("lat", { precision: 9, scale: 6 }).notNull(),
  lng: numeric("lng", { precision: 9, scale: 6 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Produit proposé sur un point local, en retrait sur place. */
export const localProducts = pgTable("local_products", {
  id: serial("id").primaryKey(),
  pointId: integer("point_id")
    .notNull()
    .references(() => localPoints.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description").notNull().default(""),
  category: varchar("category", { length: 60 }).notNull().default("Produit fermier"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 30 }).notNull().default("l'unité"),
  stock: integer("stock").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const localOrderStatusEnum = ["commandee", "prete", "recuperee", "annulee"] as const;
export type LocalOrderStatus = (typeof localOrderStatusEnum)[number];

/** Commande de proximité, retirée sur place (aucun paiement en ligne dans ce prototype). */
export const localOrders = pgTable("local_orders", {
  id: serial("id").primaryKey(),
  reference: varchar("reference", { length: 30 }).notNull().unique(),
  productId: integer("product_id")
    .notNull()
    .references(() => localProducts.id),
  pointId: integer("point_id")
    .notNull()
    .references(() => localPoints.id, { onDelete: "cascade" }),
  buyerId: integer("buyer_id")
    .notNull()
    .references(() => users.id),
  quantity: integer("quantity").notNull().default(1),
  status: varchar("status", { length: 20 }).notNull().$type<LocalOrderStatus>().default("commandee"),
  pickupAt: timestamp("pickup_at", { withTimezone: true }),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const availabilityStatusEnum = ["disponible", "indisponible"] as const;
export type AvailabilityStatus = (typeof availabilityStatusEnum)[number];

/** Mise à disposition d'un jeune pour une mission de proximité (type « livraison »). */
export const workerAvailabilities = pgTable("worker_availabilities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  city: varchar("city", { length: 120 }).notNull().default(""),
  lat: numeric("lat", { precision: 9, scale: 6 }).notNull(),
  lng: numeric("lng", { precision: 9, scale: 6 }).notNull(),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  availabilityNote: text("availability_note").notNull().default(""),
  status: varchar("status", { length: 20 }).notNull().$type<AvailabilityStatus>().default("disponible"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorId: integer("actor_id").references(() => users.id),
  action: varchar("action", { length: 80 }).notNull(),
  entityType: varchar("entity_type", { length: 40 }).notNull(),
  entityId: varchar("entity_id", { length: 40 }),
  metadata: jsonb("metadata").$type<Record<string, string>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Le Monde Aime — entraide indépendante de proximité, sur la même carte
// ---------------------------------------------------------------------------

export const communityActionEnum = ["don", "pret", "loue", "vends", "cherche", "prestation", "transmission"] as const;
export type CommunityAction = (typeof communityActionEnum)[number];
export const communityCategoryEnum = [
  "produits_locaux",
  "besoins_essentiels",
  "objets_materiel",
  "trajets_livraisons",
  "services",
  "evenementiel",
  "arts_rencontres",
  "lieux_espaces",
  "savoirs_transmission",
  "logements",
] as const;
export type CommunityCategory = (typeof communityCategoryEnum)[number];
export const communityListingStatusEnum = ["publiee", "suspendue", "archivee"] as const;
export type CommunityListingStatus = (typeof communityListingStatusEnum)[number];

/** Position volontairement approximative (arrondie avant écriture et affichage). */
export const communityListings = pgTable("community_listings", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 16 }).notNull().$type<CommunityAction>(),
  category: varchar("category", { length: 32 }).notNull().$type<CommunityCategory>(),
  title: varchar("title", { length: 140 }).notNull(),
  description: varchar("description", { length: 600 }).notNull().default(""),
  condition: varchar("condition", { length: 40 }).notNull().default("bon_etat"),
  quantity: integer("quantity").notNull().default(1),
  unit: varchar("unit", { length: 40 }).notNull().default("pièce"),
  price: numeric("price", { precision: 9, scale: 2 }),
  deposit: numeric("deposit", { precision: 9, scale: 2 }),
  attributes: jsonb("attributes").$type<Record<string, string>>().notNull().default({}),
  city: varchar("city", { length: 120 }).notNull(),
  lat: numeric("lat", { precision: 8, scale: 2 }).notNull(),
  lng: numeric("lng", { precision: 8, scale: 2 }).notNull(),
  availableFrom: timestamp("available_from", { withTimezone: true }),
  availableUntil: timestamp("available_until", { withTimezone: true }),
  pickupDetails: varchar("pickup_details", { length: 240 }).notNull().default("Retrait à convenir sur place"),
  photoData: bytea("photo_data"),
  photoMime: varchar("photo_mime", { length: 80 }),
  isDemo: boolean("is_demo").notNull().default(false),
  publicationType: varchar("publication_type", { length: 12 }).notNull().default("proposition"),
  universes: jsonb("universes").$type<string[]>().notNull().default([]),
  priceMode: varchar("price_mode", { length: 10 }).notNull().default("prix"),
  status: varchar("status", { length: 16 }).notNull().$type<CommunityListingStatus>().default("publiee"),
  moderationNote: varchar("moderation_note", { length: 300 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const communityRequestStatusEnum = [
  "demandee", "refusee", "reservee", "remise", "retour_attendu", "retourne", "terminee", "annulee",
] as const;
export type CommunityRequestStatus = (typeof communityRequestStatusEnum)[number];

/** Demande de réservation ; les seules réservations confirmées consomment le stock. */
export const communityRequests = pgTable("community_requests", {
  id: serial("id").primaryKey(),
  reference: varchar("reference", { length: 32 }).notNull().unique(),
  listingId: integer("listing_id").notNull().references(() => communityListings.id),
  requesterId: integer("requester_id").notNull().references(() => users.id),
  quantity: integer("quantity").notNull().default(1),
  message: varchar("message", { length: 500 }).notNull().default(""),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  eventPlanId: integer("event_plan_id"),
  projectId: integer("project_id"),
  projectNeedId: integer("project_need_id"),
  status: varchar("status", { length: 24 }).notNull().$type<CommunityRequestStatus>().default("demandee"),
  ownerConfirmedAt: timestamp("owner_confirmed_at", { withTimezone: true }),
  requesterConfirmedAt: timestamp("requester_confirmed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const communityMessages = pgTable("community_messages", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => communityRequests.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id),
  body: varchar("body", { length: 1200 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const communityTripStatusEnum = ["publie", "suspendu", "archive"] as const;
export const communityTrips = pgTable("community_trips", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: integer("listing_id").references(() => communityListings.id, { onDelete: "set null" }),
  startCity: varchar("start_city", { length: 120 }).notNull(),
  endCity: varchar("end_city", { length: 120 }).notNull(),
  startLat: numeric("start_lat", { precision: 8, scale: 2 }).notNull(),
  startLng: numeric("start_lng", { precision: 8, scale: 2 }).notNull(),
  endLat: numeric("end_lat", { precision: 8, scale: 2 }).notNull(),
  endLng: numeric("end_lng", { precision: 8, scale: 2 }).notNull(),
  departureAt: timestamp("departure_at", { withTimezone: true }).notNull(),
  transportMode: varchar("transport_mode", { length: 40 }).notNull(),
  capacity: integer("capacity").notNull().default(1),
  availableCapacity: integer("available_capacity").notNull().default(1),
  terms: varchar("terms", { length: 400 }).notNull().default(""),
  compensation: numeric("compensation", { precision: 9, scale: 2 }),
  status: varchar("status", { length: 16 }).notNull().$type<"publie" | "suspendu" | "archive">().default("publie"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const communityTransportStatusEnum = ["demandee", "confirmee", "collectee", "remise", "terminee", "refusee", "annulee"] as const;
export type CommunityTransportStatus = (typeof communityTransportStatusEnum)[number];
export const communityTransportRequests = pgTable("community_transport_requests", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => communityTrips.id),
  requesterId: integer("requester_id").notNull().references(() => users.id),
  communityRequestId: integer("community_request_id").references(() => communityRequests.id),
  description: varchar("description", { length: 300 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().$type<CommunityTransportStatus>().default("demandee"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const communityEventPlans = pgTable("community_event_plans", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 140 }).notNull(),
  eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  lat: numeric("lat", { precision: 8, scale: 2 }).notNull(),
  lng: numeric("lng", { precision: 8, scale: 2 }).notNull(),
  participants: integer("participants").notNull().default(1),
  needs: jsonb("needs").$type<Array<{ text: string; quantity: number; category: string }>>().notNull().default([]),
  status: varchar("status", { length: 16 }).notNull().default("actif"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const communitySavedSearches = pgTable("community_saved_searches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 32 }).$type<CommunityCategory>(),
  city: varchar("city", { length: 120 }).notNull().default(""),
  centerLat: numeric("center_lat", { precision: 8, scale: 2 }),
  centerLng: numeric("center_lng", { precision: 8, scale: 2 }),
  radiusKm: integer("radius_km").notNull().default(30),
  keywords: varchar("keywords", { length: 180 }).notNull().default(""),
  criteria: jsonb("criteria").$type<Record<string, string>>().notNull().default({}),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const communityReports = pgTable("community_reports", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => communityListings.id, { onDelete: "cascade" }),
  reporterId: integer("reporter_id").notNull().references(() => users.id),
  reason: varchar("reason", { length: 50 }).notNull(),
  details: varchar("details", { length: 500 }).notNull().default(""),
  status: varchar("status", { length: 16 }).notNull().default("en_attente"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});


// ---------------------------------------------------------------------------
// Le Monde Aime — profils, projets partagés, espace artiste, cercles privés
// ---------------------------------------------------------------------------

export const universeEnum = ["terre", "arts", "savoirs"] as const;
export type Universe = (typeof universeEnum)[number];

export const profilePhotos = pgTable("profile_photos", {
  userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  data: bytea("data").notNull(),
  mime: varchar("mime", { length: 80 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const artistProfiles = pgTable("artist_profiles", {
  userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  disciplines: jsonb("disciplines").$type<string[]>().notNull().default([]),
  presentation: varchar("presentation", { length: 800 }).notNull().default(""),
  zoneNote: varchar("zone_note", { length: 200 }).notNull().default(""),
  availabilityNote: varchar("availability_note", { length: 300 }).notNull().default(""),
  techSheet: text("tech_sheet").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 140 }).notNull(),
  intention: varchar("intention", { length: 800 }).notNull().default(""),
  city: varchar("city", { length: 120 }).notNull(),
  lat: numeric("lat", { precision: 8, scale: 2 }).notNull(),
  lng: numeric("lng", { precision: 8, scale: 2 }).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  universes: jsonb("universes").$type<string[]>().notNull().default([]),
  program: jsonb("program").$type<Array<{ time: string; label: string }>>().notNull().default([]),
  status: varchar("status", { length: 16 }).notNull().default("ouvert"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectMembers = pgTable(
  "project_members",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 16 }).notNull().default("participant"),
    status: varchar("status", { length: 12 }).notNull().default("demande"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("project_members_unique").on(table.projectId, table.userId)]
);

export const projectNeeds = pgTable("project_needs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  text: varchar("text", { length: 160 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  category: varchar("category", { length: 32 }).notNull().default("objets_materiel"),
  requestId: integer("request_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectMessages = pgTable("project_messages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id),
  body: varchar("body", { length: 1200 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectDocuments = pgTable("project_documents", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  uploaderId: integer("uploader_id").notNull().references(() => users.id),
  filename: varchar("filename", { length: 200 }).notNull(),
  mime: varchar("mime", { length: 100 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  content: bytea("content").notNull(),
  access: varchar("access", { length: 16 }).notNull().default("membres"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Espace de travail du mariage, adossé au projet partagé créé par le parcours « Nous nous marions ». */
export const weddingSettings = pgTable("wedding_settings", {
  projectId: integer("project_id").primaryKey().references(() => projects.id, { onDelete: "cascade" }),
  envelopeCents: integer("envelope_cents"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const weddingGuestStatusEnum = ["a_inviter", "invite", "confirme", "peut_etre", "decline"] as const;
export type WeddingGuestStatus = (typeof weddingGuestStatusEnum)[number];

export const weddingGuests = pgTable("wedding_guests", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  persons: integer("persons").notNull().default(1),
  groupe: varchar("groupe", { length: 16 }).notNull().default("famille"),
  status: varchar("status", { length: 16 }).notNull().$type<WeddingGuestStatus>().default("a_inviter"),
  note: varchar("note", { length: 200 }).notNull().default(""),
  thanked: boolean("thanked").notNull().default(false),
  tableId: integer("table_id").references(() => weddingTables.id, { onDelete: "set null" }),
  rsvpTokenHash: varchar("rsvp_token_hash", { length: 64 }),
  rsvpExpiresAt: timestamp("rsvp_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("wedding_guests_rsvp_token_hash_unique").on(table.rsvpTokenHash)]);

export const weddingAccessRoleEnum = ["coordination", "temoin"] as const;
export type WeddingAccessRole = (typeof weddingAccessRoleEnum)[number];

/** Liens temporaires et révocables à portée limitée, sans compte membre. */
export const weddingAccessLinks = pgTable(
  "wedding_access_links",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    createdById: integer("created_by_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 80 }).notNull().default("Proche"),
    role: varchar("role", { length: 20 }).notNull().$type<WeddingAccessRole>(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("wedding_access_links_token_hash_unique").on(table.tokenHash),
    index("wedding_access_links_project_idx").on(table.projectId),
    check("wedding_access_links_role_check", sql`${table.role} in ('coordination', 'temoin')`),
  ]
);

/** Tables du plan de table : seuls les foyers confirmés y prennent place. */
export const weddingTables = pgTable("wedding_tables", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 60 }).notNull(),
  capacity: integer("capacity"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const weddingBudgetItems = pgTable("wedding_budget_items", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 120 }).notNull(),
  category: varchar("category", { length: 24 }).notNull().default("divers"),
  estimatedCents: integer("estimated_cents").notNull().default(0),
  actualCents: integer("actual_cents"),
  settled: boolean("settled").notNull().default(false),
  note: varchar("note", { length: 200 }).notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const circles = pgTable("circles", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  kind: varchar("kind", { length: 16 }).notNull().default("groupe"),
  description: varchar("description", { length: 400 }).notNull().default(""),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const circleMembers = pgTable(
  "circle_members",
  {
    id: serial("id").primaryKey(),
    circleId: integer("circle_id").notNull().references(() => circles.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 16 }).notNull().default("membre"),
    status: varchar("status", { length: 12 }).notNull().default("invite"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("circle_members_unique").on(table.circleId, table.userId)]
);

export const circlePosts = pgTable("circle_posts", {
  id: serial("id").primaryKey(),
  circleId: integer("circle_id").notNull().references(() => circles.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => users.id),
  kind: varchar("kind", { length: 12 }).notNull().default("recit"),
  title: varchar("title", { length: 140 }).notNull(),
  body: text("body").notNull().default(""),
  photoData: bytea("photo_data"),
  photoMime: varchar("photo_mime", { length: 80 }),
  visibility: varchar("visibility", { length: 8 }).notNull().default("prive"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Signalements des contenus publics autres que les annonces (projets, récits publiés). */
export const contentReports = pgTable("content_reports", {
  id: serial("id").primaryKey(),
  targetType: varchar("target_type", { length: 12 }).notNull(),
  targetId: integer("target_id").notNull(),
  reporterId: integer("reporter_id").notNull().references(() => users.id),
  reason: varchar("reason", { length: 50 }).notNull(),
  details: varchar("details", { length: 500 }).notNull().default(""),
  status: varchar("status", { length: 16 }).notNull().default("en_attente"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// AIME® — Accompagnement des démarches et moments de vie (orientation + préparation)
// ---------------------------------------------------------------------------

/** Annuaire administrable des organismes externes référencés (jamais présentés comme partenaires). */
export const organisms = pgTable("organisms", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 60 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 40 }).notNull(),
  role: text("role").notNull(),
  audience: varchar("audience", { length: 300 }).notNull().default(""),
  territory: varchar("territory", { length: 120 }).notNull().default("National"),
  url: varchar("url", { length: 300 }).notNull(),
  source: varchar("source", { length: 300 }).notNull().default(""),
  linkStatus: varchar("link_status", { length: 16 }).notNull().default("a_verifier"),
  contentStatus: varchar("content_status", { length: 16 }).notNull().default("a_verifier"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Une démarche d'accompagnement : propriété exclusive de son auteur. */
export const journeys = pgTable("journeys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  situation: varchar("situation", { length: 30 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  answers: jsonb("answers").$type<Record<string, string>>().notNull().default({}),
  summary: text("summary").notNull().default(""),
  status: varchar("status", { length: 16 }).notNull().default("questionnaire"),
  projectId: integer("project_id"),
  rulesVersion: varchar("rules_version", { length: 20 }).notNull().default(""),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const journeyTaskStatusEnum = ["a_preparer", "pret", "effectue_declare", "attente_reponse", "a_completer", "termine"] as const;
export type JourneyTaskStatus = (typeof journeyTaskStatusEnum)[number];

export const journeyTasks = pgTable("journey_tasks", {
  id: serial("id").primaryKey(),
  journeyId: integer("journey_id").notNull().references(() => journeys.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 10 }).notNull().default("action"),
  label: varchar("label", { length: 200 }).notNull(),
  detail: text("detail").notNull().default(""),
  reason: text("reason").notNull().default(""),
  organismSlugs: jsonb("organism_slugs").$type<string[]>().notNull().default([]),
  officialUrl: varchar("official_url", { length: 300 }),
  frameworkFlag: varchar("framework_flag", { length: 20 }),
  status: varchar("status", { length: 20 }).notNull().$type<JourneyTaskStatus>().default("a_preparer"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  dueKind: varchar("due_kind", { length: 12 }),
  dueSource: varchar("due_source", { length: 300 }),
  documentId: integer("document_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const journeyEvents = pgTable("journey_events", {
  id: serial("id").primaryKey(),
  journeyId: integer("journey_id").notNull().references(() => journeys.id, { onDelete: "cascade" }),
  actorId: integer("actor_id").references(() => users.id),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const engagementStatusEnum = ["demande_envoyee", "proposition_recue", "devis_accepte", "contrat_signe_declare", "embauche_declaree", "refusee", "annulee"] as const;
export type EngagementStatus = (typeof engagementStatusEnum)[number];

/** Engagement d'un artiste pour un événement : chaque étape est explicite et attribuée. */
export const artistEngagements = pgTable("artist_engagements", {
  id: serial("id").primaryKey(),
  journeyId: integer("journey_id").references(() => journeys.id, { onDelete: "set null" }),
  projectId: integer("project_id"),
  organizerId: integer("organizer_id").notNull().references(() => users.id),
  artistId: integer("artist_id").notNull().references(() => users.id),
  listingId: integer("listing_id"),
  eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
  requestMessage: varchar("request_message", { length: 800 }).notNull().default(""),
  proposalMode: varchar("proposal_mode", { length: 10 }),
  proposalAmount: numeric("proposal_amount", { precision: 9, scale: 2 }),
  proposalFramework: varchar("proposal_framework", { length: 16 }),
  proposalNote: varchar("proposal_note", { length: 800 }),
  contractDocumentId: integer("contract_document_id"),
  status: varchar("status", { length: 24 }).notNull().$type<EngagementStatus>().default("demande_envoyee"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Partage explicite et révocable d'un document personnel, à une personne ou à un projet. */
export const documentShares = pgTable("document_shares", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  granteeUserId: integer("grantee_user_id").references(() => users.id),
  projectId: integer("project_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});
