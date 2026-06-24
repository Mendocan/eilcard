DO $$ BEGIN
 CREATE TYPE "public"."card_edition" AS ENUM('core', 'business', 'registry_plus');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "edition" "card_edition" DEFAULT 'core' NOT NULL;
--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "schema_version" varchar(10) DEFAULT '1.0' NOT NULL;
