import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { CustomerPortal } from "@polar-sh/nextjs";
import { getAppBaseUrl, getPolarServer } from "@/lib/polar-config";
import { getSession } from "@/lib/session";

const accessToken = process.env.POLAR_ACCESS_TOKEN?.trim();

const portalHandler =
  accessToken &&
  CustomerPortal({
    accessToken,
    server: getPolarServer(),
    returnUrl: `${getAppBaseUrl()}/dashboard`,
    getExternalCustomerId: async () => {
      const session = await getSession();
      if (!session) {
        throw new Error("Unauthorized");
      }
      return session.user.id;
    },
  });

export async function GET(request: NextRequest) {
  if (!portalHandler) {
    redirect("/dashboard");
  }

  const session = await getSession();
  if (!session) {
    redirect("/login?next=/portal");
  }

  try {
    return await portalHandler(request);
  } catch (err) {
    console.error("[portal] Polar customer portal error", err);
    redirect("/dashboard?portal_error=1");
  }
}
