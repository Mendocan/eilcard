# Pilot gateway — EIL pointer pattern

> **Status:** Draft — June 2026  
> **Model:** Harici platform gateway; EIL Card yalnızca `capabilities` pointer taşır.

---

## 1. Özet

E3-B pilotu, OAuth ve özel veriyi **EIL Card monolitine gömmeden** doğrular:

1. Kurumun Registry+ kartında `capabilities.agent_gateway` URL'si yayınlanır.
2. Agent önce `resolve_entity` / `DigitalCard.resolve()` ile kimliği çözer.
3. Agent, gateway'de OAuth veya API key ile scoped token alır.
4. Özel veri platform API'sinden okunur.

EIL Card bu akışta **kimlik + pointer** sağlar; gateway ayrı deploy edilir.

---

## 2. Referans mimari (Sinyalle örneği)

```
┌──────────────────┐     resolve      ┌─────────────────┐
│  AI Agent        │ ───────────────► │  eilcard.com    │
│  (MCP / SDK)     │ ◄─────────────── │  registry API   │
└────────┬─────────┘   card JSON      └─────────────────┘
         │              capabilities.agent_gateway
         │              = https://api.sinyalle.com/v1/agent-gateway
         ▼
┌──────────────────┐   OAuth 2.1      ┌─────────────────┐
│  User browser    │ ◄──────────────► │  Sinyalle       │
│  (consent)       │                  │  agent gateway  │
└──────────────────┘                  └────────┬────────┘
                                               │
                                               ▼
                                      Private APIs (orders, CRM, …)
```

| Bileşen | Konum | Durum |
|---------|-------|--------|
| Public identity | EIL Card `@sinyalle` / `sinyalle.com` | Canlı |
| `capabilities` pointer | Registry+ kart JSON | API ile set edilebilir |
| Agent gateway | `api.sinyalle.com` (örnek) | Harici — pilot implementasyon |
| Consent UI | Sinyalle dashboard | Platform sorumluluğu |

---

## 3. Örnek kart snippet (Registry+)

```json
{
  "edition": "registry_plus",
  "schema_version": "1.2",
  "card_id": "sinyalle.com",
  "handle": "sinyalle",
  "verified": true,
  "capabilities": {
    "agent_gateway": "https://api.sinyalle.com/v1/agent-gateway",
    "auth": "oauth2",
    "scopes": ["read:profile", "read:orders", "write:post", "act:comment"],
    "actions": [
      {
        "id": "create_post",
        "label": "Create blog post",
        "method": "POST",
        "path": "/v1/posts",
        "scopes": ["write:post"],
        "idempotent": true
      }
    ]
  }
}
```

Dashboard UI henüz yok — değer API PATCH ile set edilir (Registry+ + enterprise add-on gerekir).

---

## 4. Agent akışı (pseudocode)

```typescript
import { DigitalCard, discoverCapabilities } from '@digitalcard/sdk';

// 1. Identity (public)
const { card } = await DigitalCard.resolve({ domain: 'sinyalle.com' });
if (!card.verified) throw new Error('Entity not verified');

// 2. Capabilities pointer
const caps = discoverCapabilities(card);
if (!caps.available) throw new Error('No agent gateway configured');

// 3. Platform OAuth (implemented by Sinyalle — not EIL Card)
// redirect user to caps.agent_gateway + /.well-known/agent-gateway
// → authorization_endpoint, exchange code for token

// 4. Private read — platform API
// fetch(..., { headers: { Authorization: `Bearer ${accessToken}` } });

// 5. Authorized act (E3-C) — idempotent write
// import { discoverActCapabilities, buildIdempotencyKey, agentActHeadersToFetch, buildAgentActHeaders } from '@digitalcard/sdk';
// const act = discoverActCapabilities(card);
// const action = act.actions?.find((a) => a.id === 'create_post');
// if (action) {
//   const key = buildIdempotencyKey({ agentClientId: 'acme', actionId: action.id, entityId: card.card_id, nonce: crypto.randomUUID() });
//   const headers = agentActHeadersToFetch(buildAgentActHeaders({ accessToken, idempotencyKey: key, actionId: action.id, cardId: card.card_id }));
//   // fetch(`${caps.agent_gateway}${action.path}`, { method: action.method, headers, body: JSON.stringify({...}) });
// }
```

---

## 5. Gateway minimum API (platform)

Pilot gateway SHOULD implement:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/.well-known/agent-gateway` | GET | OAuth metadata |
| `/oauth/authorize` | GET | User consent redirect |
| `/oauth/token` | POST | Code / token exchange |
| `POST /v1/*` | POST | Scoped act (idempotent) |

EIL Card bu endpoint'leri host etmez. Act pattern: [EIL Act Spec v0.1](./eil-act-spec-v0.1.md).

---

## 6. Başarı kriterleri (pilot)

- [ ] Registry+ kartta `agent_gateway` canlı URL
- [ ] Agent resolve → capabilities discovery uçtan uca
- [ ] En az bir `read:*` scope ile consent + token
- [ ] En az bir `write:` veya `act:` scope ile ayrı consent (E3-C)
- [ ] Idempotent POST with `Idempotency-Key` replay test
- [ ] Token `eil_card_id` claim ile domain'e bağlı
- [ ] Revoke sonrası 401
- [ ] Audit log (platform tarafı)

---

## 7. Yapılmayacaklar (pilot)

- OAuth sunucusunu `apps/web` içine gömme
- Private veriyi public kart JSON'a yazma
- Tek "Universal Agent Protocol" monolit servisi

---

## 8. İlgili belgeler

- [EIL Access Spec v0.1](./eil-access-spec-v0.1.md)
- [Consent UX Guide](./consent-ux-guide.md)
- [EIL Act Spec v0.1](./eil-act-spec-v0.1.md)
- [Registry+ edition](./registry-plus.md)
- [MCP README](../packages/mcp/README.md)
