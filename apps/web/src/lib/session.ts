import { auth } from "./auth";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/** Use in Route Handlers — `headers()` alone may miss the request cookies. */
export async function getSessionFromRequest(request: NextRequest) {
  return auth.api.getSession({
    headers: request.headers,
  });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
