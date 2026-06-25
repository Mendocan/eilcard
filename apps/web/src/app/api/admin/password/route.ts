import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import {
  findOperatorById,
  updateOperatorPassword,
} from "@/lib/admin-operators";
import { verifyAdminPassword } from "@/lib/admin-password";

export async function PATCH(request: Request) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!body.currentPassword || !body.newPassword || body.newPassword.length < 8) {
    return NextResponse.json({ error: "Invalid password" }, { status: 400 });
  }

  const operator = await findOperatorById(session.operatorId);
  if (!operator) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const valid = await verifyAdminPassword(
    body.currentPassword,
    operator.passwordHash
  );
  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  await updateOperatorPassword(session.operatorId, body.newPassword);

  await logAdminAction("team.password_change", "operator", session.operatorId, {
    operatorId: session.operatorId,
  });

  return NextResponse.json({ ok: true });
}
