CREATE TABLE IF NOT EXISTS "card_change_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"changed_fields" text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "card_change_logs" ADD CONSTRAINT "card_change_logs_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "card_change_logs" ADD CONSTRAINT "card_change_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "card_change_logs_card_id_idx" ON "card_change_logs" ("card_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "card_change_logs_created_at_idx" ON "card_change_logs" ("created_at");
