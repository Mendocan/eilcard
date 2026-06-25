import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminInvites, adminOperators } from "@/lib/db/schema";
import type { AdminRole } from "@/lib/admin-rbac";
import {
  createInviteToken,
  hashAdminPassword,
  hashInviteToken,
  verifyAdminPassword,
} from "@/lib/admin-password";

export type AdminOperator = typeof adminOperators.$inferSelect;

export async function countAdminOperators(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(adminOperators);
  return row?.count ?? 0;
}

export async function findOperatorByEmail(
  email: string
): Promise<AdminOperator | null> {
  const normalized = email.trim().toLowerCase();
  const [row] = await db
    .select()
    .from(adminOperators)
    .where(eq(adminOperators.email, normalized))
    .limit(1);
  return row ?? null;
}

export async function findOperatorById(
  id: string
): Promise<AdminOperator | null> {
  const [row] = await db
    .select()
    .from(adminOperators)
    .where(eq(adminOperators.id, id))
    .limit(1);
  return row ?? null;
}

export async function listAdminOperators(): Promise<AdminOperator[]> {
  return db
    .select()
    .from(adminOperators)
    .orderBy(adminOperators.createdAt);
}

export async function authenticateOperator(
  email: string,
  password: string
): Promise<AdminOperator | null> {
  const operator = await findOperatorByEmail(email);
  if (!operator) return null;
  const ok = await verifyAdminPassword(password, operator.passwordHash);
  if (!ok) return null;

  await db
    .update(adminOperators)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(adminOperators.id, operator.id));

  return operator;
}

export async function createAdminOperator(input: {
  email: string;
  name: string;
  password: string;
  role: AdminRole;
}): Promise<AdminOperator> {
  const passwordHash = await hashAdminPassword(input.password);
  const [row] = await db
    .insert(adminOperators)
    .values({
      email: input.email.trim().toLowerCase(),
      name: input.name.trim(),
      passwordHash,
      role: input.role,
    })
    .returning();
  return row;
}

export async function updateOperatorPassword(
  operatorId: string,
  password: string
): Promise<void> {
  const passwordHash = await hashAdminPassword(password);
  await db
    .update(adminOperators)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(adminOperators.id, operatorId));
}

export async function createAdminInvite(input: {
  email: string;
  role: AdminRole;
  invitedByOperatorId: string;
}): Promise<{ token: string; inviteId: string }> {
  const token = createInviteToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [row] = await db
    .insert(adminInvites)
    .values({
      email: input.email.trim().toLowerCase(),
      role: input.role,
      tokenHash: hashInviteToken(token),
      invitedByOperatorId: input.invitedByOperatorId,
      expiresAt,
    })
    .returning({ id: adminInvites.id });
  return { token, inviteId: row.id };
}

export async function acceptAdminInvite(input: {
  token: string;
  name: string;
  password: string;
}): Promise<AdminOperator | null> {
  const tokenHash = hashInviteToken(input.token);
  const [invite] = await db
    .select()
    .from(adminInvites)
    .where(eq(adminInvites.tokenHash, tokenHash))
    .limit(1);

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return null;
  }

  const existing = await findOperatorByEmail(invite.email);
  if (existing) return null;

  const operator = await createAdminOperator({
    email: invite.email,
    name: input.name,
    password: input.password,
    role: invite.role as AdminRole,
  });

  await db
    .update(adminInvites)
    .set({ acceptedAt: new Date() })
    .where(eq(adminInvites.id, invite.id));

  return operator;
}

export async function findValidInviteByToken(token: string) {
  const tokenHash = hashInviteToken(token);
  const [invite] = await db
    .select()
    .from(adminInvites)
    .where(eq(adminInvites.tokenHash, tokenHash))
    .limit(1);
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return null;
  }
  return invite;
}
