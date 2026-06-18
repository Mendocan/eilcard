DROP INDEX IF EXISTS "cards_domain_idx";
--> statement-breakpoint
CREATE UNIQUE INDEX "cards_domain_idx" ON "cards" ("domain") WHERE "domain" IS NOT NULL;
