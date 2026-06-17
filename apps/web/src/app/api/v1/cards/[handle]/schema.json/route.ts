import { NextResponse } from "next/server";
import { getCardByHandle, buildCardJson } from "@/lib/card-service";
import { toSchemaOrg } from "@/lib/card-exports";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
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
