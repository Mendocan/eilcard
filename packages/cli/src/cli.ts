#!/usr/bin/env node
import { runInit } from "./init.js";
import { exportWellKnown } from "./export-well-known.js";
import { formatVerifyReport, runVerify } from "./verify.js";

function printHelp() {
  console.log(`eil-card — EIL Card CLI

Usage:
  eil-card init [options]
  eil-card verify [options]
  eil-card export well-known [options]

Commands:
  init                 Create eil.config.json and .eil/card.json starter template
  verify               Check registry resolve, DNS TXT, domain well-known, optional JWS
  export well-known    Write /.well-known/digital-card JSON for static hosting

Init options:
  --handle <name>      Registry handle (default: derived from domain or my-entity)
  --domain <domain>    Root domain for DNS / well-known
  --registry <url>     Registry base URL (default: https://eilcard.com)
  --type organization|person
  --force              Overwrite existing files

Verify options:
  --handle <name>      Override config handle
  --domain <domain>    Override config domain
  --registry <url>     Override registry URL
  --dns                DNS TXT only (default: on when domain set)
  --no-dns             Skip DNS check
  --well-known         Domain well-known only
  --no-well-known      Skip well-known check
  --no-resolve         Skip registry resolve
  --jws                Verify Registry+ JWS attestation
  --token <value>      Expected DNS verification token (without prefix)
  --public-key-pem <path>
  --json               Machine-readable output

Export well-known options:
  --out <path>         Output file (default: .well-known/digital-card)
  --handle <name>      Fetch from registry by handle
  --domain <domain>    Fetch from registry by domain
  --from-local         Use .eil/card.json instead of registry
  --registry <url>
  --compact            Minified JSON

Environment:
  EIL_REGISTRY_URL     Default registry base URL

Examples:
  eil-card init --domain acme.com --handle acme
  eil-card verify
  eil-card verify --domain acme.com --jws --public-key-pem ./registry-public.pem
  eil-card export well-known --handle acme --out public/.well-known/digital-card
`);
}

function parseFlags(argv: string[]): Record<string, string | boolean> {
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (key === "force" || key === "json" || key === "compact" || key === "from-local") {
      flags[key] = true;
      continue;
    }
    if (key.startsWith("no-")) {
      flags[key] = true;
      continue;
    }
    if (next && !next.startsWith("--")) {
      flags[key] = next;
      i++;
    } else {
      flags[key] = true;
    }
  }
  return flags;
}

function flagStr(flags: Record<string, string | boolean>, key: string): string | undefined {
  const v = flags[key];
  return typeof v === "string" ? v : undefined;
}

function flagBool(flags: Record<string, string | boolean>, key: string): boolean {
  return flags[key] === true;
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes("-h") || argv.includes("--help")) {
    printHelp();
    process.exit(0);
  }

  const cmd = argv[0];
  const sub = argv[1];
  const flags = parseFlags(argv.slice(cmd === "export" ? 2 : 1));

  if (process.env.EIL_REGISTRY_URL && !flags.registry) {
    flags.registry = process.env.EIL_REGISTRY_URL;
  }

  try {
    if (cmd === "init") {
      const result = runInit({
        handle: flagStr(flags, "handle"),
        domain: flagStr(flags, "domain"),
        registry: flagStr(flags, "registry"),
        type:
          flagStr(flags, "type") === "person" ? "person" : "organization",
        force: flagBool(flags, "force"),
      });
      console.log(`Created ${result.configPath}`);
      console.log(`Created ${result.cardPath}`);
      console.log("");
      console.log("Next steps:");
      console.log("  1. Register at https://eilcard.com/register");
      console.log(`  2. Claim handle @${result.config.handle} and domain ${result.config.domain ?? "(set domain)"}`);
      console.log("  3. eil-card verify");
      console.log("  4. eil-card export well-known --out public/.well-known/digital-card");
      return;
    }

    if (cmd === "verify") {
      const report = await runVerify({
        registry: flagStr(flags, "registry"),
        handle: flagStr(flags, "handle"),
        domain: flagStr(flags, "domain"),
        token: flagStr(flags, "token"),
        publicKeyPem: flagStr(flags, "public-key-pem"),
        dns: flagBool(flags, "dns")
          ? true
          : flagBool(flags, "no-dns")
            ? false
            : undefined,
        wellKnown: flagBool(flags, "well-known")
          ? true
          : flagBool(flags, "no-well-known")
            ? false
            : undefined,
        resolve: flagBool(flags, "no-resolve") ? false : undefined,
        jws: flagBool(flags, "jws") || Boolean(flagStr(flags, "public-key-pem")),
        json: flagBool(flags, "json"),
      });
      console.log(formatVerifyReport(report, flagBool(flags, "json")));
      process.exit(report.ok ? 0 : 1);
    }

    if (cmd === "export" && sub === "well-known") {
      const out = await exportWellKnown({
        out: flagStr(flags, "out"),
        handle: flagStr(flags, "handle"),
        domain: flagStr(flags, "domain"),
        registry: flagStr(flags, "registry"),
        fromLocal: flagBool(flags, "from-local"),
        pretty: !flagBool(flags, "compact"),
      });
      console.log(`Wrote ${out}`);
      return;
    }

    console.error(`Unknown command: ${cmd}${sub ? ` ${sub}` : ""}`);
    printHelp();
    process.exit(1);
  } catch (err) {
    console.error(`[eil-card] ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

main();
