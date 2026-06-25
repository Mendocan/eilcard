import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  getUserPlan,
  isValidPlanTier,
  setUserEnterpriseAddon,
  setUserPlanTier,
} from "@/lib/user-plan";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    tier?: string;
    enterpriseAddon?: boolean;
  };

  if (body.tier === undefined && body.enterpriseAddon === undefined) {
    return NextResponse.json({ error: "No changes requested" }, { status: 400 });
  }

  const previous = await getUserPlan(id);

  if (body.tier !== undefined) {
    if (!isValidPlanTier(body.tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }
    await setUserPlanTier(id, body.tier);
    await logAdminAction("user.plan", "user", id, {
      previous: previous.subscribedTier,
      next: body.tier,
    });
  }

  if (body.enterpriseAddon !== undefined) {
    await setUserEnterpriseAddon(id, body.enterpriseAddon);
    await logAdminAction("user.enterprise_addon", "user", id, {
      previous: previous.enterpriseAddon,
      next: body.enterpriseAddon,
    });
  }

  const next = await getUserPlan(id);

  return NextResponse.json({
    ok: true,
    tier: next.subscribedTier,
    enterpriseAddon: next.enterpriseAddon,
  });
}
