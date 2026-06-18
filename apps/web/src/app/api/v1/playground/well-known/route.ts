import { NextRequest, NextResponse } from "next/server";
import { normalizeDomain } from "@/lib/well-known";
import { getClientIp } from "@/lib/client-ip";
import {
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { isPrivateHost } from "@/lib/ssrf-guard";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(
    `playground:ip:${ip}`,
    RATE_LIMITS.playground.limit,
    RATE_LIMITS.playground.windowMs
  );
  if (!limit.success) {
    return rateLimitResponse(limit);
  }

  const domain = request.nextUrl.searchParams.get("domain");
  if (!domain) {
    return NextResponse.json({ error: "Missing domain" }, { status: 400 });
  }

  const normalized = normalizeDomain(domain);

  if (await isPrivateHost(normalized)) {
    return NextResponse.json(
      { error: "Private/internal addresses are not allowed" },
      { status: 400 }
    );
  }

  const url = `https://${normalized}/.well-known/digital-card`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
      redirect: "error",
    });

    const contentType = response.headers.get("content-type") ?? "";
    let preview: string | undefined;

    if (response.ok && contentType.includes("json")) {
      const text = await response.text();
      const truncated = text.slice(0, 2048);
      try {
        JSON.parse(truncated.length === text.length ? truncated : text);
        preview = truncated.slice(0, 200);
      } catch {
        return NextResponse.json({
          url,
          ok: false,
          status: response.status,
          content_type: contentType,
          preview: undefined,
        });
      }
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
