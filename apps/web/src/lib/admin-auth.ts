import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import {
  adminHasPermission,
  canAccessAdminPath,
  type AdminPermission,
  type AdminRole,
  isAdminRole,
} from "@/lib/admin-rbac";
import { countAdminOperators } from "@/lib/admin-operators";

const COOKIE_NAME = "eil_admin_session";
const MAX_AGE_SEC = 7 * 24 * 60 * 60;

export type AdminSession = {
  operatorId: string;
  role: AdminRole;
};

function getAuthSecret(): string | null {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  return secret || null;
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function isAdminBootstrapReady(): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  const authSecret = getAuthSecret();
  return Boolean(adminPassword && adminPassword.length >= 8 && authSecret);
}

export async function isAdminConfigured(): Promise<boolean> {
  const operatorCount = await countAdminOperators();
  return operatorCount > 0 || isAdminBootstrapReady();
}

export function createAdminSessionToken(
  operatorId: string,
  role: AdminRole
): string | null {
  const secret = getAuthSecret();
  if (!secret) return null;
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const payload = `${exp}.${operatorId}.${role}`;
  const sig = signPayload(payload, secret);
  return `${payload}.${sig}`;
}

export function parseAdminSessionToken(
  token: string | undefined
): AdminSession | null {
  if (!token) return null;
  const secret = getAuthSecret();
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 4) return null;

  const [expStr, operatorId, role, sig] = parts;
  if (!expStr || !operatorId || !role || !sig || !isAdminRole(role)) {
    return null;
  }

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return null;

  const payload = `${expStr}.${operatorId}.${role}`;
  const expected = signPayload(payload, secret);
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return { operatorId, role };
}

export async function setAdminSessionCookie(
  operatorId: string,
  role: AdminRole
): Promise<boolean> {
  const token = createAdminSessionToken(operatorId, role);
  if (!token) return false;
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SEC,
    path: "/",
  });
  return true;
}

export async function clearAdminSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

function getTokenFromCookieHeader(cookieHeader: string): string | undefined {
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match?.[1];
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  return parseAdminSessionToken(jar.get(COOKIE_NAME)?.value);
}

export async function getAdminSessionFromRequest(
  request: Request
): Promise<AdminSession | null> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  return parseAdminSessionToken(getTokenFromCookieHeader(cookieHeader));
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

export async function requireAdminPage(path: string): Promise<AdminSession> {
  const session = await requireAdminSession();
  if (!canAccessAdminPath(session.role, path)) {
    redirect("/admin");
  }
  return session;
}

export async function requireAdminApi(
  request: Request,
  permission: AdminPermission
): Promise<AdminSession | NextResponse> {
  const session = await getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!adminHasPermission(session.role, permission)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return session;
}
