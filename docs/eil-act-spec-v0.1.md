# EIL Act Spec v0.1 (public draft)

> **Status:** Draft — June 2026  
> **Scope:** Authorized write and interaction via platform agent gateways.  
> **Companions:** [Identity Spec](./eil-identity-spec-v0.1.md) · [Access Spec](./eil-access-spec-v0.1.md)  
> **Out of scope:** OAuth server, action execution, or private payloads inside EIL Card core.

---

## 1. Purpose

**EIL Act** defines how agents perform **mutating operations** on behalf of a user or entity after identity resolve and scoped authorization.

Examples: publish a post, place an order, send a support reply, trigger a workflow.

EIL Card does **not** execute actions. Registry+ `capabilities` declares:

- `write:` and `act:` scopes
- Optional `actions[]` manifest (method, path, required scopes, idempotency hint)

The **platform gateway** implements endpoints, consent for destructive scopes, idempotency storage, audit logs, and rate limits.

---

## 2. Layering

```
resolve (Identity)  →  token (Access)  →  act (this spec)
     public JSON          read:* scopes       write:* / act:*
```

| Phase | Spec | EIL Card role |
|-------|------|---------------|
| Discovery | Identity v0.1 | `resolve_entity`, public card |
| Authorized read | Access v0.1 | `capabilities` pointer |
| **Authorized act** | **Act v0.1** | `capabilities.scopes` + `capabilities.actions` |

---

## 3. Scope model

Scopes use a **kind prefix** and **resource verb**:

```
{kind}:{resource}[_{detail}]
```

### 3.1 Kinds

| Prefix | Semantics | HTTP typical |
|--------|-----------|--------------|
| `read:` | Non-mutating private data | GET |
| `write:` | Create / update / delete resources | POST, PUT, PATCH, DELETE |
| `act:` | One-shot interaction (comment, react, approve) | POST (often idempotent) |

### 3.2 Standard write scopes (v0.1)

| Scope | Meaning |
|-------|---------|
| `write:post` | Create or edit posts / articles |
| `write:order` | Create or modify orders |
| `write:profile` | Update profile fields not in public card |
| `write:settings` | Change account or org settings |

### 3.3 Standard act scopes (v0.1)

| Scope | Meaning |
|-------|---------|
| `act:comment` | Post a comment or reply |
| `act:react` | Like, emoji, or lightweight reaction |
| `act:approve` | Approve a pending item (workflow) |
| `act:notify` | Send a notification on user's behalf |

Platforms MAY define additional scopes. Agents MUST request the **minimum** scope for the intended operation.

### 3.4 Scope escalation

Granting `write:*` or `act:*` MUST require **explicit user consent** separate from read-only grants (see [Consent UX](./consent-ux-guide.md) § Act scopes).

---

## 4. Capability manifest extension

Registry+ cards MAY extend `capabilities`:

```json
{
  "capabilities": {
    "agent_gateway": "https://api.example.com/v1/agent-gateway",
    "auth": "oauth2",
    "scopes": [
      "read:profile",
      "write:post",
      "act:comment"
    ],
    "actions": [
      {
        "id": "create_post",
        "label": "Create blog post",
        "method": "POST",
        "path": "/v1/posts",
        "scopes": ["write:post"],
        "idempotent": true
      },
      {
        "id": "add_comment",
        "label": "Add comment",
        "method": "POST",
        "path": "/v1/posts/{post_id}/comments",
        "scopes": ["act:comment"],
        "idempotent": true
      }
    ]
  }
}
```

### 4.1 `actions[]` fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | ✅ | Stable action id (`create_post`) |
| `label` | ❌ | Human label for consent UI |
| `method` | ✅ | `POST` \| `PUT` \| `PATCH` \| `DELETE` |
| `path` | ✅ | Relative path under `agent_gateway` |
| `scopes` | ✅ | One or more scopes required to invoke |
| `idempotent` | ❌ | Default `true` for POST `act:` actions |

Path templates MAY use `{param}` placeholders. Resolution is gateway-defined.

---

## 5. Idempotent agent action API pattern

Platforms SHOULD implement mutating endpoints with **idempotency keys** to prevent duplicate side effects when agents retry.

### 5.1 Request

```http
POST {agent_gateway}/v1/posts
Authorization: Bearer {access_token}
Idempotency-Key: {key}
Content-Type: application/json
X-EIL-Action-Id: create_post
X-EIL-Card-Id: sinyalle.com

{
  "title": "Quarterly update",
  "body": "..."
}
```

| Header | Purpose |
|--------|---------|
| `Idempotency-Key` | Client-generated unique key per logical action |
| `X-EIL-Action-Id` | Matches `capabilities.actions[].id` when declared |
| `X-EIL-Card-Id` | Entity binding — must match token claim |

### 5.2 Idempotency key format (recommended)

```
eil-act/{agent_client_id}/{action_id}/{entity_id}/{nonce}
```

- `nonce` — UUID or hash of canonical request body
- Same key + same body → replay stored response (HTTP 200)
- Same key + different body → `409 Conflict` (`idempotency_key_reused`)

### 5.3 Response

```json
{
  "id": "post_8f3a2b",
  "status": "published",
  "created_at": "2026-06-25T12:00:00Z",
  "_eil": {
    "action_id": "create_post",
    "idempotency_key": "eil-act/acme-agent/create_post/sinyalle.com/7c9e…",
    "replay": false
  }
}
```

### 5.4 SDK helper

```typescript
import { buildIdempotencyKey, discoverActCapabilities } from '@digitalcard/sdk';

const act = discoverActCapabilities(card);
const key = buildIdempotencyKey({
  agentClientId: 'acme-assistant',
  actionId: 'create_post',
  entityId: card.card_id,
  nonce: crypto.randomUUID(),
});
```

---

## 6. Audit requirements

Platforms MUST log each successful and denied act attempt:

| Field | Example |
|-------|---------|
| `timestamp` | ISO 8601 |
| `eil_card_id` | `sinyalle.com` |
| `user_id` | Platform user sub |
| `agent_client_id` | OAuth client id |
| `action_id` | `create_post` |
| `scopes` | Granted scopes used |
| `idempotency_key` | If present |
| `outcome` | `success` \| `denied` \| `error` |
| `resource_id` | Created/affected resource |

Retention: minimum 90 days for enterprise pilots; user-visible audit export recommended.

EIL Card registry does **not** store act audit logs (platform responsibility).

---

## 7. Rate limits and abuse

| Control | Recommendation |
|---------|----------------|
| Per-token rate limit | e.g. 60 act requests / minute |
| Per-action cooldown | e.g. `act:comment` max 10/min per user |
| Scope-specific caps | `write:order` stricter than `act:react` |
| Anomaly detection | Burst from new agent client → challenge or revoke |
| Revocation | User revokes grant → 401 immediately |

Gateway SHOULD return:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
Content-Type: application/json

{"error":"rate_limited","code":"act_rate_limit","action_id":"create_post"}
```

---

## 8. Error model (act)

| HTTP | Code | Meaning |
|------|------|---------|
| 400 | `invalid_action` | Unknown `X-EIL-Action-Id` |
| 403 | `insufficient_scope` | Token lacks `write:` / `act:` scope |
| 403 | `consent_required` | Write/act not yet granted |
| 409 | `idempotency_key_reused` | Key reused with different payload |
| 422 | `validation_failed` | Body fails gateway schema |
| 429 | `act_rate_limit` | Rate limit exceeded |

---

## 9. Naming: not "Universal Agent Protocol"

v0.1 intentionally avoids productized protocol names. Use **EIL Act** or **agent gateway act profile** until multi-vendor consensus exists.

---

## 10. Relationship to other specs

| Topic | Document |
|-------|----------|
| Public identity | Identity Spec v0.1 |
| OAuth + read | Access Spec v0.1 |
| Consent UI | Consent UX Guide |
| Pilot pointer | Pilot Gateway |
| Card JSON fields | `schema/SCHEMA.md` §1f |

---

## 11. Changelog

| Version | Date | Notes |
|---------|------|-------|
| v0.1 | 2026-06 | Write/act scopes, actions manifest, idempotency pattern, audit/rate-limit standards |
