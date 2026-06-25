import { NextResponse } from "next/server";
import {
  acceptAdminInvite,
  findValidInviteByToken,
} from "@/lib/admin-operators";
import { setAdminSessionCookie } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const invite = await findValidInviteByToken(token);
  if (!invite) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
  }

  return NextResponse.json({
    email: invite.email,
    role: invite.role,
    expiresAt: invite.expiresAt,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    token?: string;
    name?: string;
    password?: string;
  };

  if (!body.token?.trim() || !body.name?.trim() || !body.password) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (body.password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const operator = await acceptAdminInvite({
    token: body.token.trim(),
    name: body.name.trim(),
    password: body.password,
  });

  if (!operator) {
    return NextResponse.json(
      { error: "Invalid or expired invite" },
      { status: 400 }
    );
  }

  const ok = await setAdminSessionCookie(operator.id, operator.role);
  if (!ok) {
    return NextResponse.json({ error: "Session error" }, { status: 500 });
  }

  await logAdminAction("login", "session", operator.id, {
    operatorId: operator.id,
    details: { via: "invite", email: operator.email },
  });

  return NextResponse.json({
    ok: true,
    role: operator.role,
    name: operator.name,
  });
}
