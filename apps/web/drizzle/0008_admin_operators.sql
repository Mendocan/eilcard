CREATE TYPE "admin_role" AS ENUM('admin', 'moderator', 'editor');
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_operators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "admin_role" DEFAULT 'editor' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "admin_operators_email_idx" ON "admin_operators" ("email");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" "admin_role" NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"invited_by_operator_id" uuid REFERENCES "admin_operators"("id") ON DELETE SET NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_invites_email_idx" ON "admin_invites" ("email");
--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD COLUMN IF NOT EXISTS "operator_id" uuid REFERENCES "admin_operators"("id") ON DELETE SET NULL;
