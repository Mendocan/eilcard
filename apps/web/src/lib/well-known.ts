import type { Card } from "@digitalcard/schema";

export type WellKnownCheckStatus =
  | "ok"
  | "missing"
  | "html"
  | "invalid_json"
  | "mismatch"
  | "stale"
  | "unreachable";

export type WellKnownCheckResult = {
  status: WellKnownCheckStatus;
  url: string;
  content_type?: string;
  remote_updated_at?: string;
  registry_updated_at: string;
  message?: string;
};

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

export function registryWellKnownUrl(appBaseUrl: string, domain: string): string {
  const base = appBaseUrl.replace(/\/$/, "");
  return `${base}/api/v1/well-known?domain=${encodeURIComponent(normalizeDomain(domain))}`;
}

export function nginxWellKnownProxySnippet(
  appBaseUrl: string,
  domain: string
): string {
  const mirror = registryWellKnownUrl(appBaseUrl, domain);
  const host = new URL(appBaseUrl.replace(/\/$/, "") || "https://eilcard.com").host;
  return `location = /.well-known/digital-card {
    proxy_pass ${mirror};
    proxy_set_header Host ${host};
    proxy_ssl_server_name on;
}`;
}

export function nginxWellKnownSnippet(filePath = "/var/www/html/.well-known/digital-card"): string {
  return `location = /.well-known/digital-card {
    default_type application/json;
    add_header Cache-Control "public, max-age=3600";
    alias ${filePath};
}`;
}

export function cPanelHint(): string {
  return `public_html/.well-known/digital-card`;
}

export type WellKnownSetup = {
  mirror_url: string;
  nginx_proxy_snippet: string;
  nginx_static_snippet: string;
  cpanel_path: string;
};

export function buildWellKnownSetup(
  appBaseUrl: string,
  domain: string
): WellKnownSetup {
  return {
    mirror_url: registryWellKnownUrl(appBaseUrl, domain),
    nginx_proxy_snippet: nginxWellKnownProxySnippet(appBaseUrl, domain),
    nginx_static_snippet: nginxWellKnownSnippet(),
    cpanel_path: cPanelHint(),
  };
}

function parseCardJson(body: unknown): Card | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  if ("card" in record && record.card && typeof record.card === "object") {
    return record.card as Card;
  }
  if ("card_id" in record && "handle" in record) {
    return record as Card;
  }
  return null;
}

export async function checkDomainWellKnown(
  domain: string,
  registryCard: Card
): Promise<WellKnownCheckResult> {
  const url = domainWellKnownUrl(domain);
  const registryUpdated = registryCard.updated_at;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") ?? "";

    if (!response.ok) {
      return {
        status: "missing",
        url,
        content_type: contentType,
        registry_updated_at: registryUpdated,
        message: `HTTP ${response.status}`,
      };
    }

    if (contentType.includes("text/html")) {
      return {
        status: "html",
        url,
        content_type: contentType,
        registry_updated_at: registryUpdated,
      };
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return {
        status: "invalid_json",
        url,
        content_type: contentType,
        registry_updated_at: registryUpdated,
      };
    }

    const remote = parseCardJson(body);
    if (!remote) {
      return {
        status: "invalid_json",
        url,
        content_type: contentType,
        registry_updated_at: registryUpdated,
      };
    }

    if (
      remote.card_id !== registryCard.card_id ||
      remote.handle !== registryCard.handle
    ) {
      return {
        status: "mismatch",
        url,
        content_type: contentType,
        remote_updated_at: remote.updated_at,
        registry_updated_at: registryUpdated,
      };
    }

    if (
      remote.updated_at &&
      registryUpdated &&
      remote.updated_at < registryUpdated
    ) {
      return {
        status: "stale",
        url,
        content_type: contentType,
        remote_updated_at: remote.updated_at,
        registry_updated_at: registryUpdated,
      };
    }

    return {
      status: "ok",
      url,
      content_type: contentType,
      remote_updated_at: remote.updated_at,
      registry_updated_at: registryUpdated,
    };
  } catch {
    return {
      status: "unreachable",
      url,
      registry_updated_at: registryUpdated,
    };
  }
}
