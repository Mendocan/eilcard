export type PlanTier = "free" | "verified" | "pro";

export type CardEdition = "core" | "business" | "registry_plus";

export type TierLimits = {
  maxCards: number;
  maxOrgCards: number;
  maxProducts: number;
  resolveLimit: number;
  allowedEditions: CardEdition[];
};

export const TIER_LIMITS: Record<PlanTier, TierLimits> = {
  free: {
    maxCards: 1,
    maxOrgCards: 0,
    maxProducts: 2,
    resolveLimit: 1000,
    allowedEditions: ["core"],
  },
  verified: {
    maxCards: 2,
    maxOrgCards: 1,
    maxProducts: 10,
    resolveLimit: 10000,
    allowedEditions: ["core", "business"],
  },
  pro: {
    maxCards: 99,
    maxOrgCards: 5,
    maxProducts: 50,
    resolveLimit: 50000,
    allowedEditions: ["core", "business", "registry_plus"],
  },
} as const;

export const PLAN_TIERS: PlanTier[] = ["free", "verified", "pro"];
