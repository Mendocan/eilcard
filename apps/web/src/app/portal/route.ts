import { NextRequest, NextResponse } from "next/server";
import { CustomerPortal } from "@polar-sh/nextjs";
import { getAppBaseUrl, getPolarServer } from "@/lib/polar-config";
import { getSessionFromRequest } from "@/lib/session";

const accessToken = process.env.POLAR_ACCESS_TOKEN?.trim();

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function GET(request: NextRequest) {
  if (!accessToken) {
    return redirectTo(request, "/dashboard");
  }

  const session = await getSessionFromRequest(request);
  if (!session) {
    return redirectTo(request, "/login?next=/portal");
  }

  const userId = session.user.id;

  const portalHandler = CustomerPortal({
    accessToken,
    server: getPolarServer(),
    returnUrl: `${getAppBaseUrl()}/dashboard`,
    getExternalCustomerId: async () => userId,
  });

  try {
    return await portalHandler(request);
  } catch (err) {
    console.error("[portal] Polar customer portal error", err);
    return redirectTo(request, "/dashboard?portal_error=1");
  }
}
