import type { CardEdition } from "@digitalcard/schema";
import { EDITION_SCHEMA_MAP } from "@digitalcard/schema";
import {
  PLAN_TIERS,
  TIER_LIMITS,
  type PlanTier,
  type TierLimits,
} from "@/lib/tier-limits";

const EDITION_MIN_TIER: Record<CardEdition, PlanTier> = {
  core: "free",
  business: "verified",
  registry_plus: "pro",
};

export function canUseEdition(tier: PlanTier, edition: CardEdition): boolean {
  return TIER_LIMITS[tier].allowedEditions.includes(edition);
}

export function getMinTierForEdition(edition: CardEdition): PlanTier {
  return EDITION_MIN_TIER[edition];
}

export function getSchemaVersionForEdition(edition: CardEdition): string {
  return EDITION_SCHEMA_MAP[edition];
}

export type EditionValidationResult =
  | { allowed: true }
  | { allowed: false; requiredTier: PlanTier; edition: CardEdition };

export function validateEditionForTier(
  tier: PlanTier,
  edition: CardEdition
): EditionValidationResult {
  if (canUseEdition(tier, edition)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    requiredTier: getMinTierForEdition(edition),
    edition,
  };
}

export function getAllowedEditionsForTier(tier: PlanTier): CardEdition[] {
  return TIER_LIMITS[tier].allowedEditions;
}

export function isValidCardEdition(value: string): value is CardEdition {
  return value === "core" || value === "business" || value === "registry_plus";
}

export function getTierLimitsWithEditions(tier: PlanTier): TierLimits {
  return TIER_LIMITS[tier];
}

export { PLAN_TIERS };
