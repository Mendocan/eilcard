import { getPlatformOperatorEmail } from "@/lib/platform-operator-env";

export const DEFAULT_SUPPORT_EMAIL = "support@eilcard.com";

export function getPublicSupportEmail(): string {
  return process.env.SUPPORT_EMAIL?.trim() || DEFAULT_SUPPORT_EMAIL;
}

const DEFAULT_BILLING_EMAIL = "billing@eilcard.com";

/** Transactional billing mail (Polar, plan notices). Falls back to support@. */
export function getBillingFromEmail(): string {
  return (
    process.env.BILLING_EMAIL?.trim() ||
    getRecommendedContactAddresses(
      new URL(
        process.env.NEXT_PUBLIC_APP_URL ?? "https://eilcard.com"
      ).hostname
    ).billing ||
    DEFAULT_BILLING_EMAIL
  );
}

export type PlatformConfig = {
  appUrl: string;
  supportEmail: string | null;
  billingEmail: string | null;
  platformOperatorEmail: string;
  resendConfigured: boolean;
  adminConfigured: boolean;
};

export function getPlatformConfig(): PlatformConfig {
  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://eilcard.com",
    supportEmail: process.env.SUPPORT_EMAIL?.trim() || DEFAULT_SUPPORT_EMAIL,
    billingEmail: process.env.BILLING_EMAIL?.trim() || null,
    platformOperatorEmail: getPlatformOperatorEmail(),
    resendConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
    adminConfigured: Boolean(process.env.ADMIN_PASSWORD?.trim()),
  };
}

export function getRecommendedContactAddresses(domain: string) {
  return {
    support: `support@${domain}`,
    billing: `billing@${domain}`,
    hello: `hello@${domain}`,
  };
}
