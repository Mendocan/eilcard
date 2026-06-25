import { NextResponse } from "next/server";
import {
  isAdminConfigured,
  setAdminSessionCookie,
} from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import { authenticateOperator } from "@/lib/admin-operators";

export async function POST(request: Request) {
  if (!(await isAdminConfigured())) {
    return NextResponse.json(
      { error: "Admin not configured" },
      { status: 503 }
    );
  }

  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };

  if (!body.email?.trim() || !body.password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const operator = await authenticateOperator(body.email, body.password);
  if (!operator) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ok = await setAdminSessionCookie(operator.id, operator.role);
  if (!ok) {
    return NextResponse.json({ error: "Session error" }, { status: 500 });
  }

  await logAdminAction("login", "session", operator.id, {
    operatorId: operator.id,
    details: { email: operator.email },
  });

  return NextResponse.json({
    ok: true,
    role: operator.role,
    name: operator.name,
  });
}
