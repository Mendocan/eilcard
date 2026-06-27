import type { CardEdition } from "@digitalcard/schema";

export function isRegistryPlusEdition(edition: CardEdition): boolean {
  return edition === "registry_plus";
}

export function patchHasRegistryPlusFields(patch: Record<string, unknown>): boolean {
  return (
    "signatures" in patch || "capabilities" in patch || "access_policy" in patch
  );
}

export type RegistryPlusFieldValidation =
  | { allowed: true }
  | {
      allowed: false;
      reason:
        | "signatures_not_allowed"
        | "capabilities_not_allowed"
        | "access_policy_not_allowed";
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

  if ("access_policy" in patch && !isRegistryPlusEdition(edition)) {
    return {
      allowed: false,
      reason: "access_policy_not_allowed",
      edition,
    };
  }

  return { allowed: true };
}

export const REGISTRY_PLUS_FIELD_ERRORS: Record<
  Extract<RegistryPlusFieldValidation, { allowed: false }>["reason"],
  string
> = {
  signatures_not_allowed: "JWS signatures require Registry+ edition",
  capabilities_not_allowed: "Capabilities require Registry+ edition",
  access_policy_not_allowed: "Access policy requires Registry+ edition",
};
