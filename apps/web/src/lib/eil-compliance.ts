import type { Card } from "@digitalcard/schema";
import {
  checkDomainWellKnown,
  normalizeDomain,
  type WellKnownCheckResult,
} from "@/lib/well-known";

export type ComplianceLevel = "pass" | "warn" | "fail" | "skip" | "info";

export type ComplianceCheckId =
  | "registry_card"
  | "card_id_binding"
  | "domain_verified"
  | "well_known"
  | "well_known_sync"
  | "registry_plus_jws"
  | "access_policy"
  | "capabilities";

export type ComplianceCheck = {
  id: ComplianceCheckId;
  level: ComplianceLevel;
  detail?: string;
};

export type ComplianceGrade = "excellent" | "good" | "partial" | "none";

export type ComplianceReport = {
  domain: string;
  handle?: string;
  edition?: string;
  grade: ComplianceGrade;
  score: {
    passed: number;
    total: number;
    percentage: number;
  };
  checks: ComplianceCheck[];
  well_known?: WellKnownCheckResult;
  resolved_at: string;
};

const CORE_CHECK_IDS: ComplianceCheckId[] = [
  "registry_card",
  "card_id_binding",
  "domain_verified",
  "well_known",
  "well_known_sync",
];

function wellKnownLevel(status: WellKnownCheckResult["status"]): ComplianceLevel {
  switch (status) {
    case "ok":
      return "pass";
    case "stale":
      return "warn";
    case "missing":
    case "html":
    case "invalid_json":
    case "mismatch":
    case "unreachable":
      return "fail";
    default:
      return "fail";
  }
}

function wellKnownSyncLevel(status: WellKnownCheckResult["status"]): ComplianceLevel {
  switch (status) {
    case "ok":
      return "pass";
    case "stale":
      return "warn";
    case "missing":
    case "unreachable":
    case "html":
    case "invalid_json":
      return "fail";
    case "mismatch":
      return "fail";
    default:
      return "fail";
  }
}

function scoreFromChecks(checks: ComplianceCheck[]): ComplianceReport["score"] {
  const core = checks.filter((c) => CORE_CHECK_IDS.includes(c.id));
  const scored = core.filter((c) => c.level !== "skip");
  const passed = scored.filter((c) => c.level === "pass" || c.level === "warn").length;
  const total = scored.length || CORE_CHECK_IDS.length;
  return {
    passed,
    total,
    percentage: total === 0 ? 0 : Math.round((passed / total) * 100),
  };
}

function gradeFromScore(passed: number, total: number): ComplianceGrade {
  if (total === 0 || passed === 0) return "none";
  const ratio = passed / total;
  if (ratio >= 1) return "excellent";
  if (ratio >= 0.75) return "good";
  return "partial";
}

export function buildComplianceReport(
  domain: string,
  card: Card | null,
  wellKnown?: WellKnownCheckResult
): ComplianceReport {
  const normalized = normalizeDomain(domain);
  const checks: ComplianceCheck[] = [];

  if (!card) {
    checks.push({
      id: "registry_card",
      level: "fail",
      detail: "No card found in registry for this domain",
    });
    for (const id of CORE_CHECK_IDS.slice(1)) {
      checks.push({ id, level: "skip" });
    }
    const score = scoreFromChecks(checks);
    return {
      domain: normalized,
      grade: "none",
      score,
      checks,
      resolved_at: new Date().toISOString(),
    };
  }

  checks.push({
    id: "registry_card",
    level: "pass",
    detail: card.handle ? `handle: ${card.handle}` : undefined,
  });

  const cardIdMatch = card.card_id === normalized;
  checks.push({
    id: "card_id_binding",
    level: cardIdMatch ? "pass" : "fail",
    detail: cardIdMatch
      ? undefined
      : `card_id is "${card.card_id}", expected "${normalized}"`,
  });

  checks.push({
    id: "domain_verified",
    level: card.verified ? "pass" : "fail",
    detail: card.verified
      ? "DNS TXT verification complete"
      : "Domain not verified — add DNS TXT record in dashboard",
  });

  if (wellKnown) {
    checks.push({
      id: "well_known",
      level: wellKnownLevel(wellKnown.status),
      detail: wellKnown.message ?? wellKnown.status,
    });
    checks.push({
      id: "well_known_sync",
      level: wellKnownSyncLevel(wellKnown.status),
      detail:
        wellKnown.status === "ok"
          ? "Native well-known matches registry"
          : wellKnown.status === "stale"
            ? "Well-known is older than registry — republish or proxy"
            : wellKnown.status,
    });
  } else {
    checks.push({ id: "well_known", level: "skip" });
    checks.push({ id: "well_known_sync", level: "skip" });
  }

  const edition = card.edition ?? "core";
  if (edition === "registry_plus") {
    const hasJws = Boolean(card.signatures?.registry?.jws);
    checks.push({
      id: "registry_plus_jws",
      level: hasJws ? "info" : "warn",
      detail: hasJws
        ? "Registry+ JWS signature present — verify with SDK/CLI"
        : "Registry+ card without JWS signature",
    });
  }

  if (card.access_policy) {
    const ap = card.access_policy;
    checks.push({
      id: "access_policy",
      level: "info",
      detail: `state=${ap.state ?? "—"}, default=${ap.default ?? "—"}`,
    });
  }

  if (Array.isArray(card.capabilities) && card.capabilities.length > 0) {
    checks.push({
      id: "capabilities",
      level: "info",
      detail: `${card.capabilities.length} capability entries declared`,
    });
  }

  const score = scoreFromChecks(checks);
  return {
    domain: normalized,
    handle: card.handle,
    edition: String(edition),
    grade: gradeFromScore(score.passed, score.total),
    score,
    checks,
    well_known: wellKnown,
    resolved_at: new Date().toISOString(),
  };
}

export async function runEilCompliance(params: {
  domain?: string;
  handle?: string;
  card: Card | null;
}): Promise<ComplianceReport> {
  const domain =
    params.domain?.trim() ||
    (params.card?.card_id ? normalizeDomain(params.card.card_id) : "");

  if (!domain) {
    return buildComplianceReport("", null);
  }

  let wellKnown: WellKnownCheckResult | undefined;
  if (params.card) {
    wellKnown = await checkDomainWellKnown(domain, params.card);
  }

  return buildComplianceReport(domain, params.card, wellKnown);
}
