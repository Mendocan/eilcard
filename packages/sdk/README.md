# @digitalcard/sdk

TypeScript SDK for [EIL Card](https://eilcard.com) — resolve canonical organization and person profiles for AI agents.

## Install

```bash
npm install @digitalcard/sdk
```

## Quick start

```typescript
import { DigitalCard, toSchemaOrg } from '@digitalcard/sdk';

const { card, meta } = await DigitalCard.resolve({ domain: 'example.com' });

if (card.type === 'organization') {
  console.log(card.name.official);
}

const jsonLd = toSchemaOrg(card);
console.log(meta.source); // "registry" | "well-known"
```

Resolve by registry handle:

```typescript
const { card } = await DigitalCard.resolve({ handle: 'my-org' });
```

## Client options

```typescript
import { DigitalCardClient } from '@digitalcard/sdk';

const client = new DigitalCardClient({
  registryBaseUrl: 'https://eilcard.com',
  apiKey: process.env.EILCARD_API_KEY,
  timeout: 10_000,
  skipWellKnownFallback: false,
});

const result = await client.resolve({ domain: 'example.com' });
```

## Discovery chain

1. **Registry** — `GET {registry}/api/v1/resolve?domain=` or `/api/v1/cards/{handle}`
2. **Fallback** — `GET https://{domain}/.well-known/digital-card`

## Bridge functions

| Function | Output |
|----------|--------|
| `toSchemaOrg(card)` | schema.org JSON-LD |
| `toVCard(card)` | vCard 4.0 (person cards) |
| `toLlmsTxtSection(card)` | llms.txt Markdown section |

## License

MIT — see [LICENSE](../../LICENSE) in the repository root.
