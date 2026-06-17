import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { buildCardJson } from "@/lib/card-service";
import { requireSession } from "@/lib/session";
import {
  checkDomainWellKnown,
  cPanelHint,
  domainWellKnownUrl,
  nginxWellKnownSnippet,
} from "@/lib/well-known";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { handle } = await params;

  const [row] = await db
    .select()
    .from(cards)
    .where(and(eq(cards.handle, handle), eq(cards.userId, session.user.id)))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  if (!row.domain) {
    return NextResponse.json(
      { error: "Card has no domain" },
      { status: 400 }
    );
  }

  const registryCard = buildCardJson(row);
  const result = await checkDomainWellKnown(row.domain, registryCard);

  return NextResponse.json({
    ...result,
    well_known_url: domainWellKnownUrl(row.domain),
    download_url: `/api/v1/cards/${handle}/well-known`,
    nginx_snippet: nginxWellKnownSnippet(),
    cpanel_path: cPanelHint(),
  });
}
