import type { Messages } from "@/lib/i18n/messages";
import type { PlanTier } from "@/lib/tier-limits";
import type { UserPlanInfo } from "@/lib/user-plan";

export function planTierLabel(tier: PlanTier, d: Messages["dashboard"]): string {
  if (tier === "free") return d.planFree;
  if (tier === "verified") return d.planVerified;
  return d.planPro;
}

export function planDisplayLabel(plan: UserPlanInfo, d: Messages["dashboard"]): string {
  const displayTier = plan.planExpired ? plan.subscribedTier : plan.tier;
  const label = planTierLabel(displayTier, d);
  if (plan.planExpired) {
    return `${label} — ${d.planExpiredNote}`;
  }
  return label;
}
