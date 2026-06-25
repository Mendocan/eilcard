# EIL Access Spec v0.1 (public draft)

> **Status:** Draft — June 2026  
> **Scope:** Authorized read of private/scoped data via platform gateways.  
> **Companion:** [EIL Identity Spec v0.1](./eil-identity-spec-v0.1.md) — discovery and public identity only.  
> **Out of scope:** Write/act (see E3-C), OAuth server implementation inside EIL Card core.

---

## 1. Purpose

After an agent **resolves** entity identity (Identity Spec), it may need **scoped private data** — order history, internal posts, CRM fields — that must never appear in public registry JSON.

**EIL Access** standardizes:

- How a digital card **points** to an external agent gateway
- How platforms declare **auth type** and **scopes**
- A **reference OAuth 2.1 delegation flow** (implemented by the platform, not EIL Card)
- Binding between gateway tokens and the **verified entity** (`card_id` / domain)

EIL Card stores the pointer; the platform owns consent, tokens, and private APIs.

---

## 2. Architecture

```
Agent                    EIL Registry              Platform Gateway
  |                           |                          |
  |-- resolve(domain) ------->|                          |
  |<-- card + capabilities ---|                          |
  |                           |                          |
  |-- OAuth / API key ---------------------------------->|
  |<-- scoped access token ------------------------------|
  |-- GET /private-resource (Bearer) ------------------>|
  |<-- JSON --------------------------------------------|
```

| Layer | Owner | Responsibility |
|-------|-------|----------------|
| Identity | EIL Card | Public JSON, `verified`, discovery |
| Capability manifest | EIL Card (Registry+) | `agent_gateway`, `auth`, `scopes` pointer |
| Consent + tokens | Platform | User approval, OAuth, revocation |
| Private data | Platform | Business logic, PII, rate limits |

**EIL Card MUST NOT** host OAuth authorization servers, user consent screens for third-party platforms, or private data payloads in public card JSON.

---

## 3. Capability manifest

Registry+ cards (`schema_version: "1.2"`) MAY export:

```json
{
  "capabilities": {
    "agent_gateway": "https://api.example.com/v1/agent-gateway",
    "auth": "oauth2",
    "scopes": ["read:profile", "read:orders"]
  }
}
```

### 3.1 Fields

| Field | Required | Description |
|-------|----------|-------------|
| `agent_gateway` | Recommended | HTTPS base URL for agent-facing discovery and token exchange |
| `auth` | Optional | `none` \| `oauth2` \| `api_key` (default: infer from gateway) |
| `scopes` | Optional | Declared scope strings (max 20 × 64 chars) |

### 3.2 Gateway discovery (platform)

Platforms SHOULD expose machine-readable metadata at or under `agent_gateway`:

```
GET {agent_gateway}/.well-known/agent-gateway
```

Example response:

```json
{
  "issuer": "https://api.example.com",
  "authorization_endpoint": "https://api.example.com/oauth/authorize",
  "token_endpoint": "https://api.example.com/oauth/token",
  "scopes_supported": ["read:profile", "read:orders"],
  "grant_types_supported": ["authorization_code", "urn:ietf:params:oauth:grant-type:token-exchange"],
  "entity_binding": "eil_card_id"
}
```

This document is **platform-defined**; EIL Access v0.1 recommends the well-known path above for interoperability.

### 3.3 SDK helper

```typescript
import { discoverCapabilities } from '@digitalcard/sdk';

const { card } = await DigitalCard.resolve({ domain: 'example.com' });
const caps = discoverCapabilities(card);
// { available: true, agent_gateway, auth, scopes, edition }
```

---

## 4. Scope naming (read)

v0.1 recommends `read:` prefix for authorized read scopes:

| Scope | Meaning |
|-------|---------|
| `read:profile` | Extended profile beyond public card |
| `read:orders` | Order / transaction history (user-consented) |
| `read:posts_private` | Non-public posts or messages |
| `read:crm` | CRM or support ticket summary |

Platforms MAY define additional scopes. Agents MUST request the **minimum** scope needed.

Write/act scopes (`write:`, `act:`) are defined in **[EIL Act Spec v0.1](./eil-act-spec-v0.1.md)** (E3-C).

---

## 5. OAuth 2.1 reference flow (platform implements)

EIL Card does not issue tokens. Platforms implement OAuth 2.1 (or API keys for server-to-server) and bind grants to the resolved entity.

### 5.1 Preconditions

1. Agent resolved EIL Card JSON with `verified: true` (or explicit user trust).
2. `capabilities.agent_gateway` is present.
3. Platform registered the entity (`card_id` = domain or registry id).

### 5.2 User-delegated read (authorization code + PKCE)

Recommended for user-present consent (2025–2026 OAuth 2.1 practice):

1. **Agent** redirects user to platform `authorization_endpoint` with:
   - `client_id` — platform-registered agent app
   - `redirect_uri` — agent callback
   - `scope` — subset of `capabilities.scopes`
   - `code_challenge` / `code_challenge_method=S256` (PKCE)
   - `state` — CSRF protection
   - `eil_card_id` (custom param) — bound entity from resolve step

2. **User** reviews consent screen (see [Consent UX Guide](./consent-ux-guide.md)).

3. **Platform** returns `authorization_code` to `redirect_uri`.

4. **Agent** exchanges code at `token_endpoint` (with `code_verifier`).

5. **Platform** issues `access_token` with granted scopes and optional `entity_id` claim.

6. **Agent** calls private APIs with `Authorization: Bearer {access_token}`.

### 5.3 Agent delegation (token exchange)

For agent-to-agent or upstream IdP delegation, platforms MAY support RFC 8693 token exchange at `token_endpoint`:

```http
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:token-exchange
&subject_token={upstream_token}
&subject_token_type=urn:ietf:params:oauth:token-type:access_token
&scope=read:orders
&audience=https://api.example.com
```

Platform validates upstream token, maps user + entity, returns downstream scoped token.

### 5.4 API key (machine agents)

When `auth: "api_key"`, platforms MAY document a separate onboarding path (dashboard API keys, mTLS). Keys MUST be scoped and rotatable. Do not embed secrets in public EIL JSON.

### 5.5 Entity binding

Access tokens SHOULD include a claim tying the grant to the EIL entity:

```json
{
  "sub": "user-uuid",
  "eil_card_id": "sinyalle.com",
  "scope": "read:orders",
  "iss": "https://api.example.com"
}
```

Agents MUST verify `eil_card_id` matches the entity they resolved before trusting private responses.

---

## 6. Security requirements

| Requirement | Rationale |
|-------------|-----------|
| HTTPS only for `agent_gateway` | Prevent token and PII interception |
| Short-lived access tokens | Limit blast radius |
| Refresh token rotation (OAuth) | 2025+ best practice |
| Scope downgrade on refresh | User revokes partial access |
| Audit log per agent grant | Abuse investigation |
| Rate limits on gateway | Agent loops, credential stuffing |

Public EIL JSON never contains PII, tokens, or private payloads.

---

## 7. Error model (gateway)

Platforms SHOULD return consistent errors:

| HTTP | Code | Meaning |
|------|------|---------|
| 401 | `invalid_token` | Expired or revoked token |
| 403 | `insufficient_scope` | Scope not granted |
| 403 | `entity_mismatch` | Token `eil_card_id` ≠ resolved card |
| 429 | `rate_limited` | Back off and retry |

---

## 8. Relationship to Identity Spec

| Concern | Identity Spec | Access Spec |
|---------|---------------|-------------|
| Who is this entity? | ✅ | — |
| Public contact / offerings | ✅ | — |
| Private data | — | ✅ (via gateway) |
| `capabilities` pointer | Field defined | Semantics defined |
| MCP `resolve_entity` | ✅ | — |
| OAuth server | — | Platform only |

---

## 9. Pilot pattern

See [Pilot Gateway](./pilot-gateway.md) — external platform (e.g. Sinyalle) hosts gateway; EIL Card carries pointer only.

---

## 10. References

| Document | Path |
|----------|------|
| Identity Spec | `docs/eil-identity-spec-v0.1.md` |
| Consent UX | `docs/consent-ux-guide.md` |
| Pilot gateway | `docs/pilot-gateway.md` |
| **Act Spec (authorized write)** | `docs/eil-act-spec-v0.1.md` |
| Card schema | `schema/SCHEMA.md` §1f |
| Registry+ | `docs/registry-plus.md` |
| OAuth 2.1 | IETF draft / final (2025–2026) |
| Token exchange | RFC 8693 |

---

## 11. Changelog

| Version | Date | Notes |
|---------|------|-------|
| v0.1 | 2026-06 | Initial draft — authorized read, OAuth reference, capability manifest |
