import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const DEFAULT_REGISTRY = "https://eilcard.com";

function registryBase(): string {
  return (process.env.EIL_REGISTRY_URL ?? DEFAULT_REGISTRY).replace(/\/$/, "");
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Registry ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function resolveDomain(domain: string) {
  const url = `${registryBase()}/api/v1/resolve?domain=${encodeURIComponent(domain)}`;
  return fetchJson(url);
}

export async function getCardByHandle(handle: string) {
  const url = `${registryBase()}/api/v1/cards/${encodeURIComponent(handle)}`;
  return fetchJson(url);
}

function textResult(payload: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
  };
}

export function createEilCardMcpServer() {
  const server = new McpServer({
    name: "eilcard-registry",
    version: "0.1.0",
  });

  server.tool(
    "resolve_domain",
    "Resolve a verified entity card by domain via the EIL Card registry API.",
    { domain: z.string().min(1).describe("Root domain, e.g. sinyalle.com") },
    async ({ domain }) => textResult(await resolveDomain(domain))
  );

  server.tool(
    "get_card_by_handle",
    "Fetch canonical registry JSON for a card handle (e.g. sinyal24).",
    { handle: z.string().min(1).describe("Registry handle without @") },
    async ({ handle }) => textResult(await getCardByHandle(handle))
  );

  return server;
}

async function main() {
  const server = createEilCardMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("[eilcard-mcp] fatal:", error);
  process.exit(1);
});
