import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { mergeCardBody } from "@/lib/card-service";
import { requireSession } from "@/lib/session";
import { getUserTierLimits, validateProductCount } from "@/lib/user-plan";
import {
  patchOrganizationCardSchema,
  patchPersonCardSchema,
} from "@digitalcard/schema";
import { eq, and } from "drizzle-orm";
import { isDomainTaken } from "@/lib/domain-check";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { handle } = await params;
  const raw = await request.json();

  const [existing] = await db
    .select()
    .from(cards)
    .where(and(eq(cards.handle, handle), eq(cards.userId, session.user.id)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const schema =
    existing.type === "organization"
      ? patchOrganizationCardSchema
      : patchPersonCardSchema;

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { domain, ...updates } = parsed.data;

  if (domain && domain !== existing.domain && (await isDomainTaken(domain, existing.id))) {
    return NextResponse.json(
      { error: "Domain already registered to another card" },
      { status: 409 }
    );
  }

  if (
    existing.type === "organization" &&
    "products" in updates &&
    updates.products
  ) {
    const { limits } = await getUserTierLimits(session.user.id);
    if (!validateProductCount(updates.products.length, limits)) {
      return NextResponse.json(
        {
          error: "Product limit reached",
          limit: limits.maxProducts,
          count: updates.products.length,
        },
        { status: 403 }
      );
    }
  }

  const currentBody = existing.body as Record<string, unknown>;
  const nextBody = mergeCardBody(currentBody, updates as Record<string, unknown>);

  const [updated] = await db
    .update(cards)
    .set({
      body: nextBody,
      domain: domain !== undefined ? domain : existing.domain,
      updatedAt: new Date(),
    })
    .where(eq(cards.id, existing.id))
    .returning();

  return NextResponse.json({ card: updated });
}
