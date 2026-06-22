import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import { eq, and } from "drizzle-orm";
import { closePendingVerifications } from "@/lib/domain-verification-queue";
import { API_ERROR_CODES } from "@/lib/api-error-codes";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json(
      { error: "Unauthorized", code: API_ERROR_CODES.UNAUTHORIZED },
      { status: 401 }
    );
  }

  const { handle } = await params;

  const [card] = await db
    .select()
    .from(cards)
    .where(and(eq(cards.handle, handle), eq(cards.userId, session.user.id)))
    .limit(1);

  if (!card) {
    return NextResponse.json(
      { error: "Card not found", code: API_ERROR_CODES.CARD_NOT_FOUND },
      { status: 404 }
    );
  }

  await closePendingVerifications(card.id);
  await db.delete(cards).where(eq(cards.id, card.id));

  return NextResponse.json({ deleted: true });
}
