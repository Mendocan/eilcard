import { and, count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cards, userPlans, users } from "@/lib/db/schema";
import {
  PLAN_TIERS,
  TIER_LIMITS,
  type PlanTier,
  type TierLimits,
} from "@/lib/tier-limits";

export type UserPlanInfo = {
  /** Tier stored in the database (billing/subscription record). */
  subscribedTier: PlanTier;
  /** Tier used for limits and quotas (may downgrade when expired). */
  tier: PlanTier;
  limits: TierLimits;
  startedAt: Date | null;
  expiresAt: Date | null;
  planExpired: boolean;
};

export type CardCreateCheck = {
  allowed: boolean;
  reason?: "suspended" | "card_limit" | "org_limit";
  tier: PlanTier;
  limits: TierLimits;
  currentCards: number;
  currentOrgCards: number;
};

export function getEffectiveTier(
  subscribedTier: PlanTier,
  expiresAt: Date | null,
  now: Date = new Date()
): PlanTier {
  if (expiresAt && expiresAt.getTime() <= now.getTime()) {
    return "free";
  }
  return subscribedTier;
}

export async function getUserPlan(userId: string): Promise<UserPlanInfo> {
  const [row] = await db
    .select({
      tier: userPlans.tier,
      startedAt: userPlans.startedAt,
      expiresAt: userPlans.expiresAt,
    })
    .from(userPlans)
    .where(eq(userPlans.userId, userId))
    .limit(1);

  const subscribedTier = (row?.tier ?? "free") as PlanTier;
  const expiresAt = row?.expiresAt ?? null;
  const tier = getEffectiveTier(subscribedTier, expiresAt);
  const planExpired =
    subscribedTier !== "free" &&
    tier === "free" &&
    expiresAt !== null &&
    expiresAt.getTime() <= Date.now();

  return {
    subscribedTier,
    tier,
    limits: TIER_LIMITS[tier],
    startedAt: row?.startedAt ?? null,
    expiresAt,
    planExpired,
  };
}

export async function getUserTierLimits(userId: string) {
  const plan = await getUserPlan(userId);
  return { tier: plan.tier, limits: plan.limits };
}

export async function isUserSuspended(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ suspendedAt: users.suspendedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return Boolean(row?.suspendedAt);
}

export async function canCreateCard(
  userId: string,
  cardType: "organization" | "person"
): Promise<CardCreateCheck> {
  const plan = await getUserPlan(userId);

  if (await isUserSuspended(userId)) {
    return {
      allowed: false,
      reason: "suspended",
      tier: plan.tier,
      limits: plan.limits,
      currentCards: 0,
      currentOrgCards: 0,
    };
  }

  const [[totalRow], [orgRow]] = await Promise.all([
    db.select({ c: count() }).from(cards).where(eq(cards.userId, userId)),
    db
      .select({ c: count() })
      .from(cards)
      .where(and(eq(cards.userId, userId), eq(cards.type, "organization"))),
  ]);

  const currentCards = totalRow?.c ?? 0;
  const currentOrgCards = orgRow?.c ?? 0;

  if (cardType === "organization" && currentOrgCards >= plan.limits.maxOrgCards) {
    return {
      allowed: false,
      reason: "org_limit",
      tier: plan.tier,
      limits: plan.limits,
      currentCards,
      currentOrgCards,
    };
  }

  if (currentCards >= plan.limits.maxCards) {
    return {
      allowed: false,
      reason: "card_limit",
      tier: plan.tier,
      limits: plan.limits,
      currentCards,
      currentOrgCards,
    };
  }

  return {
    allowed: true,
    tier: plan.tier,
    limits: plan.limits,
    currentCards,
    currentOrgCards,
  };
}

export function isValidPlanTier(value: string): value is PlanTier {
  return PLAN_TIERS.includes(value as PlanTier);
}

export async function setUserPlanTier(userId: string, tier: PlanTier) {
  const now = new Date();

  const [existing] = await db
    .select({ id: userPlans.id })
    .from(userPlans)
    .where(eq(userPlans.userId, userId))
    .limit(1);

  if (existing) {
    await db
      .update(userPlans)
      .set({ tier, updatedAt: now, startedAt: now })
      .where(eq(userPlans.userId, userId));
  } else {
    await db.insert(userPlans).values({
      userId,
      tier,
      startedAt: now,
    });
  }
}

export function validateProductCount(
  productCount: number,
  limits: TierLimits
): boolean {
  return productCount <= limits.maxProducts;
}
