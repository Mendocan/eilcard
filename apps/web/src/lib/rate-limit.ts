import { NextResponse } from "next/server";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

type MemoryBucket = {
  count: number;
  resetAt: number;
};

const memoryStore = new Map<string, MemoryBucket>();

type RedisLike = {
  status: string;
  connect(): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  on(event: string, listener: () => void): void;
};

let redisClient: RedisLike | null = null;
let redisUnavailable = false;

async function getRedis(): Promise<RedisLike | null> {
  if (redisUnavailable) return null;
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (!redisClient) {
    try {
      const { default: Redis } = await import("ioredis");
      redisClient = new Redis(url, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        lazyConnect: true,
      });
      redisClient.on("error", () => {
        redisUnavailable = true;
      });
    } catch {
      redisUnavailable = true;
      return null;
    }
  }

  return redisClient;
}

function checkRateLimitMemory(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const bucket = memoryStore.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    memoryStore.set(key, { count: 1, resetAt });
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

async function checkRateLimitRedis(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redis = await getRedis();
  if (!redis) {
    return checkRateLimitMemory(key, limit, windowMs);
  }

  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const now = Date.now();
  const windowKey = `rl:${key}:${Math.floor(now / windowMs)}`;

  try {
    if (redis.status !== "ready") {
      await redis.connect();
    }

    const count = await redis.incr(windowKey);
    if (count === 1) {
      await redis.expire(windowKey, windowSec);
    }

    const ttl = await redis.ttl(windowKey);
    const resetAt = now + (ttl > 0 ? ttl * 1000 : windowMs);

    return {
      success: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      resetAt,
    };
  } catch {
    redisUnavailable = true;
    return checkRateLimitMemory(key, limit, windowMs);
  }
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (process.env.REDIS_URL && !redisUnavailable) {
    return checkRateLimitRedis(key, limit, windowMs);
  }
  return checkRateLimitMemory(key, limit, windowMs);
}

export function checkRateLimitSync(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  return checkRateLimitMemory(key, limit, windowMs);
}

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfterSec = Math.max(
    1,
    Math.ceil((result.resetAt - Date.now()) / 1000)
  );

  return NextResponse.json(
    {
      error: "Too many requests",
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
} as const;
