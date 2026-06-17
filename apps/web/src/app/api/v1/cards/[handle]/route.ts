import { NextRequest, NextResponse } from "next/server";
import {
  getCardByHandle,
  buildCardJson,
  incrementResolveCount,
} from "@/lib/card-service";
import { getClientIp } from "@/lib/client-ip";
import {
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { checkResolveQuota } from "@/lib/resolve-quota";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const ip = getClientIp(request);
  const ipLimit = checkRateLimit(
    `resolve:ip:${ip}`,
    RATE_LIMITS.resolvePerIp.limit,
    RATE_LIMITS.resolvePerIp.windowMs
  );
  if (!ipLimit.success) {
    return rateLimitResponse(ipLimit);
  }

  const { handle } = await params;
  const row = await getCardByHandle(handle);

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
      { status: 429 }
    );
  }

  const card = buildCardJson(row);
  incrementResolveCount(row.id).catch(() => {});

  return NextResponse.json(
    { card },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        "Content-Type": "application/json; charset=utf-8",
      },
    }
  );
}
