import { sql, count, eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { cards, resolveEvents, users } from "@/lib/db/schema";

export async function getAdminStats() {
  const today = new Date().toISOString().slice(0, 10);

  const [[userRow], [cardRow], [verifiedRow], [resolveRow]] = await Promise.all([
    db.select({ c: count() }).from(users),
    db.select({ c: count() }).from(cards),
    db.select({ c: count() }).from(cards).where(eq(cards.verified, true)),
    db
      .select({ total: sql<number>`coalesce(sum(${resolveEvents.count}), 0)` })
      .from(resolveEvents)
      .where(eq(resolveEvents.date, today)),
  ]);

  const recentCards = await db
    .select({
      handle: cards.handle,
      domain: cards.domain,
      type: cards.type,
      verified: cards.verified,
      createdAt: cards.createdAt,
    })
    .from(cards)
    .orderBy(desc(cards.createdAt))
    .limit(10);

  const recentUsers = await db
    .select({
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(10);

  return {
    users: userRow?.c ?? 0,
    cards: cardRow?.c ?? 0,
    verified: verifiedRow?.c ?? 0,
    resolvesToday: Number(resolveRow?.total ?? 0),
    recentCards,
    recentUsers,
  };
}
