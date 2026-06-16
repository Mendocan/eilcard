import { NextResponse } from "next/server";
import { LOCALES } from "@/lib/i18n/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { locale?: string };
  if (!body.locale || !LOCALES.includes(body.locale as "en" | "tr")) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("locale", body.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
