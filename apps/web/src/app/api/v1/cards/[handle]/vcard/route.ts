import { NextRequest, NextResponse } from "next/server";
import { getCardByHandle, buildCardJson } from "@/lib/card-service";
import { getClientIp } from "@/lib/client-ip";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

function toVCardString(card: Record<string, unknown>): string {
  const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0"];

  if (card.type === "person") {
    const name = card.name as { full: string; family?: string; given?: string };
    lines.push(`FN:${name.full}`);
    if (name.family || name.given) {
      lines.push(`N:${name.family ?? ""};${name.given ?? ""};;;`);
    }
  } else {
    const name = card.name as { official: string };
    lines.push(`FN:${name.official}`);
    lines.push(`ORG:${name.official}`);
  }

  const contact = card.contact as {
    phone?: string;
    email?: string;
    website?: string;
  };

  if (contact?.phone) lines.push(`TEL:${contact.phone}`);
  if (contact?.email) lines.push(`EMAIL:${contact.email}`);
  if (contact?.website) lines.push(`URL:${contact.website}`);

  if (card.human_url) lines.push(`URL:${card.human_url}`);

  lines.push("END:VCARD");
  return lines.join("\r\n");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`public:ip:${ip}`, RATE_LIMITS.publicRead.limit, RATE_LIMITS.publicRead.windowMs);
  if (!rl.success) return rateLimitResponse(rl);

  const { handle } = await params;
  const row = await getCardByHandle(handle);

  if (!row) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const card = buildCardJson(row);
  const vcf = toVCardString(card as unknown as Record<string, unknown>);

  return new NextResponse(vcf, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${handle}.vcf"`,
    },
  });
}
