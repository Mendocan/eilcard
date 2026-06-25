import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import {
  createAdminInvite,
  listAdminOperators,
} from "@/lib/admin-operators";
import { isAdminRole } from "@/lib/admin-rbac";
import { getPlatformConfig } from "@/lib/platform-config";
import { sendTransactionalEmail } from "@/lib/transactional-email";

export async function GET(request: Request) {
  const session = await requireAdminApi(request, "team.manage");
  if (session instanceof NextResponse) return session;

  const operators = await listAdminOperators();
  return NextResponse.json({
    operators: operators.map((op) => ({
      id: op.id,
      email: op.email,
      name: op.name,
      role: op.role,
      createdAt: op.createdAt,
      lastLoginAt: op.lastLoginAt,
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireAdminApi(request, "team.manage");
  if (session instanceof NextResponse) return session;

  const body = (await request.json()) as { email?: string; role?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email || !body.role || !isAdminRole(body.role)) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
  }

  const { token } = await createAdminInvite({
    email,
    role: body.role,
    invitedByOperatorId: session.operatorId,
  });

  const appUrl = getPlatformConfig().appUrl.replace(/\/$/, "");
  const inviteUrl = `${appUrl}/admin/accept-invite?token=${token}`;

  const mail = await sendTransactionalEmail({
    to: email,
    subject: "EIL Card admin invitation",
    text: [
      "You have been invited to the EIL Card admin console.",
      "",
      `Accept invitation: ${inviteUrl}`,
      "",
      "This link expires in 7 days.",
    ].join("\n"),
  });

  await logAdminAction("team.invite", "operator", email, {
    operatorId: session.operatorId,
    details: { role: body.role, emailSent: mail.sent },
  });

  return NextResponse.json({
    ok: true,
    emailSent: mail.sent,
    inviteUrl: mail.sent ? undefined : inviteUrl,
  });
}
