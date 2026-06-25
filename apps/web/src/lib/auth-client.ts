import { createAuthClient } from "better-auth/react";

function getAuthBaseUrl(): string | undefined {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL;
}

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl(),
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  sendVerificationEmail,
  requestPasswordReset,
  resetPassword,
} = authClient;
