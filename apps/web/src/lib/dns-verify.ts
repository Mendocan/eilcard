import { promises as dns } from "node:dns";
import { randomBytes } from "node:crypto";

const TOKEN_PREFIX = "digitalcard-verify=";

export function generateVerificationToken(): string {
  return randomBytes(16).toString("hex");
}

export function buildTxtRecord(token: string): string {
  return `${TOKEN_PREFIX}${token}`;
}

export async function verifyDnsTxt(
  domain: string,
  token: string
): Promise<boolean> {
  try {
    const records = await dns.resolveTxt(domain);
    const expected = buildTxtRecord(token);
    return records.some((entry) => entry.join("").includes(expected));
  } catch {
    return false;
  }
}
