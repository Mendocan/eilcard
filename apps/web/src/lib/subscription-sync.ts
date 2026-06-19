import { eq, and, lt, ne, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { cards, userPlans, users } from "@/lib/db/schema";
import { closePendingVerifications } from "@/lib/domain-verification-queue";
import {
  addGraceDays,
  tierFromPolarProductId,
} from "@/lib/polar-config";
import type { PlanTier } from "@/lib/tier-limits";
import { getEffectiveTier } from "@/lib/user-plan";

export type SubscriptionSyncInput = {
  userId: string;
  tier: PlanTier;
  expiresAt: Date | null;
  polarSubscriptionId: string | null;
};

export async function upsertUserSubscription(input: SubscriptionSyncInput) {
  const now = new Date();
  const [existing] = await db
    .select({ id: userPlans.id })
    .from(userPlans)
    .where(eq(userPlans.userId, input.userId))
    .limit(1);

  const values = {
    tier: input.tier,
    expiresAt: input.expiresAt,
    polarSubscriptionId: input.polarSubscriptionId,
    updatedAt: now,
    startedAt: now,
  };

  if (existing) {
    await db
      .update(userPlans)
      .set(values)
      .where(eq(userPlans.userId, input.userId));
  } else {
    await db.insert(userPlans).values({
      userId: input.userId,
      ...values,
    });
  }
}

export async function resolveUserIdFromCustomer(input: {
  externalId?: string | null;
  email?: string | null;
}): Promise<string | null> {
  if (input.externalId) {
    const [byId] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, input.externalId))
      .limit(1);
    if (byId) return byId.id;
  }

  const email = input.email?.trim().toLowerCase();
  if (!email) return null;

  const [byEmail] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return byEmail?.id ?? null;
}

export async function revokeVerifiedForUser(userId: string) {
  const userCards = await db
    .select({ id: cards.id, verified: cards.verified })
    .from(cards)
    .where(and(eq(cards.userId, userId), eq(cards.verified, true)));

  for (const card of userCards) {
    await closePendingVerifications(card.id);
  }

  if (userCards.length > 0) {
    await db
      .update(cards)
      .set({ verified: false, updatedAt: new Date() })
      .where(and(eq(cards.userId, userId), eq(cards.verified, true)));
  }
}

export async function reconcileUserSubscriptionDowngrade(userId: string) {
  const [row] = await db
    .select({
      tier: userPlans.tier,
      expiresAt: userPlans.expiresAt,
    })
    .from(userPlans)
    .where(eq(userPlans.userId, userId))
    .limit(1);

  if (!row) return;

  const effective = getEffectiveTier(
    row.tier as PlanTier,
    row.expiresAt ?? null
  );

  if (effective !== "free" || row.tier === "free") return;

  await upsertUserSubscription({
    userId,
    tier: "free",
    expiresAt: null,
    polarSubscriptionId: null,
  });

  await revokeVerifiedForUser(userId);
}

export async function reconcileAllExpiredSubscriptions() {
  const now = new Date();
  const rows = await db
    .select({ userId: userPlans.userId })
    .from(userPlans)
    .where(
      and(
        ne(userPlans.tier, "free"),
        isNotNull(userPlans.expiresAt),
        lt(userPlans.expiresAt, now)
      )
    );

  for (const row of rows) {
    await reconcileUserSubscriptionDowngrade(row.userId);
  }

  return rows.length;
}

type PolarSubscriptionLike = {
  id: string;
  status?: string;
  currentPeriodEnd?: Date | string | null;
  endsAt?: Date | string | null;
  endedAt?: Date | string | null;
  productId?: string | null;
  product?: { id?: string | null } | null;
  customer?: {
    id?: string | null;
    email?: string | null;
    externalId?: string | null;
  } | null;
};

function parseDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function subscriptionProductId(sub: PolarSubscriptionLike): string | null {
  return sub.productId ?? sub.product?.id ?? null;
}

export async function syncPolarSubscription(sub: PolarSubscriptionLike) {
  const userId = await resolveUserIdFromCustomer({
    externalId: sub.customer?.externalId,
    email: sub.customer?.email,
  });

  if (!userId) {
    console.warn("[polar] subscription sync: user not found", sub.id);
    return;
  }

  const productId = subscriptionProductId(sub);
  const tier = productId ? tierFromPolarProductId(productId) : null;
  const status = sub.status?.toLowerCase() ?? "";

  if (
    status === "active" ||
    status === "trialing" ||
    status === "past_due"
  ) {
    if (!tier) {
      console.warn("[polar] unknown product for subscription", productId);
      return;
    }

    const periodEnd =
      parseDate(sub.currentPeriodEnd) ?? parseDate(sub.endsAt);

    await upsertUserSubscription({
      userId,
      tier,
      expiresAt: periodEnd,
      polarSubscriptionId: sub.id,
    });
    return;
  }

  if (status === "canceled") {
    const periodEnd =
      parseDate(sub.endsAt) ??
      parseDate(sub.currentPeriodEnd) ??
      new Date();
    const expiresAt = addGraceDays(periodEnd);
    const resolvedTier = tier ?? (await getStoredTier(userId));

    await upsertUserSubscription({
      userId,
      tier: resolvedTier,
      expiresAt,
      polarSubscriptionId: sub.id,
    });
    await maybeDowngradeIfExpired(userId);
    return;
  }

  if (
    status === "revoked" ||
    status === "incomplete_expired" ||
    status === "unpaid"
  ) {
    const expiresAt = addGraceDays(new Date());
    const resolvedTier = tier ?? (await getStoredTier(userId));

    await upsertUserSubscription({
      userId,
      tier: resolvedTier,
      expiresAt,
      polarSubscriptionId: sub.id,
    });
    await maybeDowngradeIfExpired(userId);
  }
}

async function getStoredTier(userId: string): Promise<PlanTier> {
  const [row] = await db
    .select({ tier: userPlans.tier })
    .from(userPlans)
    .where(eq(userPlans.userId, userId))
    .limit(1);
  return (row?.tier ?? "verified") as PlanTier;
}

async function maybeDowngradeIfExpired(userId: string) {
  const [row] = await db
    .select({
      tier: userPlans.tier,
      expiresAt: userPlans.expiresAt,
    })
    .from(userPlans)
    .where(eq(userPlans.userId, userId))
    .limit(1);

  if (!row?.expiresAt) return;

  if (getEffectiveTier(row.tier as PlanTier, row.expiresAt) === "free") {
    await reconcileUserSubscriptionDowngrade(userId);
  }
}
