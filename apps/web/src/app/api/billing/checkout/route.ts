import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import {
  getAppBaseUrl,
  isPolarCheckoutConfigured,
  polarProductIdForTier,
} from "@/lib/polar-config";
import { getPolarClient } from "@/lib/polar";
import { requireSession } from "@/lib/session";
import { isValidPlanTier } from "@/lib/user-plan";
import type { PlanTier } from "@/lib/tier-limits";

export async function GET(request: NextRequest) {
  if (!isPolarCheckoutConfigured()) {
    return NextResponse.json(
      { error: "Checkout is not configured yet. Email billing@eilcard.com." },
      { status: 503 }
    );
  }

  let session;
  try {
    session = await requireSession();
  } catch {
    redirect("/login?next=/pricing");
  }

  const tierParam = request.nextUrl.searchParams.get("tier") ?? "verified";
  if (!isValidPlanTier(tierParam) || tierParam === "free") {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const productId = polarProductIdForTier(tierParam as PlanTier);
  if (!productId) {
    return NextResponse.json(
      { error: "Product not configured for this tier" },
      { status: 503 }
    );
  }

  const appUrl = getAppBaseUrl();
  const polar = getPolarClient();

  const checkout = await polar.checkouts.create({
    products: [productId],
    customerEmail: session.user.email,
    externalCustomerId: session.user.id,
    successUrl: `${appUrl}/dashboard?checkout=success`,
    returnUrl: `${appUrl}/pricing`,
  });

  if (!checkout.url) {
    return NextResponse.json(
      { error: "Checkout URL missing from Polar" },
      { status: 502 }
    );
  }

  redirect(checkout.url);
}
