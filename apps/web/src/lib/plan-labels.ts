import type { Messages } from "@/lib/i18n/messages";
import type { PlanTier } from "@/lib/tier-limits";

export function planTierLabel(tier: PlanTier, d: Messages["dashboard"]): string {
  if (tier === "free") return d.planFree;
  if (tier === "verified") return d.planVerified;
  return d.planPro;
}
