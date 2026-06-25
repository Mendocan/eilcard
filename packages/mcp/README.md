# @digitalcard/mcp

stdio MCP server exposing EIL Card registry resolve tools for AI agents.

## Tools

| Tool | Description |
|------|-------------|
| `resolve_entity` | **Unified** — domain or handle → registry JSON |
| `resolve_domain` | `GET /api/v1/resolve?domain=` (legacy alias) |
| `get_card_by_handle` | `GET /api/v1/cards/{handle}` (legacy alias) |

### `resolve_entity`

Provide **either** `domain` or `handle` (domain wins when both are set):

```json
{ "domain": "sinyalle.com" }
```

```json
{ "handle": "sinyal24" }
```

Returns the same JSON as the public registry API.

## Run

```bash
cd packages/mcp
pnpm install
pnpm build
EIL_REGISTRY_URL=https://eilcard.com node dist/index.js
```

## Claude Desktop

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

## Cursor

Add to **Cursor Settings → MCP** (or `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "eilcard": {
      "command": "node",
      "args": ["C:/digital_card/packages/mcp/dist/index.js"],
      "env": {
        "EIL_REGISTRY_URL": "https://eilcard.com"
      }
    }
  }
}
```

Build first: `pnpm --filter @digitalcard/mcp build`

Default registry: `https://eilcard.com` (override with `EIL_REGISTRY_URL`).

## Latency

| Path | Typical |
|------|---------|
| `resolve_entity` (registry API) | ~50–200 ms |
| Domain `/.well-known/digital-card` | ~50–150 ms |
| HTML scrape + parse | 1–5+ s, fragile |

Prefer resolve before scraping when verifying entity identity.
