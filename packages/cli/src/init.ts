import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { OrganizationCard, PersonCard } from "@digitalcard/sdk";
import { CONFIG_FILE, DEFAULT_CARD_FILE, DEFAULT_REGISTRY } from "./constants.js";
import { resolveConfigPath, resolveCardPath } from "./config.js";
import type { EilConfig } from "./constants.js";

export type InitOptions = {
  cwd?: string;
  handle?: string;
  domain?: string;
  registry?: string;
  type?: "organization" | "person";
  force?: boolean;
};

function nowIso(): string {
  return new Date().toISOString();
}

function slugFromDomain(domain: string): string {
  const base = domain.split(".")[0] ?? "entity";
  return base.replace(/[^a-z0-9-]/g, "").slice(0, 50) || "entity";
}

function buildOrganizationCard(input: {
  handle: string;
  domain?: string;
  registry: string;
}): OrganizationCard {
  const ts = nowIso();
  const website = input.domain ? `https://${input.domain}` : undefined;
  return {
    schema_version: "1.0",
    edition: "core",
    type: "organization",
    card_id: `${input.handle}-${input.domain ?? "local"}`,
    handle: input.handle,
    verified: false,
    name: {
      official: input.domain ?? input.handle,
      short: input.handle,
    },
    contact: {
      email: input.domain ? `hello@${input.domain}` : undefined,
      website,
    },
    description: {
      tagline: "Digital entity card — edit this file, then publish via EIL Card registry",
    },
    updated_at: ts,
    created_at: ts,
    human_url: website,
    registry_url: `${input.registry}/kart/${input.handle}`,
  };
}

function buildPersonCard(input: {
  handle: string;
  domain?: string;
  registry: string;
}): PersonCard {
  const ts = nowIso();
  const website = input.domain ? `https://${input.domain}` : undefined;
  return {
    schema_version: "1.0",
    edition: "core",
    type: "person",
    card_id: `${input.handle}-${input.domain ?? "local"}`,
    handle: input.handle,
    verified: false,
    name: { full: input.handle },
    contact: {
      email: input.domain ? `hello@${input.domain}` : undefined,
      website,
    },
    updated_at: ts,
    created_at: ts,
    human_url: website,
    registry_url: `${input.registry}/kart/${input.handle}`,
  };
}

export function runInit(options: InitOptions = {}): {
  configPath: string;
  cardPath: string;
  config: EilConfig;
} {
  const cwd = options.cwd ?? process.cwd();
  const configPath = resolveConfigPath(cwd);
  const registry = (options.registry ?? DEFAULT_REGISTRY).replace(/\/$/, "");
  const domain = options.domain?.trim().toLowerCase();
  const handle =
    options.handle?.trim().toLowerCase() ??
    (domain ? slugFromDomain(domain) : "my-entity");

  if (existsSync(configPath) && !options.force) {
    throw new Error(`${CONFIG_FILE} already exists (use --force to overwrite)`);
  }

  const config: EilConfig = {
    registry,
    handle,
    domain,
    cardFile: DEFAULT_CARD_FILE,
  };

  const cardPath = resolveCardPath(config, cwd);
  if (existsSync(cardPath) && !options.force) {
    throw new Error(`${config.cardFile} already exists (use --force to overwrite)`);
  }

  const card =
    options.type === "person"
      ? buildPersonCard({ handle, domain, registry })
      : buildOrganizationCard({ handle, domain, registry });

  mkdirSync(resolve(cwd, ".eil"), { recursive: true });
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  writeFileSync(cardPath, `${JSON.stringify(card, null, 2)}\n`, "utf8");

  return { configPath, cardPath, config };
}
