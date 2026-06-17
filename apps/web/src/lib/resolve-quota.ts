import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { resolveEvents } from "@/lib/db/schema";
import { getUserPlan } from "@/lib/user-plan";

function currentMonthStartIso(): string {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  return start.toISOString().slice(0, 10);
}

export async function getMonthlyResolveCount(cardId: string): Promise<number> {
  const since = currentMonthStartIso();
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${resolveEvents.count}), 0)`,
    })
    .from(resolveEvents)
    .where(
      and(eq(resolveEvents.cardId, cardId), gte(resolveEvents.date, since))
    );

  return Number(row?.total ?? 0);
}

export async function checkResolveQuota(
  cardId: string,
  userId: string
): Promise<{ exceeded: boolean; limit: number; used: number }> {
  const [plan, used] = await Promise.all([
    getUserPlan(userId),
    getMonthlyResolveCount(cardId),
  ]);

  return {
    exceeded: used >= plan.limits.resolveLimit,
    limit: plan.limits.resolveLimit,
    used,
  };
}
