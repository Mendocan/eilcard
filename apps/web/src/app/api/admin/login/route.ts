import { NextResponse } from "next/server";
import {
  isAdminConfigured,
  setAdminSessionCookie,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin not configured" },
      { status: 503 }
    );
  }

  const body = (await request.json()) as { password?: string };
  if (!body.password || !verifyAdminPassword(body.password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const ok = await setAdminSessionCookie();
  if (!ok) {
    return NextResponse.json({ error: "Session error" }, { status: 500 });
  }

  await logAdminAction("login", "session", "admin");

  return NextResponse.json({ ok: true });
}
