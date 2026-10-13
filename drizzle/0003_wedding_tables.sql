CREATE TABLE "wedding_tables" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" varchar(60) NOT NULL,
	"capacity" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wedding_tables" ADD CONSTRAINT "wedding_tables_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "wedding_tables_project_idx" ON "wedding_tables" USING btree ("project_id");
--> statement-breakpoint
ALTER TABLE "wedding_guests" ADD COLUMN "table_id" integer;
--> statement-breakpoint
ALTER TABLE "wedding_guests" ADD CONSTRAINT "wedding_guests_table_id_wedding_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."wedding_tables"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "wedding_guests_table_idx" ON "wedding_guests" USING btree ("table_id");
