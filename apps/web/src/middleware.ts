import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getClientIp } from "@/lib/client-ip";
import {
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limit";

export function middleware(request: NextRequest) {
  if (request.method === "POST") {
    const ip = getClientIp(request);
    const path = request.nextUrl.pathname;

    if (path.startsWith("/api/auth")) {
      const result = checkRateLimit(
        `auth:${ip}`,
        RATE_LIMITS.auth.limit,
        RATE_LIMITS.auth.windowMs
      );
      if (!result.success) return rateLimitResponse(result);
    }

    if (path === "/api/admin/login") {
      const result = checkRateLimit(
        `admin-login:${ip}`,
        RATE_LIMITS.adminLogin.limit,
        RATE_LIMITS.adminLogin.windowMs
      );
      if (!result.success) return rateLimitResponse(result);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/:path*", "/api/admin/login"],
};
