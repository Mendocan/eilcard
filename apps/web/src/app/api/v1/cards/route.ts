import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import {
  canCreateCard,
  getUserPlan,
  validateProductCount,
} from "@/lib/user-plan";
import { createCardSchema } from "@digitalcard/schema";
import {
  getSchemaVersionForEdition,
  validateEditionForTier,
} from "@/lib/edition-gate";
import type { Offering } from "@digitalcard/schema";
import {
  validateBusinessFieldsForEdition,
  validateOfferingCount,
} from "@/lib/offering-validation";
import { validateRegistryPlusFieldsForEdition } from "@/lib/registry-plus-validation";
import { isDomainTaken } from "@/lib/domain-check";
import { checkPlatformResourceAccess } from "@/lib/platform-operator";
import { getClientIp } from "@/lib/client-ip";
import {
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { API_ERROR_CODES } from "@/lib/api-error-codes";

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json(
      { error: "Unauthorized", code: API_ERROR_CODES.UNAUTHORIZED },
      { status: 401 }
    );
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
      {
        error: "Validation failed",
        code: API_ERROR_CODES.VALIDATION_FAILED,
        issues: parsed.error.flatten(),
      },
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
        code: API_ERROR_CODES.RESERVED_PLATFORM,
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
        code: API_ERROR_CODES.PLAN_LIMIT,
        reason: createCheck.reason,
        tier: createCheck.tier,
        limits: createCheck.limits,
        currentCards: createCheck.currentCards,
        currentOrgCards: createCheck.currentOrgCards,
      },
      { status: 403 }
    );
  }

  const plan = await getUserPlan(session.user.id);
  const edition = data.edition ?? "core";
  const editionCheck = validateEditionForTier(plan.tier, edition, {
    enterpriseAddon: plan.enterpriseAddon,
  });
  if (!editionCheck.allowed) {
    return NextResponse.json(
      {
        error:
          editionCheck.reason === "enterprise_addon"
            ? "Registry+ edition requires enterprise add-on"
            : "Edition not allowed for current plan",
        code:
          editionCheck.reason === "enterprise_addon"
            ? API_ERROR_CODES.ENTERPRISE_ADDON_REQUIRED
            : API_ERROR_CODES.EDITION_NOT_ALLOWED,
        edition: editionCheck.edition,
        requiredTier: editionCheck.requiredTier,
        tier: plan.tier,
      },
      { status: 403 }
    );
  }

  const registryPlusCheck = validateRegistryPlusFieldsForEdition(
    edition,
    data as Record<string, unknown>
  );
  if (!registryPlusCheck.allowed) {
    const isCapabilities =
      registryPlusCheck.reason === "capabilities_not_allowed";
    return NextResponse.json(
      {
        error: isCapabilities
          ? "Capabilities require Registry+ edition"
          : "JWS signatures require Registry+ edition",
        code: isCapabilities
          ? API_ERROR_CODES.CAPABILITIES_NOT_ALLOWED
          : API_ERROR_CODES.SIGNATURES_NOT_ALLOWED,
        edition,
      },
      { status: 403 }
    );
  }

  if (data.type === "organization") {
    const orgPatch = data as Record<string, unknown>;
    const businessCheck = validateBusinessFieldsForEdition(edition, orgPatch);
    if (!businessCheck.allowed) {
      return NextResponse.json(
        {
          error: "Business edition fields require Business or Registry+ edition",
          code: API_ERROR_CODES.BUSINESS_FIELDS_NOT_ALLOWED,
          edition,
        },
        { status: 403 }
      );
    }

    const offerings = (data as { offerings?: Offering[] }).offerings;
    if (
      offerings?.length &&
      !validateOfferingCount(offerings, createCheck.limits.maxOfferings)
    ) {
      return NextResponse.json(
        {
          error: "Offering limit reached",
          code: API_ERROR_CODES.OFFERING_LIMIT,
          tier: createCheck.tier,
          limit: createCheck.limits.maxOfferings,
        },
        { status: 403 }
      );
    }
  }

  const productCount =
    data.type === "organization" && "products" in data
      ? (data.products?.length ?? 0)
      : 0;
  if (!validateProductCount(productCount, createCheck.limits)) {
    return NextResponse.json(
      {
        error: "Product limit reached",
        code: API_ERROR_CODES.PRODUCT_LIMIT,
        tier: createCheck.tier,
        limit: createCheck.limits.maxProducts,
        count: productCount,
      },
      { status: 403 }
    );
  }

  if (data.domain && (await isDomainTaken(data.domain))) {
    return NextResponse.json(
      {
        error: "Domain already registered to another card",
        code: API_ERROR_CODES.DOMAIN_TAKEN,
      },
      { status: 409 }
    );
  }

  const cardId = data.domain ?? data.handle;
  const { handle, domain, type, edition: _edition, ...cardBody } = data;
  const schemaVersion = getSchemaVersionForEdition(edition);

  const [created] = await db
    .insert(cards)
    .values({
      userId: session.user.id,
      handle,
      cardId,
      type,
      edition,
      schemaVersion,
      domain: domain ?? null,
      body: { ...cardBody, type },
    })
    .returning();

  return NextResponse.json({ card: created }, { status: 201 });
}
