export type PlanTier = "free" | "verified" | "pro";

export type TierLimits = {
  maxCards: number;
  maxOrgCards: number;
  maxProducts: number;
  resolveLimit: number;
};

export const TIER_LIMITS: Record<PlanTier, TierLimits> = {
  free: {
    maxCards: 1,
    maxOrgCards: 0,
    maxProducts: 2,
    resolveLimit: 1000,
  },
  verified: {
    maxCards: 2,
    maxOrgCards: 1,
    maxProducts: 10,
    resolveLimit: 10000,
  },
  pro: {
    maxCards: 99,
    maxOrgCards: 5,
    maxProducts: 50,
    resolveLimit: 50000,
  },
} as const;

export const PLAN_TIERS: PlanTier[] = ["free", "verified", "pro"];
