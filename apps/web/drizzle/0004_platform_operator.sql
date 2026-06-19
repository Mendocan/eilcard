ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_platform_operator" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_platform_operator_idx" ON "users" ("is_platform_operator") WHERE "is_platform_operator" = true;
