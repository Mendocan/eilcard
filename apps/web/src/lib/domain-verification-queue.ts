import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { cards, domainVerifications } from "@/lib/db/schema";

/** Pending DNS attempts that still need admin or user action. */
export const actionablePendingCondition = and(
  eq(domainVerifications.status, "pending"),
  eq(cards.verified, false)
);

export async function reconcileStaleVerifications() {
  const staleOnVerifiedCards = await db
    .select({ id: domainVerifications.id })
    .from(domainVerifications)
    .innerJoin(cards, eq(domainVerifications.cardId, cards.id))
    .where(
      and(
        eq(domainVerifications.status, "pending"),
        eq(cards.verified, true)
      )
    );

  if (staleOnVerifiedCards.length > 0) {
    await db
      .update(domainVerifications)
      .set({ status: "failed" })
      .where(
        inArray(
          domainVerifications.id,
          staleOnVerifiedCards.map((row) => row.id)
        )
      );
  }

  const pendingRows = await db
    .select({
      id: domainVerifications.id,
      cardId: domainVerifications.cardId,
      createdAt: domainVerifications.createdAt,
    })
    .from(domainVerifications)
    .where(eq(domainVerifications.status, "pending"))
    .orderBy(desc(domainVerifications.createdAt));

  const latestByCard = new Map<string, string>();
  const staleIds: string[] = [];

  for (const row of pendingRows) {
    if (latestByCard.has(row.cardId)) {
      staleIds.push(row.id);
    } else {
      latestByCard.set(row.cardId, row.id);
    }
  }

  if (staleIds.length > 0) {
    await db
      .update(domainVerifications)
      .set({ status: "failed" })
      .where(inArray(domainVerifications.id, staleIds));
  }
}

export async function supersedePendingVerifications(cardId: string) {
  await db
    .update(domainVerifications)
    .set({ status: "failed" })
    .where(
      and(
        eq(domainVerifications.cardId, cardId),
        eq(domainVerifications.status, "pending")
      )
    );
}

export async function closePendingVerifications(cardId: string) {
  await supersedePendingVerifications(cardId);
}

export async function getLatestPendingVerification(cardId: string) {
  const [pending] = await db
    .select()
    .from(domainVerifications)
    .where(
      and(
        eq(domainVerifications.cardId, cardId),
        eq(domainVerifications.status, "pending")
      )
    )
    .orderBy(desc(domainVerifications.createdAt))
    .limit(1);

  return pending ?? null;
}
