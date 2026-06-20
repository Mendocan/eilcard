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
  getLatestPendingVerification,
  supersedePendingVerifications,
} from "@/lib/domain-verification-queue";
import {
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { API_ERROR_CODES } from "@/lib/api-error-codes";

export async function POST(
  request: NextRequest,
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

  const dnsLimit = checkRateLimit(
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
    return NextResponse.json(
      { error: "Card not found", code: API_ERROR_CODES.CARD_NOT_FOUND },
      { status: 404 }
    );
  }

  if (!card.domain) {
    return NextResponse.json(
      { error: "No domain set for this card", code: API_ERROR_CODES.NO_DOMAIN },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const action = (body as { action?: string }).action;

  if (action === "check") {
    const pending = await getLatestPendingVerification(card.id);

    if (!pending) {
      return NextResponse.json(
        {
          error: "No pending verification",
          code: API_ERROR_CODES.NO_PENDING_VERIFICATION,
        },
        { status: 400 }
      );
    }

    const verified = await verifyDnsTxt(card.domain, pending.token);

    if (verified) {
      await db
        .update(domainVerifications)
        .set({ status: "verified", verifiedAt: new Date() })
        .where(eq(domainVerifications.id, pending.id));

      await supersedePendingVerifications(card.id);

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

    return NextResponse.json({ status: "pending" });
  }

  const token = generateVerificationToken();

  await supersedePendingVerifications(card.id);

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
