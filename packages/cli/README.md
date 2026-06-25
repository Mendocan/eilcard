# @digitalcard/cli

Command-line tool for [EIL Card](https://eilcard.com) — initialize a local project, verify registry/DNS/well-known setup, and export static `/.well-known/digital-card` JSON.

## Install

```bash
npm install -g @digitalcard/cli
# or from monorepo
pnpm --filter @digitalcard/cli build
node packages/cli/dist/cli.js --help
```

## Commands

### `eil-card init`

Creates `eil.config.json` and `.eil/card.json` in the current directory.

```bash
eil-card init --domain acme.com --handle acme
```

### `eil-card verify`

Runs checks against the configured (or passed) handle/domain:

- **resolve** — registry API `DigitalCard.resolve()`
- **dns** — `_TXT` record containing `digitalcard-verify=` (when domain is set)
- **well-known** — `https://{domain}/.well-known/digital-card` matches registry card
- **jws** — optional Registry+ attestation (`--jws --public-key-pem ./registry-public.pem`)

```bash
eil-card verify
eil-card verify --domain acme.com --json
eil-card verify --handle acme --jws --public-key-pem ./registry-public.pem
```

### `eil-card export well-known`

Writes canonical card JSON for static hosting or cPanel upload.

```bash
eil-card export well-known --handle acme --out public/.well-known/digital-card
eil-card export well-known --from-local --out .well-known/digital-card
```

## Configuration (`eil.config.json`)

```json
{
  "registry": "https://eilcard.com",
  "handle": "acme",
  "domain": "acme.com",
  "cardFile": ".eil/card.json"
}
```

## Environment

| Variable | Description |
|----------|-------------|
| `EIL_REGISTRY_URL` | Default registry base URL |

## Related packages

- [`@digitalcard/sdk`](https://www.npmjs.com/package/@digitalcard/sdk) — TypeScript resolve client
- [`@digitalcard/mcp`](../mcp) — MCP server for agents
