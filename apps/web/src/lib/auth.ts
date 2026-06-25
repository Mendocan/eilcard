import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";
import { sendEmailVerificationMail } from "./email-verification-mail";
import { localeFromRequest } from "./i18n/locale-from-request";
import { sendPasswordResetMail } from "./password-reset-mail";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailVerification: {
    sendVerificationEmail: async ({ user, url }, request) => {
      const locale = localeFromRequest(request);
      await sendEmailVerificationMail({
        to: user.email,
        userName: user.name,
        url,
        locale,
      });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }, request) => {
      const locale = localeFromRequest(request);
      await sendPasswordResetMail({
        to: user.email,
        userName: user.name,
        url,
        locale,
      });
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
