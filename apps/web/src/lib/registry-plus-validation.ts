import type { CardEdition } from "@digitalcard/schema";

export function isRegistryPlusEdition(edition: CardEdition): boolean {
  return edition === "registry_plus";
}

export function patchHasRegistryPlusFields(patch: Record<string, unknown>): boolean {
  return "signatures" in patch || "capabilities" in patch;
}

export type RegistryPlusFieldValidation =
  | { allowed: true }
  | {
      allowed: false;
      reason: "signatures_not_allowed" | "capabilities_not_allowed";
      edition: CardEdition;
    };

export function validateRegistryPlusFieldsForEdition(
  edition: CardEdition,
  patch: Record<string, unknown>
): RegistryPlusFieldValidation {
  if ("signatures" in patch && !isRegistryPlusEdition(edition)) {
    return {
      allowed: false,
      reason: "signatures_not_allowed",
      edition,
    };
  }

  if ("capabilities" in patch && !isRegistryPlusEdition(edition)) {
    return {
      allowed: false,
      reason: "capabilities_not_allowed",
      edition,
    };
  }

  return { allowed: true };
}
