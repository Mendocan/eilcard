# @digitalcard/mcp

stdio MCP server exposing EIL Card registry resolve tools for AI agents.

## Tools

| Tool | Description |
|------|-------------|
| `resolve_domain` | `GET /api/v1/resolve?domain=` |
| `get_card_by_handle` | `GET /api/v1/cards/{handle}` |

## Run

```bash
cd packages/mcp
pnpm install
pnpm build
EIL_REGISTRY_URL=https://eilcard.com node dist/index.js
```

## Claude Desktop (example)

```json
{
  "mcpServers": {
    "eilcard": {
      "command": "node",
      "args": ["/absolute/path/digital_card/packages/mcp/dist/index.js"],
      "env": {
        "EIL_REGISTRY_URL": "https://eilcard.com"
      }
    }
  }
}
```

Default registry: `https://eilcard.com` (override with `EIL_REGISTRY_URL`).
