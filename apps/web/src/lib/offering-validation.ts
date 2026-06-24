import type { CardEdition, Offering } from "@digitalcard/schema";

export function isBusinessEdition(edition: CardEdition): boolean {
  return edition === "business" || edition === "registry_plus";
}

export function patchHasBusinessFields(patch: Record<string, unknown>): boolean {
  return "offerings" in patch || "content_locale" in patch;
}

export type BusinessFieldValidation =
  | { allowed: true }
  | {
      allowed: false;
      reason: "business_fields_on_core" | "offerings_not_allowed";
      edition: CardEdition;
    };

export function validateBusinessFieldsForEdition(
  edition: CardEdition,
  patch: Record<string, unknown>
): BusinessFieldValidation {
  if (!patchHasBusinessFields(patch)) {
    return { allowed: true };
  }

  if (!isBusinessEdition(edition)) {
    return {
      allowed: false,
      reason: "business_fields_on_core",
      edition,
    };
  }

  return { allowed: true };
}

export function countOfferingNodes(offerings: Offering[]): number {
  let count = 0;

  function walk(nodes: Offering[]) {
    for (const node of nodes) {
      count += 1;
      if (node.items?.length) {
        walk(node.items);
      }
    }
  }

  walk(offerings);
  return count;
}

export function validateOfferingCount(
  offerings: Offering[],
  maxOfferings: number
): boolean {
  return countOfferingNodes(offerings) <= maxOfferings;
}
