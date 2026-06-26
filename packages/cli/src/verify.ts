import { loadConfig } from "./config.js";
import { verifyDnsTxt } from "./dns.js";
import { fetchCardForVerify } from "./export-well-known.js";
import { verifyRegistryJws } from "./jws.js";
import { checkDomainWellKnown } from "./well-known-check.js";
import { DEFAULT_REGISTRY } from "./constants.js";
import { normalizeDomain } from "./urls.js";

export type VerifyOptions = {
  cwd?: string;
  registry?: string;
  handle?: string;
  domain?: string;
  dns?: boolean;
  wellKnown?: boolean;
  jws?: boolean;
  resolve?: boolean;
  token?: string;
  publicKeyPem?: string;
  json?: boolean;
};

export type VerifyCheck = {
  name: string;
  ok: boolean;
  message: string;
  details?: Record<string, unknown>;
};

export type VerifyReport = {
  ok: boolean;
  checks: VerifyCheck[];
};

export async function runVerify(options: VerifyOptions = {}): Promise<VerifyReport> {
  const cwd = options.cwd ?? process.cwd();
  const config = loadConfig(cwd);
  const registry = (options.registry ?? config?.registry ?? DEFAULT_REGISTRY).replace(
    /\/$/,
    ""
  );
  const handle = options.handle ?? config?.handle;
  const domain = options.domain ?? config?.domain;

  const runResolve = options.resolve !== false;
  const runDns = options.dns === true || (options.dns !== false && Boolean(domain));
  const runWellKnown =
    options.wellKnown === true || (options.wellKnown !== false && Boolean(domain));
  const runJws = options.jws === true;

  const checks: VerifyCheck[] = [];

  if (!handle && !domain) {
    return {
      ok: false,
      checks: [
        {
          name: "config",
          ok: false,
          message:
            "No handle or domain — run eil-card init or pass --handle / --domain",
        },
      ],
    };
  }

  let card: Awaited<ReturnType<typeof fetchCardForVerify>> | null = null;

  if (runResolve) {
    try {
      card = await fetchCardForVerify({ registry, handle, domain });
      checks.push({
        name: "resolve",
        ok: true,
        message: `Resolved @${card.handle ?? "?"} (${card.type}, verified=${card.verified ?? false})`,
        details: {
          card_id: card.card_id,
          registry,
          verified: card.verified ?? false,
        },
      });
    } catch (err) {
      checks.push({
        name: "resolve",
        ok: false,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (runDns && domain) {
    const dns = await verifyDnsTxt(domain, options.token);
    checks.push({
      name: "dns",
      ok: dns.ok,
      message: dns.message,
      details: {
        domain: dns.domain,
        found: dns.found,
        expected: dns.expected,
      },
    });
  }

  if (runWellKnown && domain) {
    if (!card) {
      try {
        card = await fetchCardForVerify({ registry, handle, domain });
      } catch {
        checks.push({
          name: "well-known",
          ok: false,
          message: "Skipped — could not load registry card for comparison",
        });
      }
    }
    if (card) {
      const wk = await checkDomainWellKnown(domain, card);
      checks.push({
        name: "well-known",
        ok: wk.status === "ok",
        message: `${wk.message} (${wk.url})`,
        details: {
          status: wk.status,
          url: wk.url,
          remote_updated_at: wk.remoteUpdatedAt,
          registry_updated_at: wk.registryUpdatedAt,
        },
      });
    }
  }

  if (runJws) {
    if (!card) {
      try {
        card = await fetchCardForVerify({ registry, handle, domain });
      } catch {
        checks.push({
          name: "jws",
          ok: false,
          message: "Skipped — could not load card for JWS verify",
        });
      }
    }
    if (card) {
      const jws = await verifyRegistryJws(card, options.publicKeyPem);
      checks.push({
        name: "jws",
        ok: jws.ok,
        message: jws.message,
        details: {
          alg: jws.alg,
          kid: jws.kid,
          payload_matches: jws.payloadMatches,
          signature_valid: jws.signatureValid,
        },
      });
    }
  }

  const ok = checks.length > 0 && checks.every((c) => c.ok);
  return { ok, checks };
}

export function formatVerifyReport(report: VerifyReport, json: boolean): string {
  if (json) return JSON.stringify(report, null, 2);
  const lines = report.checks.map((c) => {
    const icon = c.ok ? "✓" : "✗";
    return `${icon} ${c.name}: ${c.message}`;
  });
  lines.push("");
  lines.push(report.ok ? "All checks passed." : "Some checks failed.");
  return lines.join("\n");
}

export function resolveDomainForDisplay(domain?: string): string | undefined {
  return domain ? normalizeDomain(domain) : undefined;
}
