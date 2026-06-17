import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://eilcard.com";

export function GET() {
  const body = [
    "Contact: mailto:security@eilcard.com",
    `Policy: ${BASE_URL}/insights/eil-whitepaper`,
    `Preferred-Languages: en, tr`,
    "Canonical: https://www.rfc-editor.org/rfc/rfc9116.html",
    "",
    "# EIL Card — Entity Identity Layer registry",
    "# Report vulnerabilities responsibly. Do not test against production without permission.",
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
