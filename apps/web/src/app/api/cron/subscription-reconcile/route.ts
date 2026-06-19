import { NextRequest, NextResponse } from "next/server";
import { reconcileAllExpiredSubscriptions } from "@/lib/subscription-sync";

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not set" }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const downgraded = await reconcileAllExpiredSubscriptions();
  return NextResponse.json({ ok: true, downgraded });
}
