import { db } from "@/lib/db";
import { adminAuditLogs } from "@/lib/db/schema";

export type AdminAuditAction =
  | "login"
  | "logout"
  | "card.verify"
  | "card.revoke"
  | "card.delete"
  | "card.dns_check"
  | "user.plan"
  | "user.enterprise_addon"
  | "team.invite"
  | "team.password_change";

export async function logAdminAction(
  action: AdminAuditAction,
  targetType: string,
  targetId: string,
  options?: {
    details?: Record<string, unknown>;
    operatorId?: string;
  }
) {
  await db.insert(adminAuditLogs).values({
    action,
    targetType,
    targetId,
    details: options?.details ?? null,
    operatorId: options?.operatorId ?? null,
  });
}
