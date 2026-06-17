import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "eil_admin_session";
const MAX_AGE_SEC = 7 * 24 * 60 * 60;

function getSecrets() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const authSecret = process.env.BETTER_AUTH_SECRET;
  return { adminPassword, authSecret };
}

export function isAdminConfigured(): boolean {
  const { adminPassword, authSecret } = getSecrets();
  return Boolean(adminPassword && adminPassword.length >= 8 && authSecret);
}

function sign(exp: number, authSecret: string, adminPassword: string): string {
  return createHmac("sha256", authSecret)
    .update(`${exp}:${adminPassword}`)
    .digest("hex");
}

export function createAdminSessionToken(): string | null {
  const { adminPassword, authSecret } = getSecrets();
  if (!adminPassword || !authSecret) return null;
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const sig = sign(exp, authSecret, adminPassword);
  return `${exp}.${sig}`;
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const { adminPassword, authSecret } = getSecrets();
  if (!adminPassword || !authSecret) return false;

  const [expStr, sig] = token.split(".");
  if (!expStr || !sig) return false;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;

  const expected = sign(exp, authSecret, adminPassword);
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function verifyAdminPassword(password: string): boolean {
  const { adminPassword } = getSecrets();
  if (!adminPassword) return false;
  try {
    const a = Buffer.from(password);
    const b = Buffer.from(adminPassword);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function setAdminSessionCookie(): Promise<boolean> {
  const token = createAdminSessionToken();
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

export async function requireAdminSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!verifyAdminSessionToken(token)) {
    redirect("/admin/login");
  }
}

export async function getAdminSession(): Promise<boolean> {
  const jar = await cookies();
  return verifyAdminSessionToken(jar.get(COOKIE_NAME)?.value);
}

export async function isAdminRequest(request: Request): Promise<boolean> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return verifyAdminSessionToken(match?.[1]);
}
