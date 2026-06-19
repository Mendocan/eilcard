import { eq, and, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { normalizeDomain } from "@/lib/well-known";

export async function isDomainTaken(
  domain: string,
  excludeCardId?: string
): Promise<boolean> {
  const normalized = normalizeDomain(domain);
  if (!normalized) return false;

  const conditions = [eq(cards.domain, normalized)];
  if (excludeCardId) {
    conditions.push(ne(cards.id, excludeCardId));
  }

  const [row] = await db
    .select({ id: cards.id })
    .from(cards)
    .where(and(...conditions))
    .limit(1);

  return Boolean(row);
}

export async function isRegistryCardIdTaken(
  cardId: string,
  excludeCardUuid?: string
): Promise<boolean> {
  const normalized = cardId.trim().toLowerCase();
  if (!normalized) return false;

  const conditions = [eq(cards.cardId, normalized)];
  if (excludeCardUuid) {
    conditions.push(ne(cards.id, excludeCardUuid));
  }

  const [row] = await db
    .select({ id: cards.id })
    .from(cards)
    .where(and(...conditions))
    .limit(1);

  return Boolean(row);
}
