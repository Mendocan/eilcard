import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { handle } = await params;
  const body = await request.json();

  const [existing] = await db
    .select()
    .from(cards)
    .where(and(eq(cards.handle, handle), eq(cards.userId, session.user.id)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const currentBody = existing.body as Record<string, unknown>;
  const { domain, ...updates } = body;

  const [updated] = await db
    .update(cards)
    .set({
      body: { ...currentBody, ...updates },
      domain: domain !== undefined ? domain : existing.domain,
      updatedAt: new Date(),
    })
    .where(eq(cards.id, existing.id))
    .returning();

  return NextResponse.json({ card: updated });
}
