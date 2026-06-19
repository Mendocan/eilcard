import { NextRequest, NextResponse } from "next/server";
import { getCardByHandle, buildPublicCardJson } from "@/lib/card-service";
import { toAgentCard } from "@/lib/card-exports";
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

  const card = await buildPublicCardJson(row);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://eilcard.com";
  const agentCard = toAgentCard(card, appUrl);

  return NextResponse.json(agentCard, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}
