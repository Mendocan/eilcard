import { db } from "./db";
import { cards, resolveEvents } from "./db/schema";
import { eq, sql } from "drizzle-orm";
import { SCHEMA_VERSION } from "@digitalcard/schema";
import type { Card } from "@digitalcard/schema";

export async function getCardByHandle(handle: string) {
  const [row] = await db
    .select()
    .from(cards)
    .where(eq(cards.handle, handle))
    .limit(1);
  return row ?? null;
}

export async function getCardByDomain(domain: string) {
  const [row] = await db
    .select()
    .from(cards)
    .where(eq(cards.domain, domain))
    .limit(1);
  return row ?? null;
}

export async function getCardsByUserId(userId: string) {
  return db.select().from(cards).where(eq(cards.userId, userId));
}

export function mergeCardBody(
  current: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const merged = { ...current };

  for (const [key, value] of Object.entries(patch)) {
    if (key === "domain") continue;
    if (value === undefined) continue;

    const existing = merged[key];
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      existing !== null &&
      typeof existing === "object" &&
      !Array.isArray(existing)
    ) {
      merged[key] = { ...(existing as Record<string, unknown>), ...value };
    } else {
      merged[key] = value;
    }
  }

  return merged;
}

import { getUserPlan } from "./user-plan";

export type BuildCardJsonOptions = {
  /** Hide verified in public JSON when paid subscription lapsed. */
  subscriptionLapsed?: boolean;
};

export function buildCardJson(
  row: typeof cards.$inferSelect,
  options?: BuildCardJsonOptions
): Card {
  const body = row.body as Record<string, unknown>;
  const publicVerified =
    row.verified && !options?.subscriptionLapsed;
  const methods =
    row.verificationMethod.length > 0
      ? row.verificationMethod
      : publicVerified
        ? (["dns"] as Card["verification_method"])
        : [];

  return {
    ...body,
    schema_version: SCHEMA_VERSION,
    card_id: row.cardId,
    handle: row.handle,
    verified: publicVerified,
    verification_method: methods as Card["verification_method"],
    updated_at: row.updatedAt.toISOString(),
    created_at: row.createdAt.toISOString(),
    human_url: `${process.env.NEXT_PUBLIC_APP_URL}/kart/${row.handle}`,
    registry_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/cards/${row.handle}`,
  } as Card;
}

export async function buildPublicCardJson(row: typeof cards.$inferSelect) {
  const plan = await getUserPlan(row.userId);
  return buildCardJson(row, { subscriptionLapsed: plan.planExpired });
}

export async function incrementResolveCount(cardId: string) {
  const today = new Date().toISOString().slice(0, 10);
  await db
    .insert(resolveEvents)
    .values({ cardId, date: today, count: 1 })
    .onConflictDoUpdate({
      target: [resolveEvents.cardId, resolveEvents.date],
      set: { count: sql`${resolveEvents.count} + 1` },
    });
}
