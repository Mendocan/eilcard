import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import { getCardByHandle } from "@/lib/card-service";
import { closePendingVerifications } from "@/lib/domain-verification-queue";
import { db } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ handle: string }> };

export async function PATCH(request: Request, { params }: Params) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { handle } = await params;
  const card = await getCardByHandle(handle);
  if (!card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as { verified?: boolean };
  if (typeof body.verified !== "boolean") {
    return NextResponse.json({ error: "verified must be boolean" }, { status: 400 });
  }

  await db
    .update(cards)
    .set({ verified: body.verified, updatedAt: new Date() })
    .where(eq(cards.handle, handle));

  if (body.verified) {
    await closePendingVerifications(card.id);
  }

  await logAdminAction(
    body.verified ? "card.verify" : "card.revoke",
    "card",
    handle,
    { previous: card.verified }
  );

  return NextResponse.json({ ok: true, verified: body.verified });
}

export async function DELETE(request: Request, { params }: Params) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { handle } = await params;
  const card = await getCardByHandle(handle);
  if (!card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(cards).where(eq(cards.handle, handle));

  await logAdminAction("card.delete", "card", handle, {
    domain: card.domain,
    type: card.type,
  });

  return NextResponse.json({ ok: true });
}
