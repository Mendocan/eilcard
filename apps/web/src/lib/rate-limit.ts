import { NextResponse } from "next/server";
import { API_ERROR_CODES } from "@/lib/api-error-codes";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Bucket>();

const GC_INTERVAL = 60_000;
let lastGc = Date.now();

function gc() {
  const now = Date.now();
  if (now - lastGc < GC_INTERVAL) return;
  lastGc = now;
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  gc();
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, limit, remaining: limit - 1, resetAt };
  }

  bucket.count += 1;
  const success = bucket.count <= limit;
  return {
    success,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfterSec = Math.max(
    1,
    Math.ceil((result.resetAt - Date.now()) / 1000)
  );

  return NextResponse.json(
    {
      error: "Too many requests",
      code: API_ERROR_CODES.RATE_LIMIT,
      retry_after: retryAfterSec,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    }
  );
}

export const RATE_LIMITS = {
  resolvePerIp: { limit: 120, windowMs: 60_000 },
  adminLogin: { limit: 5, windowMs: 15 * 60_000 },
  auth: { limit: 10, windowMs: 15 * 60_000 },
  cardCreate: { limit: 10, windowMs: 60 * 60_000 },
  dnsVerify: { limit: 30, windowMs: 60 * 60_000 },
  playground: { limit: 20, windowMs: 60_000 },
  publicRead: { limit: 60, windowMs: 60_000 },
} as const;
