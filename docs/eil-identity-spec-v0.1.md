# EIL Identity Spec v0.1 (public draft)

> **Status:** Draft — June 2026  
> **Scope:** Entity identity discovery and trust signals only.  
> **Out of scope:** Authorized read, authorized act, OAuth flows (see EIL Access Spec — E3-B).

---

## 1. Purpose

The **Entity Identity Layer (EIL)** provides a machine-readable, domain-bound record of who stands behind a domain: organization or person, contact, offerings, and verification status.

AI agents, payment systems, and integrations should **resolve** this record before scraping HTML or inferring facts from search snippets.

This specification defines:

- The entity model
- Discovery surfaces (registry, well-known, MCP)
- Trust signals (`verified`, DNS TXT, subscription)
- Schema versions and editions
- Bridge mappings (Schema.org JSON-LD)
- Reserved `capabilities` pointer (filled by E3-B)

---

## 2. Entity model

### 2.1 Card types

| `type` | Description |
|--------|-------------|
| `organization` | Legal or commercial entity bound to a root domain |
| `person` | Individual professional identity |

### 2.2 Canonical identifiers

| Field | Role |
|-------|------|
| `card_id` | Canonical ID — typically the root domain (org) or unique handle (person) |
| `handle` | Short registry name (`sinyalle`) for `GET /api/v1/cards/{handle}` |
| `domain` | Stored server-side; drives `card_id` for organizations |

### 2.3 Editions and schema versions

| `edition` | `schema_version` | Identity surface |
|-----------|------------------|------------------|
| `core` | `1.0` | Contact, description, products, actions |
| `business` | `1.1` | + `offerings[]`, `content_locale` |
| `registry_plus` | `1.2` | + `signatures`, `capabilities` (export) |

Edition gates plan tier and optional enterprise add-on on the EIL Card platform. The **public JSON shape** is edition-aware: Core/Business responses omit Registry+-only fields.

---

## 3. Discovery

Agents SHOULD try discovery in this order:

1. **Domain well-known** — `GET https://{domain}/.well-known/digital-card`  
   RFC 8615 mirror of registry JSON when the domain owner publishes it.

2. **Registry resolve** — `GET https://eilcard.com/api/v1/resolve?domain={domain}`  
   Returns `{ card, meta }` with `meta.source` = `registry` or `well-known`.

3. **Registry by handle** — `GET https://eilcard.com/api/v1/cards/{handle}`  
   When only the handle is known.

4. **MCP** — `@digitalcard/mcp` tool `resolve_entity`  
   Unified wrapper over resolve / get-by-handle for Claude Desktop, Cursor, and other MCP hosts.

### 3.1 MCP tools

| Tool | Input | Output |
|------|-------|--------|
| `resolve_entity` | `domain` **or** `handle` | Registry JSON |
| `resolve_domain` | `domain` | Same (legacy) |
| `get_card_by_handle` | `handle` | Same (legacy) |

Environment: `EIL_REGISTRY_URL` (default `https://eilcard.com`).

### 3.2 Agent card template

`GET /.well-known/agent-card.json` (domain or registry mirror) exposes an A2A-inspired template with `eil.resolveUrl` and skills derived from the digital card.

### 3.3 llms.txt

Site-level `llms.txt` may include an **Agent discovery** section with resolve, well-known, and schema.org URLs.

---

## 4. Trust

### 4.1 `verified`

When `verified: true`, the registry attests that the card owner proved control of the domain (typically DNS TXT). Agents MAY treat this as an authoritative identity signal for that domain.

`verification_method` MUST be present when `verified` is true (e.g. `["dns"]`).

### 4.2 Subscription lapse

If the owner's paid subscription lapses, public JSON MAY set `verified: false` even when DNS proof remains on file. Agents SHOULD not treat lapsed cards as fully trusted.

### 4.3 Registry+ signatures (v1.2)

`signatures.registry` carries an optional compact JWS over canonical card JSON. Verification tooling and key distribution are platform concerns; v0.1 defines storage and export only.

---

## 5. Capabilities (reserved, v1.2)

Registry+ cards MAY include:

```json
{
  "capabilities": {
    "agent_gateway": "https://api.example.com/agents/eil",
    "auth": "oauth2",
    "scopes": ["read:profile", "read:orders"]
  }
}
```

| Field | Description |
|-------|-------------|
| `agent_gateway` | HTTPS URL for authorized agent interaction (E3-B) |
| `auth` | `none` \| `oauth2` \| `api_key` |
| `scopes` | Declared scope strings (max 20) |

**v0.1:** Field is accepted by API and exported on Registry+ public JSON. Semantics, consent, and OAuth flows are defined in **EIL Access Spec** (E3-B). Dashboard UI is not required in v0.1.

Core and Business editions MUST NOT send `capabilities`; public export strips the field.

---

## 6. Schema.org bridge

`GET /api/v1/cards/{handle}/schema.json` returns JSON-LD via `toSchemaOrg()`:

- `Organization` or `Person` as appropriate
- `hasOfferCatalog` for Business/Registry+ offerings
- `additionalProperty` with `eil:schema_version` and `eil:edition`
- `potentialAction` → `InteractAction` when `capabilities.agent_gateway` is set

Human card pages embed the same JSON-LD for crawlers and agents.

---

## 7. Federated registry

**Deferred.** MVP uses a single registry (`eilcard.com`). Cross-registry federation and sync protocols are future work.

---

## 8. References

| Document | Path |
|----------|------|
| Card JSON schema | `schema/SCHEMA.md` |
| Registry+ edition | `docs/registry-plus.md` |
| **Access Spec (authorized read)** | `docs/eil-access-spec-v0.1.md` |
| Agent strategy | `docs/strateji-agent-cagi.md` |
| MCP package | `packages/mcp/README.md` |
| SDK | `packages/sdk/SDK.md` |
| OpenAPI | `https://eilcard.com/openapi.yaml` |

---

## 9. Changelog

| Version | Date | Notes |
|---------|------|-------|
| v0.1 | 2026-06 | Initial public draft — identity + discovery only |
