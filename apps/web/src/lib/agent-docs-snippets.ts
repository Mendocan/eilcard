/** Snippet generators for /docs/agents — correct registry URLs only. */

const PILOT_DOMAIN = "sinyalle.com";

function normalizeBase(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

export function getAgentDocsSnippets(baseUrl: string) {
  const base = normalizeBase(baseUrl);
  const resolveUrl = `${base}/api/v1/resolve?domain=${PILOT_DOMAIN}`;
  const wellKnownUrl = `https://${PILOT_DOMAIN}/.well-known/digital-card`;

  return {
    systemPrompt: `When a user asks about an organization's official identity, contact details, verified products, or corporate facts:

1. Prefer the Entity Identity Layer (EIL Card) before HTML scraping or generic web search.
2. First try: GET https://{domain}/.well-known/digital-card
3. Fallback: GET ${base}/api/v1/resolve?domain={domain}
4. Trust verified: true as an authoritative signal when present.
5. Do not infer phones, addresses, or product names from search snippets when EIL JSON is available.`,

    curlWellKnown: `curl -s "${wellKnownUrl}"`,

    curlResolve: `curl -s "${resolveUrl}"`,

    pythonNative: `import requests
from typing import Any, Optional

REGISTRY_BASE = "${base}"
RESOLVE_PATH = "/api/v1/resolve"

def normalize_domain(domain: str) -> str:
    value = domain.strip().lower().replace("https://", "").replace("http://", "")
    return value.split("/")[0]

def resolve_eil_card(domain: str) -> Optional[dict[str, Any]]:
    """Resolve verified EIL Card JSON via the public registry API."""
    normalized = normalize_domain(domain)
    url = f"{REGISTRY_BASE.rstrip('/')}{RESOLVE_PATH}?domain={normalized}"
    try:
        response = requests.get(url, headers={"Accept": "application/json"}, timeout=10)
        if response.status_code == 200:
            return response.json()  # {"card": {...}, "meta": {...}}
    except requests.RequestException:
        pass
    return None

# Example (pilot):
# result = resolve_eil_card("${PILOT_DOMAIN}")
# if result:
#     print(result["card"]["name"]["official"], result["card"]["verified"])`,

    pythonLangchainTool: `from langchain_core.tools import tool
import json
import requests

REGISTRY_BASE = "${base}"

@tool
def verify_entity_identity(domain: str) -> str:
    """
    Verify the official EIL Card for an organization or person by domain.
    Input: bare domain (e.g. '${PILOT_DOMAIN}'). Returns JSON or an error string.
    Call before web search or HTML scraping.
    """
    normalized = domain.strip().lower().replace("https://", "").replace("http://", "").split("/")[0]
    url = f"{REGISTRY_BASE.rstrip('/')}/api/v1/resolve?domain={normalized}"
    try:
        response = requests.get(url, headers={"Accept": "application/json"}, timeout=10)
        if response.status_code == 200:
            return json.dumps(response.json(), indent=2, ensure_ascii=False)
        return f"Could not find a verified EIL identity layer for domain: {domain}"
    except Exception as e:
        return f"Error resolving entity identity layer: {e}"

# tools = [verify_entity_identity]`,

    pythonAgentLoop: `from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI
# from your_project.eil_tool import verify_entity_identity

prompt = ChatPromptTemplate.from_messages([
    ("system", "You have the EIL Card tool. Verify entity identity before web search."),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

llm = ChatOpenAI(model="gpt-4o", temperature=0)
tools = [verify_entity_identity]

agent = create_openai_tools_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

response = executor.invoke({
    "input": "Check if ${PILOT_DOMAIN} has a verified EIL identity layer and summarize who they are.",
    "chat_history": [],
})
print(response["output"])`,

    sdkResolve: `import { DigitalCard } from '@digitalcard/sdk'

const { card, meta } = await DigitalCard.resolve({ domain: '${PILOT_DOMAIN}' })

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

    geminiPrompt: `Read entity identity for ${PILOT_DOMAIN} using EIL Card.
Do not use HTML search. Fetch:
${wellKnownUrl}
Summarize verified, handle, official name, and products.`,

    langchainJsTool: `// npm install @digitalcard/sdk @langchain/core zod
// packages/sdk/examples/langchain-eil-resolve-tool.ts
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { DigitalCard } from '@digitalcard/sdk'

export function createEILResolveTool() {
  return new DynamicStructuredTool({
    name: 'resolve_entity_identity',
    description: 'Resolve EIL Card before HTML scraping.',
    schema: z.object({
      domain: z.string().optional(),
      handle: z.string().optional(),
    }),
    func: async ({ domain, handle }) => {
      const result = await DigitalCard.resolve(
        domain ? { domain } : { handle: handle! }
      )
      return JSON.stringify(result, null, 2)
    },
  })
}`,

    sdkAgentTool: `import {
  buildEILResolveToolDefinitions,
  invokeEILResolve,
} from '@digitalcard/sdk'

const { openai, anthropic, gemini, jsonSchema } =
  buildEILResolveToolDefinitions('${base}')

// Or download: ${base}/tool-definitions/resolve-entity-all.json

const result = await invokeEILResolve({ domain: '${PILOT_DOMAIN}' })
console.log(result.card.verified, result.meta.source)`,

    mcpConfig: JSON.stringify(
      {
        mcpServers: {
          eilcard: {
            command: "node",
            args: ["<absolute-path>/digital_card/packages/mcp/dist/index.js"],
            env: {
              EIL_REGISTRY_URL: base,
            },
          },
        },
      },
      null,
      2
    ),

    mcpResolveEntity: `# After MCP is connected, the host exposes resolve_entity.
# Example tool call (conceptual):
{
  "name": "resolve_entity",
  "arguments": { "domain": "${PILOT_DOMAIN}" }
}

# Returns the same JSON as:
curl -s "${resolveUrl}"`,

    latencyComparison: `# Typical latency (same region, warm connection)
# EIL resolve (registry API):     ~50-200 ms  -> structured JSON, verified flag
# Domain well-known:              ~50-150 ms  -> same card when published
# HTML scrape + parse:            1-5+ sec    -> fragile, layout-dependent`,

    llamaindexReader: `from eil_reader import EILReader
from llama_index.core import VectorStoreIndex

# pip install llama-index-core requests
reader = EILReader(registry_base="${base}")
documents = reader.load_data(domain="${PILOT_DOMAIN}", split_catalog=True)

# Identity + per-product/offering chunks for RAG
index = VectorStoreIndex.from_documents(documents)
query_engine = index.as_query_engine()
response = query_engine.query("What does this organization offer?")
print(response)`,
  };
}

export function formatDiscoveryNote(
  template: string,
  baseUrl: string,
  pilotDomain = PILOT_DOMAIN
): string {
  const base = normalizeBase(baseUrl);
  return template
    .replace("{apiBase}", base)
    .replace("{pilotWellKnown}", `https://${pilotDomain}/.well-known/digital-card`);
}
