import { NextRequest, NextResponse } from "next/server";
import { getCardByHandle, buildCardJson } from "@/lib/card-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  const row = await getCardByHandle(handle);

  if (!row) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const card = buildCardJson(row);

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
