import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import { createCardSchema } from "@digitalcard/schema";

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createCardSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const cardId = data.domain ?? data.handle;

  const { handle, domain, type, ...cardBody } = data;

  const [created] = await db
    .insert(cards)
    .values({
      userId: session.user.id,
      handle,
      cardId,
      type,
      domain: domain ?? null,
      body: { ...cardBody, type },
    })
    .returning();

  return NextResponse.json({ card: created }, { status: 201 });
}
