import { Resolver } from "node:dns/promises";
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
    const resolver = new Resolver();
    resolver.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
    const records = await resolver.resolveTxt(domain);
    const expected = buildTxtRecord(token);
    return records.some((entry) => entry.join("").includes(expected));
  } catch {
    return false;
  }
}
