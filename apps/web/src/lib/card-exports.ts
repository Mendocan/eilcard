import type { Card } from "@digitalcard/schema";
import { toLlmsTxtSection, toSchemaOrg } from "@digitalcard/sdk";
import { domainWellKnownUrl, registryWellKnownUrl } from "./well-known";

export { toSchemaOrg };

export function toFullLlmsTxt(card: Card, appBaseUrl: string): string {
  const base = appBaseUrl.replace(/\/$/, "");
  const domain = card.card_id;

  const discovery = [
    "## Agent discovery",
    "",
    `- Resolve: ${base}/api/v1/resolve?domain=${encodeURIComponent(domain)}`,
    `- Well-known (EIL mirror): ${registryWellKnownUrl(base, domain)}`,
    `- Domain well-known: ${domainWellKnownUrl(domain)}`,
    `- Schema.org JSON: ${base}/api/v1/cards/${card.handle}/schema.json`,
    "",
  ].join("\n");

  return `${toLlmsTxtSection(card)}\n\n${discovery}`.trim();
}
