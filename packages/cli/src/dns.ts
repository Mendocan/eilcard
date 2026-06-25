import { Resolver } from "node:dns/promises";
import { normalizeDomain } from "./urls.js";

const TOKEN_PREFIX = "digitalcard-verify=";

export type DnsVerifyResult = {
  domain: string;
  ok: boolean;
  expected?: string;
  found: string[];
  message: string;
};

export async function verifyDnsTxt(
  domain: string,
  token?: string
): Promise<DnsVerifyResult> {
  const normalized = normalizeDomain(domain);
  const resolver = new Resolver();
  resolver.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);

  let records: string[][] = [];
  try {
    records = await resolver.resolveTxt(normalized);
  } catch {
    return {
      domain: normalized,
      ok: false,
      found: [],
      message: `No TXT records found for ${normalized}`,
    };
  }

  const flat = records.map((entry) => entry.join(""));
  const verifyRecords = flat.filter((r) => r.includes(TOKEN_PREFIX));

  if (token) {
    const expected = `${TOKEN_PREFIX}${token}`;
    const ok = flat.some((r) => r.includes(expected));
    return {
      domain: normalized,
      ok,
      expected,
      found: verifyRecords,
      message: ok
        ? `DNS TXT verification token found for ${normalized}`
        : `Expected TXT containing ${expected}`,
    };
  }

  const ok = verifyRecords.length > 0;
  return {
    domain: normalized,
    ok,
    found: verifyRecords,
    message: ok
      ? `Found ${verifyRecords.length} EIL verification TXT record(s) on ${normalized}`
      : `No ${TOKEN_PREFIX} TXT record on ${normalized}`,
  };
}
