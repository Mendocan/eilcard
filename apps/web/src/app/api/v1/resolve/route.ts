import { NextRequest, NextResponse } from "next/server";
import {
  getCardByDomain,
  getCardByHandle,
  buildCardJson,
  incrementResolveCount,
} from "@/lib/card-service";

export async function GET(request: NextRequest) {
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

  const card = buildCardJson(row);

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
