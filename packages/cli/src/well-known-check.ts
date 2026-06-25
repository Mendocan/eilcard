import type { Card } from "@digitalcard/sdk";
import { domainWellKnownUrl, normalizeDomain } from "./urls.js";

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
  message: string;
  remoteUpdatedAt?: string;
  registryUpdatedAt: string;
};

function parseCardJson(body: unknown): Card | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  if ("card" in record && record.card && typeof record.card === "object") {
    return record.card as Card;
  }
  if ("card_id" in record && "handle" in record) {
    return record as unknown as Card;
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
        registryUpdatedAt: registryUpdated,
        message: `HTTP ${response.status}`,
      };
    }

    if (contentType.includes("text/html")) {
      return {
        status: "html",
        url,
        registryUpdatedAt: registryUpdated,
        message: "Response is HTML, not JSON",
      };
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return {
        status: "invalid_json",
        url,
        registryUpdatedAt: registryUpdated,
        message: "Response is not valid JSON",
      };
    }

    const remote = parseCardJson(body);
    if (!remote) {
      return {
        status: "invalid_json",
        url,
        registryUpdatedAt: registryUpdated,
        message: "JSON is not a digital-card document",
      };
    }

    if (
      remote.card_id !== registryCard.card_id ||
      remote.handle !== registryCard.handle
    ) {
      return {
        status: "mismatch",
        url,
        registryUpdatedAt: registryUpdated,
        remoteUpdatedAt: remote.updated_at,
        message: `card_id/handle mismatch (remote @${remote.handle ?? "?"})`,
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
        registryUpdatedAt: registryUpdated,
        remoteUpdatedAt: remote.updated_at,
        message: "Domain well-known is older than registry card",
      };
    }

    return {
      status: "ok",
      url,
      registryUpdatedAt: registryUpdated,
      remoteUpdatedAt: remote.updated_at,
      message: "Domain well-known matches registry",
    };
  } catch {
    return {
      status: "unreachable",
      url,
      registryUpdatedAt: registryUpdated,
      message: `Could not reach ${normalizeDomain(domain)}`,
    };
  }
}
