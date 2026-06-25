import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Card } from "@digitalcard/sdk";
import { DigitalCardClient } from "@digitalcard/sdk";
import { loadConfig, resolveCardPath } from "./config.js";
import { DEFAULT_REGISTRY } from "./constants.js";
import { registryCardUrl, registryWellKnownUrl } from "./urls.js";

export type ExportOptions = {
  cwd?: string;
  out?: string;
  registry?: string;
  handle?: string;
  domain?: string;
  fromLocal?: boolean;
  pretty?: boolean;
};

function parseCardBody(body: unknown): Card {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid card JSON");
  }
  const record = body as Record<string, unknown>;
  const card = ("card" in record && record.card ? record.card : record) as Card;
  if (!card.card_id || !card.type || !card.updated_at) {
    throw new Error("Invalid card JSON: missing card_id, type, or updated_at");
  }
  return card;
}

async function fetchRegistryCard(
  registry: string,
  opts: { handle?: string; domain?: string }
): Promise<Card> {
  if (opts.handle) {
    const res = await fetch(registryCardUrl(registry, opts.handle), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Registry card not found (@${opts.handle}): HTTP ${res.status}`);
    return parseCardBody(await res.json());
  }
  if (opts.domain) {
    const res = await fetch(registryWellKnownUrl(registry, opts.domain), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Registry well-known not found (${opts.domain}): HTTP ${res.status}`);
    return parseCardBody(await res.json());
  }
  throw new Error("Provide --handle or --domain (or set them in eil.config.json)");
}

export async function exportWellKnown(options: ExportOptions = {}): Promise<string> {
  const cwd = options.cwd ?? process.cwd();
  const config = loadConfig(cwd);
  const registry = (options.registry ?? config?.registry ?? DEFAULT_REGISTRY).replace(/\/$/, "");
  const handle = options.handle ?? config?.handle;
  const domain = options.domain ?? config?.domain;
  const outPath = resolve(cwd, options.out ?? ".well-known/digital-card");

  let card: Card;
  if (options.fromLocal) {
    const cardPath = resolveCardPath(
      config ?? { registry, handle, domain, cardFile: ".eil/card.json" },
      cwd
    );
    if (!existsSync(cardPath)) {
      throw new Error(`Local card file not found: ${cardPath}`);
    }
    const { readFileSync } = await import("node:fs");
    card = parseCardBody(JSON.parse(readFileSync(cardPath, "utf8")));
  } else {
    card = await fetchRegistryCard(registry, { handle, domain });
  }

  const json = JSON.stringify(card, null, options.pretty === false ? 0 : 2);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${json}\n`, "utf8");
  return outPath;
}

export async function fetchCardForVerify(input: {
  registry: string;
  handle?: string;
  domain?: string;
}): Promise<Card> {
  const client = new DigitalCardClient({ registryBaseUrl: input.registry });
  if (input.handle) {
    const result = await client.resolve({ handle: input.handle });
    return result.card;
  }
  if (input.domain) {
    const result = await client.resolve({ domain: input.domain });
    return result.card;
  }
  throw new Error("Provide --handle or --domain");
}
