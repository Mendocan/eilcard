import { NextResponse } from "next/server";
import {
  clearAdminSessionCookie,
  getAdminSessionFromRequest,
} from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";

export async function POST(request: Request) {
  const session = await getAdminSessionFromRequest(request);
  if (session) {
    await logAdminAction("logout", "session", session.operatorId, {
      operatorId: session.operatorId,
    });
  }
  await clearAdminSessionCookie();
  return NextResponse.json({ ok: true });
}
