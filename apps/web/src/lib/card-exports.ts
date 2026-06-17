import type { Card, OrganizationCard } from "@digitalcard/schema";
import { toLlmsTxtSection, toSchemaOrg } from "@digitalcard/sdk";
import {
  domainAgentCardUrl,
  domainWellKnownUrl,
  registryAgentCardUrl,
  registryWellKnownUrl,
} from "./well-known";

export { toSchemaOrg };

/** A2A-inspired agent card (identity + offerings template). */
export type EilAgentCard = {
  name: string;
  description: string;
  version: string;
  url: string;
  documentationUrl?: string;
  provider?: { organization: string; url?: string };
  capabilities: { streaming: boolean; pushNotifications: boolean };
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: Array<{
    id: string;
    name: string;
    description: string;
    tags?: string[];
  }>;
  eil: {
    schema: "agent-card-template";
    digitalCardHandle?: string;
    resolveUrl: string;
    digitalCardUrl: string;
    wellKnownUrl?: string;
    agentCardUrl: string;
    note: string;
  };
};

function isOrganization(card: Card): card is OrganizationCard {
  return card.type === "organization";
}

export function toAgentCard(card: Card, appBaseUrl: string): EilAgentCard {
  const base = appBaseUrl.replace(/\/$/, "");
  const domain = card.card_id;
  const handle = card.handle ?? domain;

  const name = isOrganization(card) ? card.name.official : card.name.full;
  const description =
    [card.description?.tagline, card.description?.summary]
      .filter(Boolean)
      .join(" — ") ||
    `Verified entity profile for ${name} via EIL Card registry.`;

  const identitySkill = {
    id: "resolve-entity-identity",
    name: "Resolve entity identity",
    description:
      "Read canonical organization or person JSON from the EIL Card registry (domain-bound, verified).",
    tags: ["eil", "identity", "resolve"],
  };

  const productSkills =
    isOrganization(card) && card.products?.length
      ? card.products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description ?? p.name,
          tags: ["product", "offering"],
        }))
      : [];

  const skills =
    productSkills.length > 0 ? [identitySkill, ...productSkills] : [identitySkill];

  const website = card.contact.website;
  const agentCardUrl = registryAgentCardUrl(base, handle);

  return {
    name,
    description,
    version: "1.0.0",
    url: registryWellKnownUrl(base, domain),
    documentationUrl: card.human_url,
    provider: website
      ? { organization: name, url: website }
      : { organization: name },
    capabilities: { streaming: false, pushNotifications: false },
    defaultInputModes: ["text/plain", "application/json"],
    defaultOutputModes: ["application/json"],
    skills,
    eil: {
      schema: "agent-card-template",
      digitalCardHandle: card.handle,
      resolveUrl: `${base}/api/v1/resolve?domain=${encodeURIComponent(domain)}`,
      digitalCardUrl: card.registry_url ?? `${base}/api/v1/cards/${handle}`,
      wellKnownUrl: domainWellKnownUrl(domain),
      agentCardUrl,
      note:
        "Template generated from EIL Digital Card. Replace url with your A2A JSON-RPC endpoint when a live agent server is deployed; until then, use resolveUrl or wellKnownUrl for identity discovery.",
    },
  };
}

export function toFullLlmsTxt(card: Card, appBaseUrl: string): string {
  const base = appBaseUrl.replace(/\/$/, "");
  const domain = card.card_id;
  const handle = card.handle ?? domain;

  const discovery = [
    "## Agent discovery",
    "",
    `- Resolve: ${base}/api/v1/resolve?domain=${encodeURIComponent(domain)}`,
    `- Well-known (EIL mirror): ${registryWellKnownUrl(base, domain)}`,
    `- Domain well-known: ${domainWellKnownUrl(domain)}`,
    `- Agent card (EIL): ${registryAgentCardUrl(base, handle)}`,
    `- Domain agent card: ${domainAgentCardUrl(domain)}`,
    `- Schema.org JSON: ${base}/api/v1/cards/${handle}/schema.json`,
    "",
  ].join("\n");

  return `${toLlmsTxtSection(card)}\n\n${discovery}`.trim();
}
