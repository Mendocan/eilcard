import { NextRequest, NextResponse } from "next/server";
import { normalizeDomain } from "@/lib/well-known";

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain");
  if (!domain) {
    return NextResponse.json({ error: "Missing domain" }, { status: 400 });
  }

  const normalized = normalizeDomain(domain);
  const url = `https://${normalized}/.well-known/digital-card`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") ?? "";
    let preview: string | undefined;

    if (response.ok && contentType.includes("json")) {
      const body = await response.json();
      preview = JSON.stringify(body).slice(0, 200);
    }

    return NextResponse.json({
      url,
      ok: response.ok && contentType.includes("json"),
      status: response.status,
      content_type: contentType,
      preview,
    });
  } catch {
    return NextResponse.json({
      url,
      ok: false,
      status: 0,
      content_type: "",
      preview: undefined,
    });
  }
}
