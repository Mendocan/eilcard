import type { PlanTier } from "@/lib/tier-limits";

export const SUBSCRIPTION_GRACE_DAYS = Number(
  process.env.SUBSCRIPTION_GRACE_DAYS ?? "21"
);

export type PolarServer = "sandbox" | "production";

export function getPolarServer(): PolarServer {
  return process.env.POLAR_SERVER === "sandbox" ? "sandbox" : "production";
}

export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function isPolarCheckoutConfigured(): boolean {
  return Boolean(
    process.env.POLAR_ACCESS_TOKEN?.trim() &&
      (process.env.POLAR_PRODUCT_VERIFIED?.trim() ||
        process.env.POLAR_PRODUCT_PRO?.trim())
  );
}

export function isPolarWebhookConfigured(): boolean {
  return Boolean(process.env.POLAR_WEBHOOK_SECRET?.trim());
}

export function polarProductIdForTier(tier: PlanTier): string | null {
  if (tier === "verified") {
    return process.env.POLAR_PRODUCT_VERIFIED?.trim() ?? null;
  }
  if (tier === "pro") {
    return process.env.POLAR_PRODUCT_PRO?.trim() ?? null;
  }
  return null;
}

export function tierFromPolarProductId(productId: string): PlanTier | null {
  const verified = process.env.POLAR_PRODUCT_VERIFIED?.trim();
  const pro = process.env.POLAR_PRODUCT_PRO?.trim();
  if (verified && productId === verified) return "verified";
  if (pro && productId === pro) return "pro";
  return null;
}

export function addGraceDays(from: Date): Date {
  const end = new Date(from);
  end.setUTCDate(end.getUTCDate() + SUBSCRIPTION_GRACE_DAYS);
  return end;
}
