import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cards, domainVerifications } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import { eq, and } from "drizzle-orm";
import {
  generateVerificationToken,
  buildTxtRecord,
  verifyDnsTxt,
} from "@/lib/dns-verify";
import {
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dnsLimit = await checkRateLimit(
    `dns-verify:${session.user.id}`,
    RATE_LIMITS.dnsVerify.limit,
    RATE_LIMITS.dnsVerify.windowMs
  );
  if (!dnsLimit.success) {
    return rateLimitResponse(dnsLimit);
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

  if (!card.domain) {
    return NextResponse.json(
      { error: "No domain set for this card" },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const action = (body as { action?: string }).action;

  if (action === "check") {
    const [pending] = await db
      .select()
      .from(domainVerifications)
      .where(
        and(
          eq(domainVerifications.cardId, card.id),
          eq(domainVerifications.status, "pending")
        )
      )
      .limit(1);

    if (!pending) {
      return NextResponse.json(
        { error: "No pending verification" },
        { status: 400 }
      );
    }

    const verified = await verifyDnsTxt(card.domain, pending.token);

    if (verified) {
      await db
        .update(domainVerifications)
        .set({ status: "verified", verifiedAt: new Date() })
        .where(eq(domainVerifications.id, pending.id));

      const methods = Array.from(
        new Set([...(card.verificationMethod ?? []), "dns"])
      );

      await db
        .update(cards)
        .set({
          verified: true,
          verificationMethod: methods,
          updatedAt: new Date(),
        })
        .where(eq(cards.id, card.id));

      return NextResponse.json({ status: "verified" });
    }

    return NextResponse.json({ status: "pending", message: "TXT record not found yet" });
  }

  const token = generateVerificationToken();

  await db.insert(domainVerifications).values({
    cardId: card.id,
    domain: card.domain,
    method: "dns",
    token,
    status: "pending",
  });

  return NextResponse.json({
    status: "pending",
    domain: card.domain,
    txt_record: buildTxtRecord(token),
    instructions: `Add a TXT record to ${card.domain} with value: ${buildTxtRecord(token)}`,
  });
}
