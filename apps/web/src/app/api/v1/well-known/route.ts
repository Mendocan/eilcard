import { NextRequest, NextResponse } from "next/server";
import {
  getCardByDomain,
  buildCardJson,
  incrementResolveCount,
} from "@/lib/card-service";
import { normalizeDomain } from "@/lib/well-known";

export async function GET(request: NextRequest) {
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
