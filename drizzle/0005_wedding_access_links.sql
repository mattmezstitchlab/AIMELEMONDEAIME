ALTER TABLE "wedding_guests" ADD COLUMN "rsvp_token_hash" varchar(64);
--> statement-breakpoint
ALTER TABLE "wedding_guests" ADD COLUMN "rsvp_expires_at" timestamp with time zone;
--> statement-breakpoint
CREATE UNIQUE INDEX "wedding_guests_rsvp_token_hash_unique" ON "wedding_guests" USING btree ("rsvp_token_hash");
--> statement-breakpoint
CREATE TABLE "wedding_access_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"created_by_id" integer NOT NULL,
	"label" varchar(80) DEFAULT 'Proche' NOT NULL,
	"role" varchar(20) NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wedding_access_links_role_check" CHECK ("role" IN ('coordination', 'temoin'))
);
--> statement-breakpoint
ALTER TABLE "wedding_access_links" ADD CONSTRAINT "wedding_access_links_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "wedding_access_links" ADD CONSTRAINT "wedding_access_links_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "wedding_access_links_token_hash_unique" ON "wedding_access_links" USING btree ("token_hash");
--> statement-breakpoint
CREATE INDEX "wedding_access_links_project_idx" ON "wedding_access_links" USING btree ("project_id");
