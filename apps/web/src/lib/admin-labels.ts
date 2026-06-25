import type { Messages } from "@/lib/i18n/messages";
import type { VerificationQueueState } from "@/lib/domain-verification-queue";

export function verificationQueueStateLabel(
  state: VerificationQueueState,
  m: Messages["admin"]
): string {
  if (state === "dns_pending") return m.queueDnsPending;
  if (state === "awaiting_dns") return m.queueAwaitingDns;
  return m.queueNeedsDomain;
}

export function verificationStatusLabel(
  status: string,
  m: Messages["admin"]
): string {
  if (status === "verified") return m.verifiedBadge;
  if (status === "pending") return m.pendingBadge;
  if (status === "failed") return m.statusFailed;
  return status;
}

export function cardTypeLabel(type: string, m: Messages["admin"]): string {
  if (type === "organization") return m.typeOrganization;
  if (type === "person") return m.typePerson;
  return type;
}

export function auditActionLabel(action: string, m: Messages["admin"]): string {
  const labels: Record<string, string> = {
    login: m.auditActionLogin,
    logout: m.auditActionLogout,
    "card.verify": m.auditActionCardVerify,
    "card.revoke": m.auditActionCardRevoke,
    "card.delete": m.auditActionCardDelete,
    "card.dns_check": m.auditActionCardDnsCheck,
    "user.plan": m.auditActionUserPlan,
    "user.enterprise_addon": m.auditActionUserPlan,
    "team.invite": m.auditActionTeamInvite,
    "team.password_change": m.auditActionPasswordChange,
  };
  return labels[action] ?? action;
}

export function tierLabel(tier: string, m: Messages["admin"]): string {
  if (tier === "free") return m.tierFree;
  if (tier === "verified") return m.tierVerified;
  if (tier === "pro") return m.tierPro;
  return tier;
}
