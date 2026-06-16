import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cards, resolveEvents } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import { eq, and, sql } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { handle } = await params;

  const [card] = await db
    .select()
    .from(cards)
    .where(and(eq(cards.handle, handle), eq(cards.userId, session.user.id)))
    .limit(1);

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const [totals] = await db
    .select({ total: sql<number>`coalesce(sum(${resolveEvents.count}), 0)` })
    .from(resolveEvents)
    .where(eq(resolveEvents.cardId, card.id));

  const daily = await db
    .select({
      date: resolveEvents.date,
      count: resolveEvents.count,
    })
    .from(resolveEvents)
    .where(eq(resolveEvents.cardId, card.id))
    .orderBy(resolveEvents.date)
    .limit(30);

  return NextResponse.json({
    total: Number(totals?.total ?? 0),
    daily,
  });
}
