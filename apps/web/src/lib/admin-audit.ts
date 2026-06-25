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
  | "user.enterprise_addon";

export async function logAdminAction(
  action: AdminAuditAction,
  targetType: string,
  targetId: string,
  details?: Record<string, unknown>
) {
  await db.insert(adminAuditLogs).values({
    action,
    targetType,
    targetId,
    details: details ?? null,
  });
}
