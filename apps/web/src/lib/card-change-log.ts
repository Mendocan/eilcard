import { db } from "@/lib/db";
import { cardChangeLogs } from "@/lib/db/schema";

export function collectChangedFields(
  existingBody: Record<string, unknown>,
  nextBody: Record<string, unknown>,
  patchKeys: string[],
  domainChanged: boolean
): string[] {
  const fields: string[] = [];
  if (domainChanged) fields.push("domain");

  for (const key of patchKeys) {
    if (key === "domain") continue;
    if (JSON.stringify(existingBody[key]) !== JSON.stringify(nextBody[key])) {
      fields.push(key);
    }
  }

  return fields;
}

export async function logCardChange(
  cardId: string,
  userId: string,
  changedFields: string[]
) {
  if (changedFields.length === 0) return;

  await db.insert(cardChangeLogs).values({
    cardId,
    userId,
    changedFields,
  });
}
