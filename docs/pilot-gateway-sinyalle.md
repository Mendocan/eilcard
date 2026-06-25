# Sinyalle pilot gateway — reference server

> **Package:** `packages/pilot-gateway-sinyalle`  
> **Deploy:** Harici — **eilcard.com üzerinde çalışmaz**

Bu paket, [Pilot gateway pattern](./pilot-gateway.md) ve [EIL Access Spec v0.1](./eil-access-spec-v0.1.md) için minimal referans implementasyondur. OAuth 2.1-style PKCE, consent sayfası ve `read:profile` / `read:orders` endpoint'lerini içerir.

---

## Hızlı başlangıç

```bash
pnpm --filter @digitalcard/pilot-gateway-sinyalle start
```

Varsayılan: `http://localhost:8787`

| Ortam değişkeni | Açıklama |
|-----------------|----------|
| `GATEWAY_PORT` | Dinleme portu (default `8787`) |
| `GATEWAY_ISSUER` | Issuer URL (default `http://localhost:{PORT}`) |
| `PILOT_CLIENT_ID` | OAuth client id (default `eil-pilot-agent`) |
| `PILOT_EIL_CARD_ID` | Token `eil_card_id` claim (default `sinyalle.com`) |

---

## Endpoint'ler

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/.well-known/agent-gateway` | GET | OAuth metadata |
| `/oauth/authorize` | GET | Consent + authorization code redirect |
| `/oauth/token` | POST | Authorization code + PKCE → access token |
| `/v1/read/profile` | GET | Bearer `read:profile` |
| `/v1/read/orders` | GET | Bearer `read:orders` |
| `/health` | GET | Liveness |

### Well-known örnek

```bash
curl -s http://localhost:8787/.well-known/agent-gateway | jq
```

### OAuth akışı (PKCE)

1. `code_verifier` üret; `code_challenge = BASE64URL(SHA256(verifier))`
2. Tarayıcıyı aç:

```
GET /oauth/authorize?client_id=eil-pilot-agent
  &redirect_uri=http://127.0.0.1:9999/callback
  &scope=read:profile%20read:orders
  &code_challenge={challenge}
  &code_challenge_method=S256
  &state=xyz
  &eil_card_id=sinyalle.com
```

3. Consent onayı → `redirect_uri?code=...&state=xyz`
4. Token:

```bash
curl -s -X POST http://localhost:8787/oauth/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=authorization_code' \
  -d 'code=...' \
  -d 'client_id=eil-pilot-agent' \
  -d 'redirect_uri=http://127.0.0.1:9999/callback' \
  -d 'code_verifier=...'
```

5. Private read:

```bash
curl -s http://localhost:8787/v1/read/profile \
  -H "Authorization: Bearer {access_token}"
```

Token payload (in-memory pilot): `sub`, `eil_card_id`, `scope`, `exp`.

---

## Production deploy (interim host)

Pilot gateway runs as a **separate Docker service** on the Sinyalle/EIL VPS — not inside `apps/web`.

| Adım | Komut / ayar |
|------|----------------|
| DNS | `agent-gateway.eilcard.com` → VPS A kaydı (geçici); hedef: `agent-gateway.sinyalle.com` |
| Env | `.env.prod`: `GATEWAY_DOMAIN`, `GATEWAY_ISSUER`, `PILOT_EIL_CARD_ID=sinyalle.com` |
| Deploy | `scripts/prod-deploy-eilcard.sh` (pilot-gateway container + Caddy site) |
| Registry pointer | `node apps/web/scripts/seed-sinyalle-pilot-gateway.mjs` on VPS |
| E2E | `GATEWAY_BASE=https://agent-gateway.eilcard.com pnpm --filter @digitalcard/pilot-gateway-sinyalle e2e` |

When Sinyalle DNS is ready, set `GATEWAY_DOMAIN=agent-gateway.sinyalle.com`, re-deploy, and re-run the seed script with `PILOT_AGENT_GATEWAY_URL`.

---

Production'da gateway ayrı host'ta çalışır; kart JSON yalnızca pointer taşır:

```json
{
  "capabilities": {
    "agent_gateway": "https://api.sinyalle.com",
    "auth": "oauth2",
    "scopes": ["read:profile", "read:orders"]
  }
}
```

Agent akışı:

```typescript
import { DigitalCard, discoverCapabilities } from '@digitalcard/sdk';

const { card } = await DigitalCard.resolve({ domain: 'sinyalle.com' });
const caps = discoverCapabilities(card);
// fetch caps.agent_gateway + '/.well-known/agent-gateway'
```

---

## Pilot kapsamı dışı

- Kalıcı token store, revoke, refresh token
- `write:` / `act:` endpoint'leri (E3-C ayrı consent — bkz. [EIL Act Spec](./eil-act-spec-v0.1.md))
- Production hardening (rate limit, mTLS, audit log)

---

## İlgili belgeler

- [Pilot gateway pattern](./pilot-gateway.md)
- [Consent UX Guide](./consent-ux-guide.md)
- [Well-known trust model](./well-known-trust-model.md)
