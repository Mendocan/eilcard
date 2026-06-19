/** Env-only helpers — safe for client bundles (no DB). */

export const RESERVED_HANDLES = ["eilcard"] as const;

export function getPlatformOperatorEmail(): string {
  const fromEnv = process.env.PLATFORM_OPERATOR_EMAIL?.trim().toLowerCase();
  if (fromEnv) return fromEnv;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://eilcard.com";
  try {
    return `platform@${new URL(appUrl).hostname.toLowerCase()}`;
  } catch {
    return "platform@eilcard.com";
  }
}

export function getReservedDomains(): string[] {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://eilcard.com";
  try {
    return [new URL(appUrl).hostname.toLowerCase()];
  } catch {
    return ["eilcard.com"];
  }
}

export function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^www\./, "");
}

export function isReservedHandle(handle: string): boolean {
  return (RESERVED_HANDLES as readonly string[]).includes(
    handle.trim().toLowerCase()
  );
}

export function isReservedDomain(domain: string): boolean {
  return getReservedDomains().includes(normalizeDomain(domain));
}
