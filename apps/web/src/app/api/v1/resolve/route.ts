import { NextRequest, NextResponse } from "next/server";
import {
  getCardByDomain,
  getCardByHandle,
  buildPublicCardJson,
  incrementResolveCount,
} from "@/lib/card-service";
import { getClientIp } from "@/lib/client-ip";
import {
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { checkResolveQuota } from "@/lib/resolve-quota";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const ipLimit = checkRateLimit(
    `resolve:ip:${ip}`,
    RATE_LIMITS.resolvePerIp.limit,
    RATE_LIMITS.resolvePerIp.windowMs
  );
  if (!ipLimit.success) {
    return rateLimitResponse(ipLimit);
  }

  const { searchParams } = request.nextUrl;
  const domain = searchParams.get("domain");
  const handle = searchParams.get("handle");

  if (!domain && !handle) {
    return NextResponse.json(
      { error: "Missing 'domain' or 'handle' query parameter" },
      { status: 400 }
    );
  }

  const row = domain
    ? await getCardByDomain(domain)
    : await getCardByHandle(handle!);

  if (!row) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const quota = await checkResolveQuota(row.id, row.userId);
  if (quota.exceeded) {
    return NextResponse.json(
      {
        error: "Monthly resolve quota exceeded for this card",
        limit: quota.limit,
        used: quota.used,
      },
      {
        status: 429,
        headers: {
          "Retry-After": "86400",
          "X-RateLimit-Limit": String(quota.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  const card = await buildPublicCardJson(row);

  incrementResolveCount(row.id).catch(() => {});

  return NextResponse.json(
    {
      card,
      meta: {
        source: "registry" as const,
        resolved_at: new Date().toISOString(),
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        "Content-Type": "application/json; charset=utf-8",
      },
    }
  );
}

export async function HEAD(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const domain = searchParams.get("domain");
  const handle = searchParams.get("handle");

  if (!domain && !handle) {
    return new NextResponse(null, { status: 400 });
  }

  const row = domain
    ? await getCardByDomain(domain)
    : await getCardByHandle(handle!);

  return new NextResponse(null, { status: row ? 200 : 404 });
}
