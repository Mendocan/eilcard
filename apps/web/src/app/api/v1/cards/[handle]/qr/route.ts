import { NextRequest, NextResponse } from "next/server";
import { getCardByHandle } from "@/lib/card-service";
import { getClientIp } from "@/lib/client-ip";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import QRCode from "qrcode";

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://eilcard.com";
  const humanUrl = `${appUrl}/kart/${handle}`;
  const svg = await QRCode.toString(humanUrl, {
    type: "svg",
    margin: 1,
    width: 240,
  });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
