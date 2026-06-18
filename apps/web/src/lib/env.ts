import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(16),
  BETTER_AUTH_URL: z.string().url(),
  RESEND_API_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  NEXT_PUBLIC_GITHUB_URL: z.string().url().optional(),
});

export function validateEnv() {
  return envSchema.parse(process.env);
}
