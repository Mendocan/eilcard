import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import {
  canCreateCard,
  validateProductCount,
} from "@/lib/user-plan";
import { createCardSchema } from "@digitalcard/schema";
import { isDomainTaken } from "@/lib/domain-check";
import { checkPlatformResourceAccess } from "@/lib/platform-operator";
import { getClientIp } from "@/lib/client-ip";
import {
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  const createLimit = checkRateLimit(
    `card-create:${session.user.id}:${ip}`,
    RATE_LIMITS.cardCreate.limit,
    RATE_LIMITS.cardCreate.windowMs
  );
  if (!createLimit.success) {
    return rateLimitResponse(createLimit);
  }

  const body = await request.json();
  const parsed = createCardSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const resourceCheck = await checkPlatformResourceAccess(session.user.id, {
    handle: data.handle,
    domain: data.domain,
  });
  if (!resourceCheck.allowed) {
    return NextResponse.json(
      {
        error: "Reserved for platform operator",
        reason: resourceCheck.reason,
      },
      { status: 403 }
    );
  }

  const createCheck = await canCreateCard(session.user.id, data.type);

  if (!createCheck.allowed) {
    return NextResponse.json(
      {
        error: "Plan limit reached",
        reason: createCheck.reason,
        tier: createCheck.tier,
        limits: createCheck.limits,
        currentCards: createCheck.currentCards,
        currentOrgCards: createCheck.currentOrgCards,
      },
      { status: 403 }
    );
  }

  const productCount =
    data.type === "organization" && "products" in data
      ? (data.products?.length ?? 0)
      : 0;
  if (!validateProductCount(productCount, createCheck.limits)) {
    return NextResponse.json(
      {
        error: "Product limit reached",
        tier: createCheck.tier,
        limit: createCheck.limits.maxProducts,
        count: productCount,
      },
      { status: 403 }
    );
  }

  if (data.domain && (await isDomainTaken(data.domain))) {
    return NextResponse.json(
      { error: "Domain already registered to another card" },
      { status: 409 }
    );
  }

  const cardId = data.domain ?? data.handle;
  const { handle, domain, type, ...cardBody } = data;

  const [created] = await db
    .insert(cards)
    .values({
      userId: session.user.id,
      handle,
      cardId,
      type,
      domain: domain ?? null,
      body: { ...cardBody, type },
    })
    .returning();

  return NextResponse.json({ card: created }, { status: 201 });
}
