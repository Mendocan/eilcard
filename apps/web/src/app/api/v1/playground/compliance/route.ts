import { NextRequest, NextResponse } from "next/server";
import {
  getCardByDomain,
  getCardByHandle,
  buildPublicCardJson,
} from "@/lib/card-service";
import { runEilCompliance } from "@/lib/eil-compliance";
import { normalizeDomain } from "@/lib/well-known";
import { getClientIp } from "@/lib/client-ip";
import {
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { isPrivateHost } from "@/lib/ssrf-guard";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(
    `playground:compliance:ip:${ip}`,
    RATE_LIMITS.playground.limit,
    RATE_LIMITS.playground.windowMs
  );
  if (!limit.success) {
    return rateLimitResponse(limit);
  }

  const { searchParams } = request.nextUrl;
  const domainParam = searchParams.get("domain");
  const handleParam = searchParams.get("handle");

  if (!domainParam && !handleParam) {
    return NextResponse.json(
      { error: "Missing 'domain' or 'handle' query parameter" },
      { status: 400 }
    );
  }

  if (domainParam) {
    const normalized = normalizeDomain(domainParam);
    if (await isPrivateHost(normalized)) {
      return NextResponse.json(
        { error: "Private/internal addresses are not allowed" },
        { status: 400 }
      );
    }
  }

  const row = domainParam
    ? await getCardByDomain(domainParam)
    : await getCardByHandle(handleParam!);

  const card = row ? await buildPublicCardJson(row) : null;
  const domain =
    domainParam?.trim() ||
    (card?.card_id ? normalizeDomain(card.card_id) : "");

  const report = await runEilCompliance({
    domain: domain || undefined,
    handle: handleParam ?? undefined,
    card,
  });

  return NextResponse.json(report, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
