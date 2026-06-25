# @digitalcard/pilot-gateway-sinyalle

Reference **external** agent gateway for the Sinyalle E3-B pilot. Implements OAuth (PKCE) and scoped `read:*` endpoints outside the EIL Card monolith.

**Do not deploy on eilcard.com.** Run on Sinyalle infrastructure or locally for integration tests.

## Start

```bash
pnpm --filter @digitalcard/pilot-gateway-sinyalle start
```

See [docs/pilot-gateway-sinyalle.md](../../docs/pilot-gateway-sinyalle.md) for full API and OAuth flow.

## Endpoints

- `GET /.well-known/agent-gateway`
- `GET /oauth/authorize` + `POST /oauth/authorize/confirm`
- `POST /oauth/token`
- `GET /v1/read/profile` (scope `read:profile`)
- `GET /v1/read/orders` (scope `read:orders`)

Access tokens include `eil_card_id` binding per [EIL Access Spec v0.1](../../docs/eil-access-spec-v0.1.md).
