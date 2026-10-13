CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"office_id" integer,
	"caseworker_id" integer,
	"case_id" integer,
	"reason" varchar(200) NOT NULL,
	"requested_slot" timestamp with time zone NOT NULL,
	"status" varchar(20) DEFAULT 'demandee' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(140) NOT NULL,
	"title" varchar(200) NOT NULL,
	"category" varchar(40) NOT NULL,
	"audience" varchar(60) NOT NULL,
	"summary" text NOT NULL,
	"content" text NOT NULL,
	"kind" varchar(20) DEFAULT 'article' NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "artist_engagements" (
	"id" serial PRIMARY KEY NOT NULL,
	"journey_id" integer,
	"project_id" integer,
	"organizer_id" integer NOT NULL,
	"artist_id" integer NOT NULL,
	"listing_id" integer,
	"event_date" timestamp with time zone NOT NULL,
	"request_message" varchar(800) DEFAULT '' NOT NULL,
	"proposal_mode" varchar(10),
	"proposal_amount" numeric(9, 2),
	"proposal_framework" varchar(16),
	"proposal_note" varchar(800),
	"contract_document_id" integer,
	"status" varchar(24) DEFAULT 'demande_envoyee' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artist_profiles" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"disciplines" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"presentation" varchar(800) DEFAULT '' NOT NULL,
	"zone_note" varchar(200) DEFAULT '' NOT NULL,
	"availability_note" varchar(300) DEFAULT '' NOT NULL,
	"tech_sheet" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_id" integer,
	"action" varchar(80) NOT NULL,
	"entity_type" varchar(40) NOT NULL,
	"entity_id" varchar(40),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"actor_id" integer,
	"type" varchar(30) NOT NULL,
	"message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference" varchar(30) NOT NULL,
	"member_id" integer NOT NULL,
	"procedure_type_id" integer NOT NULL,
	"office_id" integer,
	"assigned_caseworker_id" integer,
	"status" varchar(20) DEFAULT 'brouillon' NOT NULL,
	"title" varchar(200) NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"requested_documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	CONSTRAINT "cases_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "circle_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"circle_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" varchar(16) DEFAULT 'membre' NOT NULL,
	"status" varchar(12) DEFAULT 'invite' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "circle_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"circle_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"kind" varchar(12) DEFAULT 'recit' NOT NULL,
	"title" varchar(140) NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"photo_data" "bytea",
	"photo_mime" varchar(80),
	"visibility" varchar(8) DEFAULT 'prive' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "circles" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"kind" varchar(16) DEFAULT 'groupe' NOT NULL,
	"description" varchar(400) DEFAULT '' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_event_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"title" varchar(140) NOT NULL,
	"event_date" timestamp with time zone NOT NULL,
	"city" varchar(120) NOT NULL,
	"lat" numeric(8, 2) NOT NULL,
	"lng" numeric(8, 2) NOT NULL,
	"participants" integer DEFAULT 1 NOT NULL,
	"needs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar(16) DEFAULT 'actif' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"action" varchar(16) NOT NULL,
	"category" varchar(32) NOT NULL,
	"title" varchar(140) NOT NULL,
	"description" varchar(600) DEFAULT '' NOT NULL,
	"condition" varchar(40) DEFAULT 'bon_etat' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit" varchar(40) DEFAULT 'pièce' NOT NULL,
	"price" numeric(9, 2),
	"deposit" numeric(9, 2),
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"city" varchar(120) NOT NULL,
	"lat" numeric(8, 2) NOT NULL,
	"lng" numeric(8, 2) NOT NULL,
	"available_from" timestamp with time zone,
	"available_until" timestamp with time zone,
	"pickup_details" varchar(240) DEFAULT 'Retrait à convenir sur place' NOT NULL,
	"photo_data" "bytea",
	"photo_mime" varchar(80),
	"is_demo" boolean DEFAULT false NOT NULL,
	"publication_type" varchar(12) DEFAULT 'proposition' NOT NULL,
	"universes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"price_mode" varchar(10) DEFAULT 'prix' NOT NULL,
	"status" varchar(16) DEFAULT 'publiee' NOT NULL,
	"moderation_note" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"body" varchar(1200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"reporter_id" integer NOT NULL,
	"reason" varchar(50) NOT NULL,
	"details" varchar(500) DEFAULT '' NOT NULL,
	"status" varchar(16) DEFAULT 'en_attente' NOT NULL,
	"reviewed_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference" varchar(32) NOT NULL,
	"listing_id" integer NOT NULL,
	"requester_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"message" varchar(500) DEFAULT '' NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"event_plan_id" integer,
	"project_id" integer,
	"project_need_id" integer,
	"status" varchar(24) DEFAULT 'demandee' NOT NULL,
	"owner_confirmed_at" timestamp with time zone,
	"requester_confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_requests_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "community_saved_searches" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"category" varchar(32),
	"city" varchar(120) DEFAULT '' NOT NULL,
	"center_lat" numeric(8, 2),
	"center_lng" numeric(8, 2),
	"radius_km" integer DEFAULT 30 NOT NULL,
	"keywords" varchar(180) DEFAULT '' NOT NULL,
	"criteria" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_transport_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"trip_id" integer NOT NULL,
	"requester_id" integer NOT NULL,
	"community_request_id" integer,
	"description" varchar(300) NOT NULL,
	"status" varchar(20) DEFAULT 'demandee' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_trips" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"listing_id" integer,
	"start_city" varchar(120) NOT NULL,
	"end_city" varchar(120) NOT NULL,
	"start_lat" numeric(8, 2) NOT NULL,
	"start_lng" numeric(8, 2) NOT NULL,
	"end_lat" numeric(8, 2) NOT NULL,
	"end_lng" numeric(8, 2) NOT NULL,
	"departure_at" timestamp with time zone NOT NULL,
	"transport_mode" varchar(40) NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"available_capacity" integer DEFAULT 1 NOT NULL,
	"terms" varchar(400) DEFAULT '' NOT NULL,
	"compensation" numeric(9, 2),
	"status" varchar(16) DEFAULT 'publie' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"target_type" varchar(12) NOT NULL,
	"target_id" integer NOT NULL,
	"reporter_id" integer NOT NULL,
	"reason" varchar(50) NOT NULL,
	"details" varchar(500) DEFAULT '' NOT NULL,
	"status" varchar(16) DEFAULT 'en_attente' NOT NULL,
	"reviewed_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_shares" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"owner_id" integer NOT NULL,
	"grantee_user_id" integer,
	"project_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"case_id" integer,
	"category" varchar(60) NOT NULL,
	"filename" varchar(200) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size_bytes" integer NOT NULL,
	"content" "bytea" NOT NULL,
	"is_specimen" boolean DEFAULT false NOT NULL,
	"uploaded_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journey_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"journey_id" integer NOT NULL,
	"actor_id" integer,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journey_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"journey_id" integer NOT NULL,
	"kind" varchar(10) DEFAULT 'action' NOT NULL,
	"label" varchar(200) NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"organism_slugs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"official_url" varchar(300),
	"framework_flag" varchar(20),
	"status" varchar(20) DEFAULT 'a_preparer' NOT NULL,
	"due_at" timestamp with time zone,
	"due_kind" varchar(12),
	"due_source" varchar(300),
	"document_id" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journeys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"situation" varchar(30) NOT NULL,
	"title" varchar(160) NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"status" varchar(16) DEFAULT 'questionnaire' NOT NULL,
	"project_id" integer,
	"rules_version" varchar(20) DEFAULT '' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "local_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference" varchar(30) NOT NULL,
	"product_id" integer NOT NULL,
	"point_id" integer NOT NULL,
	"buyer_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"status" varchar(20) DEFAULT 'commandee' NOT NULL,
	"pickup_at" timestamp with time zone,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "local_orders_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "local_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"kind" varchar(20) DEFAULT 'presence' NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"city" varchar(120) DEFAULT '' NOT NULL,
	"lat" numeric(9, 6) NOT NULL,
	"lng" numeric(9, 6) NOT NULL,
	"phone" varchar(30),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "local_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"point_id" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" varchar(60) DEFAULT 'Produit fermier' NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"unit" varchar(30) DEFAULT 'l''unité' NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer,
	"office_id" integer,
	"sender_id" integer NOT NULL,
	"recipient_id" integer,
	"subject" varchar(200),
	"body" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(160) NOT NULL,
	"body" text NOT NULL,
	"link" varchar(200),
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offices" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"code" varchar(20) NOT NULL,
	"address" varchar(200) NOT NULL,
	"city" varchar(120) NOT NULL,
	"postal_code" varchar(10) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"hours" varchar(200) NOT NULL,
	"region" varchar(120) NOT NULL,
	"lat" numeric(9, 6),
	"lng" numeric(9, 6),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "offices_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "organisms" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(60) NOT NULL,
	"name" varchar(160) NOT NULL,
	"category" varchar(40) NOT NULL,
	"role" text NOT NULL,
	"audience" varchar(300) DEFAULT '' NOT NULL,
	"territory" varchar(120) DEFAULT 'National' NOT NULL,
	"url" varchar(300) NOT NULL,
	"source" varchar(300) DEFAULT '' NOT NULL,
	"link_status" varchar(16) DEFAULT 'a_verifier' NOT NULL,
	"content_status" varchar(16) DEFAULT 'a_verifier' NOT NULL,
	"verified_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organisms_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"label" varchar(160) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" varchar(30) DEFAULT 'verse' NOT NULL,
	"reference" varchar(40) NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "procedure_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(80) NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(40) NOT NULL,
	"kind" varchar(30) DEFAULT 'changement' NOT NULL,
	"required_documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "procedure_types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "profile_photos" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"data" "bytea" NOT NULL,
	"mime" varchar(80) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"uploader_id" integer NOT NULL,
	"filename" varchar(200) NOT NULL,
	"mime" varchar(100) NOT NULL,
	"size_bytes" integer NOT NULL,
	"content" "bytea" NOT NULL,
	"access" varchar(16) DEFAULT 'membres' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" varchar(16) DEFAULT 'participant' NOT NULL,
	"status" varchar(12) DEFAULT 'demande' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"body" varchar(1200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_needs" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"text" varchar(160) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"category" varchar(32) DEFAULT 'objets_materiel' NOT NULL,
	"request_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"title" varchar(140) NOT NULL,
	"intention" varchar(800) DEFAULT '' NOT NULL,
	"city" varchar(120) NOT NULL,
	"lat" numeric(8, 2) NOT NULL,
	"lng" numeric(8, 2) NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"universes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"program" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar(16) DEFAULT 'ouvert' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(180) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(20) NOT NULL,
	"full_name" varchar(160) NOT NULL,
	"phone" varchar(30),
	"office_id" integer,
	"situation" varchar(30),
	"address" varchar(200),
	"city" varchar(120),
	"postal_code" varchar(10),
	"birth_date" varchar(10),
	"family_status" varchar(60),
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"display_name" varchar(80),
	"bio" varchar(600),
	"activities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"interests" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"universes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"offers_text" varchar(300),
	"needs_text" varchar(300),
	"transmit_text" varchar(300),
	"travel_radius_km" integer DEFAULT 20 NOT NULL,
	"availability_note" varchar(300),
	"profile_visible" boolean DEFAULT false NOT NULL,
	"profile_city" varchar(120),
	"profile_lat" numeric(8, 2),
	"profile_lng" numeric(8, 2),
	"is_demo" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_availabilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"city" varchar(120) DEFAULT '' NOT NULL,
	"lat" numeric(9, 6) NOT NULL,
	"lng" numeric(9, 6) NOT NULL,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"availability_note" text DEFAULT '' NOT NULL,
	"status" varchar(20) DEFAULT 'disponible' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_member_id_users_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_caseworker_id_users_id_fk" FOREIGN KEY ("caseworker_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_engagements" ADD CONSTRAINT "artist_engagements_journey_id_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_engagements" ADD CONSTRAINT "artist_engagements_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_engagements" ADD CONSTRAINT "artist_engagements_artist_id_users_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_profiles" ADD CONSTRAINT "artist_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_events" ADD CONSTRAINT "case_events_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_events" ADD CONSTRAINT "case_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_member_id_users_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_procedure_type_id_procedure_types_id_fk" FOREIGN KEY ("procedure_type_id") REFERENCES "public"."procedure_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_assigned_caseworker_id_users_id_fk" FOREIGN KEY ("assigned_caseworker_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circle_members" ADD CONSTRAINT "circle_members_circle_id_circles_id_fk" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circle_members" ADD CONSTRAINT "circle_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circle_posts" ADD CONSTRAINT "circle_posts_circle_id_circles_id_fk" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circle_posts" ADD CONSTRAINT "circle_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circles" ADD CONSTRAINT "circles_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_event_plans" ADD CONSTRAINT "community_event_plans_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_listings" ADD CONSTRAINT "community_listings_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_messages" ADD CONSTRAINT "community_messages_request_id_community_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."community_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_messages" ADD CONSTRAINT "community_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_listing_id_community_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."community_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_requests" ADD CONSTRAINT "community_requests_listing_id_community_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."community_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_requests" ADD CONSTRAINT "community_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_saved_searches" ADD CONSTRAINT "community_saved_searches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_transport_requests" ADD CONSTRAINT "community_transport_requests_trip_id_community_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."community_trips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_transport_requests" ADD CONSTRAINT "community_transport_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_transport_requests" ADD CONSTRAINT "community_transport_requests_community_request_id_community_requests_id_fk" FOREIGN KEY ("community_request_id") REFERENCES "public"."community_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_trips" ADD CONSTRAINT "community_trips_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_trips" ADD CONSTRAINT "community_trips_listing_id_community_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."community_listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_grantee_user_id_users_id_fk" FOREIGN KEY ("grantee_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_events" ADD CONSTRAINT "journey_events_journey_id_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_events" ADD CONSTRAINT "journey_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_tasks" ADD CONSTRAINT "journey_tasks_journey_id_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journeys" ADD CONSTRAINT "journeys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_orders" ADD CONSTRAINT "local_orders_product_id_local_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."local_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_orders" ADD CONSTRAINT "local_orders_point_id_local_points_id_fk" FOREIGN KEY ("point_id") REFERENCES "public"."local_points"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_orders" ADD CONSTRAINT "local_orders_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_points" ADD CONSTRAINT "local_points_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_products" ADD CONSTRAINT "local_products_point_id_local_points_id_fk" FOREIGN KEY ("point_id") REFERENCES "public"."local_points"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_member_id_users_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_photos" ADD CONSTRAINT "profile_photos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_uploader_id_users_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_messages" ADD CONSTRAINT "project_messages_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_messages" ADD CONSTRAINT "project_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_needs" ADD CONSTRAINT "project_needs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_availabilities" ADD CONSTRAINT "worker_availabilities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "circle_members_unique" ON "circle_members" USING btree ("circle_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_members_unique" ON "project_members" USING btree ("project_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");