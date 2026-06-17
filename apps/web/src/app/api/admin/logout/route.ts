import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";

export async function POST() {
  await logAdminAction("logout", "session", "admin");
  await clearAdminSessionCookie();
  return NextResponse.json({ ok: true });
}
