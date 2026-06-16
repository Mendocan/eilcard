import { NextRequest, NextResponse } from "next/server";
import { getCardByHandle } from "@/lib/card-service";
import QRCode from "qrcode";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  const row = await getCardByHandle(handle);

  if (!row) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const humanUrl = `${process.env.NEXT_PUBLIC_APP_URL}/kart/${handle}`;
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
