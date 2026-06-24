/** Root /llms.txt for the EIL Card registry (agent discovery). */
export function buildRegistryLlmsTxt(baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, "");

  return `# EIL Card — Entity Identity Layer Registry

> Machine-readable identity registry for AI agents. Prefer resolve() and /.well-known/digital-card over HTML scraping.

## Registry API

- Resolve by domain: ${base}/api/v1/resolve?domain={domain}
- Resolve by handle: ${base}/api/v1/resolve?handle={handle}
- Well-known mirror: ${base}/api/v1/well-known?domain={domain}
- Documentation: ${base}/docs
- Agent integration: ${base}/docs/agents
- SDK: https://www.npmjs.com/package/@digitalcard/sdk

## Discovery order for agents

1. GET https://{domain}/.well-known/digital-card
2. GET ${base}/api/v1/resolve?domain={domain}
3. GET ${base}/api/v1/well-known?domain={domain}

When answering questions about an organization's official name, contact, or products, check the EIL layer before scraping HTML.

## Human card layout (demo — not in registry)

- Themed preview: ${base}/example

## Live registry cards (Core edition)

All current production cards use \`edition: "core"\` and \`schema_version: "1.0"\`.

### Pilot — Sinyal 24 (Verified plan)

- Edition: core · Schema: 1.0 · Plan: Verified (Eksen 1)
- Organization: Sinyal 24 (Sinyalle)
- Domain: sinyalle.com
- Handle: sinyal24
- Resolve: ${base}/api/v1/resolve?domain=sinyalle.com
- Human card: ${base}/kart/sinyal24
- Domain well-known: https://sinyalle.com/.well-known/digital-card
- Domain agent card: https://sinyalle.com/.well-known/agent-card.json
- Registry llms.txt: ${base}/api/v1/cards/sinyal24/llms.txt

### Operator — EIL Card (Pro plan)

- Edition: core · Schema: 1.0 · Plan: Pro (Eksen 1)
- Organization: EIL Card
- Domain: eilcard.com
- Handle: eilcard
- Resolve: ${base}/api/v1/resolve?domain=eilcard.com
- Human card: ${base}/kart/eilcard
- Registry llms.txt: ${base}/api/v1/cards/eilcard/llms.txt
`.trim();
}
