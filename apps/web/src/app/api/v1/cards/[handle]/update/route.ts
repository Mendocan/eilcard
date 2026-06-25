import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { mergeCardBody } from "@/lib/card-service";
import { collectChangedFields, logCardChange } from "@/lib/card-change-log";
import { closePendingVerifications } from "@/lib/domain-verification-queue";
import { requireSession } from "@/lib/session";
import { getUserPlan, getUserTierLimits, validateProductCount } from "@/lib/user-plan";
import {
  getSchemaVersionForEdition,
  validateEditionForTier,
} from "@/lib/edition-gate";
import type { Offering } from "@digitalcard/schema";
import {
  validateBusinessFieldsForEdition,
  validateOfferingCount,
  countOfferingNodes,
} from "@/lib/offering-validation";
import { validateRegistryPlusFieldsForEdition } from "@/lib/registry-plus-validation";
import {
  patchOrganizationCardSchema,
  patchPersonCardSchema,
} from "@digitalcard/schema";
import { eq, and } from "drizzle-orm";
import { isDomainTaken, isRegistryCardIdTaken } from "@/lib/domain-check";
import { checkPlatformResourceAccess } from "@/lib/platform-operator";
import { normalizeDomain } from "@/lib/well-known";
import { API_ERROR_CODES } from "@/lib/api-error-codes";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json(
      { error: "Unauthorized", code: API_ERROR_CODES.UNAUTHORIZED },
      { status: 401 }
    );
  }

  const { handle } = await params;
  const raw = await request.json();

  const [existing] = await db
    .select()
    .from(cards)
    .where(and(eq(cards.handle, handle), eq(cards.userId, session.user.id)))
    .limit(1);

  if (!existing) {
    return NextResponse.json(
      { error: "Card not found", code: API_ERROR_CODES.CARD_NOT_FOUND },
      { status: 404 }
    );
  }

  const schema =
    existing.type === "organization"
      ? patchOrganizationCardSchema
      : patchPersonCardSchema;

  const parsed = schema.safeParse(raw);
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

  const { domain, edition, ...updates } = parsed.data;
  const nextEdition = edition ?? existing.edition;

  if (edition !== undefined) {
    const plan = await getUserPlan(session.user.id);
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
  }

  const nextDomain =
    domain !== undefined
      ? domain.trim()
        ? normalizeDomain(domain)
        : null
      : existing.domain;

  const domainChanged =
    domain !== undefined && (nextDomain ?? null) !== (existing.domain ?? null);

  const resourceCheck = await checkPlatformResourceAccess(session.user.id, {
    domain: nextDomain ?? undefined,
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

  if (
    domainChanged &&
    nextDomain &&
    (await isDomainTaken(nextDomain, existing.id))
  ) {
    return NextResponse.json(
      {
        error: "Domain already registered to another card",
        code: API_ERROR_CODES.DOMAIN_TAKEN,
      },
      { status: 409 }
    );
  }

  const nextCardId = nextDomain ?? existing.handle;
  if (domainChanged && nextCardId !== existing.cardId) {
    if (await isRegistryCardIdTaken(nextCardId, existing.id)) {
      return NextResponse.json(
        {
          error: "Registry card ID already in use",
          code: API_ERROR_CODES.REGISTRY_CARD_ID_TAKEN,
        },
        { status: 409 }
      );
    }
  }

  if (existing.type === "organization") {
    const businessCheck = validateBusinessFieldsForEdition(
      nextEdition,
      updates as Record<string, unknown>
    );
    if (!businessCheck.allowed) {
      return NextResponse.json(
        {
          error: "Business edition fields require Business or Registry+ edition",
          code: API_ERROR_CODES.BUSINESS_FIELDS_NOT_ALLOWED,
          edition: nextEdition,
        },
        { status: 403 }
      );
    }

    if ("offerings" in updates && updates.offerings) {
      const { limits } = await getUserTierLimits(session.user.id);
      if (!validateOfferingCount(updates.offerings, limits.maxOfferings)) {
        return NextResponse.json(
          {
            error: "Offering limit reached",
            code: API_ERROR_CODES.OFFERING_LIMIT,
            limit: limits.maxOfferings,
            count: countOfferingNodes(updates.offerings),
          },
          { status: 403 }
        );
      }
    }

    if ("products" in updates && updates.products) {
      const { limits } = await getUserTierLimits(session.user.id);
      if (!validateProductCount(updates.products.length, limits)) {
        return NextResponse.json(
          {
            error: "Product limit reached",
            code: API_ERROR_CODES.PRODUCT_LIMIT,
            limit: limits.maxProducts,
            count: updates.products.length,
          },
          { status: 403 }
        );
      }
    }
  }

  const registryPlusCheck = validateRegistryPlusFieldsForEdition(
    nextEdition,
    updates as Record<string, unknown>
  );
  if (!registryPlusCheck.allowed) {
    return NextResponse.json(
      {
        error: "JWS signatures require Registry+ edition",
        code: API_ERROR_CODES.SIGNATURES_NOT_ALLOWED,
        edition: nextEdition,
      },
      { status: 403 }
    );
  }

  const currentBody = existing.body as Record<string, unknown>;
  const { edition: _editionField, ...bodyUpdates } = updates as Record<
    string,
    unknown
  >;
  const nextBody = mergeCardBody(currentBody, bodyUpdates);

  const verificationRevoked = domainChanged && existing.verified;
  if (domainChanged) {
    await closePendingVerifications(existing.id);
  }

  const editionChanged = edition !== undefined && edition !== existing.edition;
  const nextSchemaVersion = editionChanged
    ? getSchemaVersionForEdition(nextEdition)
    : existing.schemaVersion;

  const changedFields = collectChangedFields(
    currentBody,
    nextBody,
    Object.keys(bodyUpdates),
    domainChanged
  );
  if (editionChanged && !changedFields.includes("edition")) {
    changedFields.push("edition");
  }
  if (verificationRevoked && !changedFields.includes("verified")) {
    changedFields.push("verified");
  }

  const [updated] = await db
    .update(cards)
    .set({
      body: nextBody,
      domain: nextDomain,
      cardId: domainChanged ? nextCardId : existing.cardId,
      edition: nextEdition,
      schemaVersion: nextSchemaVersion,
      verified: verificationRevoked ? false : existing.verified,
      updatedAt: new Date(),
    })
    .where(eq(cards.id, existing.id))
    .returning();

  await logCardChange(existing.id, session.user.id, changedFields);

  return NextResponse.json({ card: updated });
}
