import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { cards, users } from "@/lib/db/schema";
import {
  getPlatformOperatorEmail,
  isReservedDomain,
  isReservedHandle,
} from "@/lib/platform-operator-env";

export {
  getPlatformOperatorEmail,
  getReservedDomains,
  isReservedDomain,
  isReservedHandle,
  normalizeDomain,
  RESERVED_HANDLES,
} from "@/lib/platform-operator-env";

export type PlatformResourceDenyReason = "reserved_handle" | "reserved_domain";

export type PlatformResourceCheck =
  | { allowed: true }
  | { allowed: false; reason: PlatformResourceDenyReason };

export async function isPlatformOperatorUser(userId: string): Promise<boolean> {
  const [row] = await db
    .select({
      isPlatformOperator: users.isPlatformOperator,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) return false;
  if (row.isPlatformOperator) return true;

  return row.email.trim().toLowerCase() === getPlatformOperatorEmail();
}

export async function checkPlatformResourceAccess(
  userId: string,
  params: { handle?: string; domain?: string | null }
): Promise<PlatformResourceCheck> {
  if (await isPlatformOperatorUser(userId)) {
    return { allowed: true };
  }

  if (params.handle && isReservedHandle(params.handle)) {
    return { allowed: false, reason: "reserved_handle" };
  }

  if (params.domain && isReservedDomain(params.domain)) {
    return { allowed: false, reason: "reserved_domain" };
  }

  return { allowed: true };
}

export type PlatformOperatorStatus = {
  expectedEmail: string;
  userFound: boolean;
  isDesignated: boolean;
  userId: string | null;
  userName: string | null;
  cardCount: number;
};

export async function getPlatformOperatorStatus(): Promise<PlatformOperatorStatus> {
  const expectedEmail = getPlatformOperatorEmail();

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      isPlatformOperator: users.isPlatformOperator,
    })
    .from(users)
    .where(sql`lower(${users.email}) = ${expectedEmail}`)
    .limit(1);

  if (!user) {
    return {
      expectedEmail,
      userFound: false,
      isDesignated: false,
      userId: null,
      userName: null,
      cardCount: 0,
    };
  }

  const [countRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(cards)
    .where(eq(cards.userId, user.id));

  return {
    expectedEmail,
    userFound: true,
    isDesignated: user.isPlatformOperator,
    userId: user.id,
    userName: user.name,
    cardCount: countRow?.c ?? 0,
  };
}
