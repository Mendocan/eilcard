export function normalizeDomain(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

export function domainWellKnownUrl(domain: string): string {
  return `https://${normalizeDomain(domain)}/.well-known/digital-card`;
}

export function registryResolveUrl(registry: string, domain: string): string {
  const base = registry.replace(/\/$/, "");
  return `${base}/api/v1/resolve?domain=${encodeURIComponent(normalizeDomain(domain))}`;
}

export function registryCardUrl(registry: string, handle: string): string {
  const base = registry.replace(/\/$/, "");
  return `${base}/api/v1/cards/${encodeURIComponent(handle)}`;
}

export function registryWellKnownUrl(registry: string, domain: string): string {
  const base = registry.replace(/\/$/, "");
  return `${base}/api/v1/well-known?domain=${encodeURIComponent(normalizeDomain(domain))}`;
}
