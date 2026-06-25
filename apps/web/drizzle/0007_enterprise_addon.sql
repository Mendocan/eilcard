ALTER TABLE "user_plans" ADD COLUMN IF NOT EXISTS "enterprise_addon" boolean DEFAULT false NOT NULL;
