import { NextRequest, NextResponse } from "next/server";
import { getCardByHandle, buildCardJson } from "@/lib/card-service";
import { toSchemaOrg } from "@/lib/card-exports";
import { getClientIp } from "@/lib/client-ip";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`public:ip:${ip}`, RATE_LIMITS.publicRead.limit, RATE_LIMITS.publicRead.windowMs);
  if (!rl.success) return rateLimitResponse(rl);

  const { handle } = await params;
  const row = await getCardByHandle(handle);
  if (!row) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const card = buildCardJson(row);
  const jsonLd = toSchemaOrg(card);

  return NextResponse.json(jsonLd, {
    headers: {
      "Content-Type": "application/ld+json; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}
