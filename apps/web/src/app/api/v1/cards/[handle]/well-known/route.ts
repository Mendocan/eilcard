import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { buildCardJson } from "@/lib/card-service";
import { requireSession } from "@/lib/session";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { handle } = await params;

  const [row] = await db
    .select()
    .from(cards)
    .where(and(eq(cards.handle, handle), eq(cards.userId, session.user.id)))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const card = buildCardJson(row);
  const body = JSON.stringify(card, null, 2);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="digital-card"',
      "Cache-Control": "private, no-cache",
    },
  });
}
