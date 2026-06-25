import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { EilConfig } from "./constants.js";
import { CONFIG_FILE, DEFAULT_CARD_FILE, DEFAULT_REGISTRY } from "./constants.js";

export function findConfigPath(cwd = process.cwd()): string | null {
  let dir = cwd;
  for (let i = 0; i < 8; i++) {
    const candidate = resolve(dir, CONFIG_FILE);
    if (existsSync(candidate)) return candidate;
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export function loadConfig(cwd = process.cwd()): EilConfig | null {
  const path = findConfigPath(cwd);
  if (!path) return null;
  const raw = JSON.parse(readFileSync(path, "utf8")) as Partial<EilConfig>;
  return {
    registry: (raw.registry ?? DEFAULT_REGISTRY).replace(/\/$/, ""),
    handle: raw.handle?.trim() || undefined,
    domain: raw.domain?.trim().toLowerCase() || undefined,
    cardFile: raw.cardFile ?? DEFAULT_CARD_FILE,
  };
}

export function resolveConfigPath(cwd = process.cwd()): string {
  return resolve(cwd, CONFIG_FILE);
}

export function resolveCardPath(config: EilConfig, cwd = process.cwd()): string {
  return resolve(cwd, config.cardFile);
}
