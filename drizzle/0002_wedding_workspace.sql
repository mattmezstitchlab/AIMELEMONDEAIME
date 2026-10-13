CREATE TABLE "wedding_settings" (
	"project_id" integer PRIMARY KEY NOT NULL,
	"envelope_cents" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wedding_guests" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"persons" integer DEFAULT 1 NOT NULL,
	"groupe" varchar(16) DEFAULT 'famille' NOT NULL,
	"status" varchar(16) DEFAULT 'a_inviter' NOT NULL,
	"note" varchar(200) DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wedding_budget_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"label" varchar(120) NOT NULL,
	"category" varchar(24) DEFAULT 'divers' NOT NULL,
	"estimated_cents" integer DEFAULT 0 NOT NULL,
	"actual_cents" integer,
	"settled" boolean DEFAULT false NOT NULL,
	"note" varchar(200) DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wedding_settings" ADD CONSTRAINT "wedding_settings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "wedding_guests" ADD CONSTRAINT "wedding_guests_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "wedding_budget_items" ADD CONSTRAINT "wedding_budget_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "wedding_guests_project_idx" ON "wedding_guests" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX "wedding_budget_items_project_idx" ON "wedding_budget_items" USING btree ("project_id");
