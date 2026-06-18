import { NextRequest, NextResponse } from "next/server";
import {
  getCardByDomain,
  buildCardJson,
  incrementResolveCount,
} from "@/lib/card-service";
import { normalizeDomain } from "@/lib/well-known";
import { getClientIp } from "@/lib/client-ip";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`public:ip:${ip}`, RATE_LIMITS.publicRead.limit, RATE_LIMITS.publicRead.windowMs);
  if (!rl.success) return rateLimitResponse(rl);

  const domain = request.nextUrl.searchParams.get("domain");
  if (!domain) {
    return NextResponse.json(
      { error: "Missing 'domain' query parameter" },
      { status: 400 }
    );
  }

  const row = await getCardByDomain(normalizeDomain(domain));
  if (!row) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const card = buildCardJson(row);
  incrementResolveCount(row.id).catch(() => {});

  return NextResponse.json(card, {
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
