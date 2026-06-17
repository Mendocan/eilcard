import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  getUserPlan,
  isValidPlanTier,
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

  const body = (await request.json()) as { tier?: string };
  if (!body.tier || !isValidPlanTier(body.tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const previous = await getUserPlan(id);
  await setUserPlanTier(id, body.tier);

  await logAdminAction("user.plan", "user", id, {
    previous: previous.tier,
    next: body.tier,
  });

  return NextResponse.json({ ok: true, tier: body.tier });
}
