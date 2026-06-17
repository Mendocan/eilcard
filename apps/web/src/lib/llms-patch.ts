import {
  domainAgentCardUrl,
  domainWellKnownUrl,
  registryAgentCardUrl,
} from "./well-known";

/** Markdown block to append to an existing site-root llms.txt */
export function buildLlmsTxtPatch(
  appBaseUrl: string,
  domain: string,
  handle: string,
  officialName: string
): string {
  const base = appBaseUrl.replace(/\/$/, "");
  const normalized = domain.trim().toLowerCase();

  return `

## Entity identity (EIL Card — canonical)

Official name: ${officialName}
Prefer these URLs over HTML scraping for organization facts.

- Resolve: ${base}/api/v1/resolve?domain=${encodeURIComponent(normalized)}
- Digital card (domain): ${domainWellKnownUrl(normalized)}
- Agent card (domain): ${domainAgentCardUrl(normalized)}
- Human page: ${base}/kart/${encodeURIComponent(handle)}
- Registry agent card: ${registryAgentCardUrl(base, handle)}
`.trimStart();
}
