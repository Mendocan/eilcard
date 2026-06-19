import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { isAdminRequest } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import { getCardByHandle } from "@/lib/card-service";
import { db } from "@/lib/db";
import { cards, domainVerifications } from "@/lib/db/schema";
import { verifyDnsTxt } from "@/lib/dns-verify";
import {
  getLatestPendingVerification,
  supersedePendingVerifications,
} from "@/lib/domain-verification-queue";

type Params = { params: Promise<{ handle: string }> };

export async function POST(request: Request, { params }: Params) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { handle } = await params;
  const card = await getCardByHandle(handle);
  if (!card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!card.domain) {
    return NextResponse.json({ error: "No domain on card" }, { status: 400 });
  }

  const pending = await getLatestPendingVerification(card.id);

  if (!pending) {
    return NextResponse.json({ error: "No pending verification" }, { status: 400 });
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

    await logAdminAction("card.dns_check", "card", handle, { status: "verified" });

    return NextResponse.json({ status: "verified" });
  }

  await logAdminAction("card.dns_check", "card", handle, { status: "pending" });

  return NextResponse.json({
    status: "pending",
    message: "TXT record not found yet",
  });
}
