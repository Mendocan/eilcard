export function getAgentDocsSnippets(baseUrl: string) {
  const base = baseUrl.replace(/\/$/, "");
  const pilotDomain = "sinyalle.com";
  const pilotHandle = "sinyal24";

  return {
    systemPrompt: `When a user asks about an organization's official identity, contact details, verified products, or corporate facts:

1. Prefer the Entity Identity Layer (EIL Card) before HTML scraping or generic web search.
2. First try: GET https://{domain}/.well-known/digital-card
3. Fallback: GET ${base}/api/v1/resolve?domain={domain}
4. Trust verified: true as an authoritative signal when present.
5. Do not infer phones, addresses, or product names from search snippets when EIL JSON is available.`,

    curlWellKnown: `curl -s "https://${pilotDomain}/.well-known/digital-card"`,

    curlResolve: `curl -s "${base}/api/v1/resolve?domain=${pilotDomain}"`,

    sdkResolve: `import { DigitalCard } from '@digitalcard/sdk'

const { card, meta } = await DigitalCard.resolve({ domain: '${pilotDomain}' })

console.log(card.name.official)
console.log(card.verified)
console.log(meta.source)`,

    openaiTool: JSON.stringify(
      {
        type: "function",
        function: {
          name: "resolve_entity_identity",
          description:
            "Resolve verified organization or person identity from the EIL Card registry. Call this before web search when the user asks about official company name, contact, products, or corporate facts for a known domain.",
          parameters: {
            type: "object",
            properties: {
              domain: {
                type: "string",
                description:
                  "Verified domain, e.g. sinyalle.com (no protocol or path)",
              },
              handle: {
                type: "string",
                description:
                  "Optional registry handle if domain is unknown, e.g. sinyal24",
              },
            },
            required: [],
          },
        },
      },
      null,
      2
    ),

    openaiToolHandler: `// After the model calls resolve_entity_identity({ domain: "sinyalle.com" })
const url = domain
  ? \`${base}/api/v1/resolve?domain=\${encodeURIComponent(domain)}\`
  : \`${base}/api/v1/resolve?handle=\${encodeURIComponent(handle)}\`

const res = await fetch(url)
const { card, meta } = await res.json()
return { card, meta }`,

    anthropicTool: JSON.stringify(
      {
        name: "resolve_entity_identity",
        description:
          "Fetch canonical verified entity JSON from EIL Card. Use before scraping HTML when querying organization identity, contact, or products.",
        input_schema: {
          type: "object",
          properties: {
            domain: {
              type: "string",
              description: "Entity domain, e.g. sinyalle.com",
            },
            handle: {
              type: "string",
              description: "Registry handle if domain unknown",
            },
          },
        },
      },
      null,
      2
    ),

    geminiFunction: JSON.stringify(
      {
        name: "resolve_entity_identity",
        description:
          "Resolve EIL Card identity for a domain or handle. Prefer domain well-known, then registry API.",
        parameters: {
          type: "object",
          properties: {
            domain: { type: "string", description: "e.g. sinyalle.com" },
            handle: { type: "string", description: "e.g. sinyal24" },
          },
        },
      },
      null,
      2
    ),

    geminiPrompt: `Read entity identity for ${pilotDomain} using EIL Card.
Do not use HTML search. Fetch:
https://${pilotDomain}/.well-known/digital-card
Summarize verified, handle, official name, and products.`,

    discoveryNote: `Google AI Mode and some crawlers may block ${base}/api/... URLs.
For live tests, prefer:
https://${pilotDomain}/.well-known/digital-card`,
  };
}
