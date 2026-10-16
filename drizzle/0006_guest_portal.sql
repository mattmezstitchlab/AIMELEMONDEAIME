-- Custom additive migration: existing wedding tables were introduced by 0002–0005.
ALTER TABLE "wedding_settings" ADD COLUMN "guest_information" jsonb;
--> statement-breakpoint
ALTER TABLE "wedding_guests" ADD COLUMN "reply_details" jsonb;
