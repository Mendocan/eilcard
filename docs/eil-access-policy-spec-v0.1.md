# EIL Access Policy Spec v0.1 (public draft)

> **Status:** Draft — June 2026
> **Scope:** A machine-readable, dynamic declaration of an entity's current stance toward AI agents — "robots.txt for agents."
> **Companions:** [Identity Spec](./eil-identity-spec-v0.1.md) (who), [Access Spec](./eil-access-spec-v0.1.md) (authorized read), [Act Spec](./eil-act-spec-v0.1.md) (authorized write).
> **Out of scope:** Token issuance, consent screens, gateway implementation (platform concerns).

---

## 1. Purpose

The Identity, Access, and Act specs answer **who** an entity is and **how** an agent could interact through a gateway. They do not answer:

- **May** an agent interact at all, right now?
- Does the entity consent to its public card being used for **model training**?
- Is the gateway **temporarily paused** (maintenance, abuse response) even though the pointer still exists?

`capabilities` is a relatively **static capability pointer** ("here is my gateway and scopes"). Operators need a **dynamic, low-friction switch** that reflects current intent without re-issuing identity or signatures.

**EIL Access Policy** defines `access_policy` — a public, machine-readable field that an agent SHOULD consult **before** initiating gateway auth or treating the card as training-eligible. It is the agent-era analogue of `robots.txt` / `ai.txt`, bound to a verified entity rather than a path.

---

## 2. Relationship to other layers

| Question | Layer | Field |
|----------|-------|-------|
| Who is this entity? | Identity | card body, `verified` |
| Where is the gateway / what scopes? | Access / Act | `capabilities` |
| **May an agent read/act now? Training allowed?** | **Access Policy** | **`access_policy`** |

`access_policy` does **not** grant access. It declares **intent**; enforcement still happens at the gateway (OAuth, scope checks, entity binding). A permissive policy with no gateway grants nothing; a restrictive policy is a request agents SHOULD honor.

---

## 3. Field

Registry+ cards (`schema_version: "1.2"`) MAY export:

```json
{
  "access_policy": {
    "version": "0.1",
    "default": "gateway",
    "agents": {
      "read": "gateway",
      "act": "gateway",
      "training": "deny"
    },
    "state": "active",
    "gateway": "https://agent-gateway.eilcard.com",
    "contact": "agents@example.com",
    "policy_url": "https://example.com/agent-policy",
    "updated_at": "2026-06-27T10:00:00Z",
    "expires_at": "2026-12-31T00:00:00Z"
  }
}
```

### 3.1 Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `version` | Recommended | string | Policy schema version (`"0.1"`) |
| `default` | Recommended | `open` \| `gateway` \| `deny` | Fallback stance for any interaction not explicitly listed in `agents` |
| `agents.read` | Optional | `open` \| `gateway` \| `deny` | Stance for reading scoped/private data |
| `agents.act` | Optional | `open` \| `gateway` \| `deny` | Stance for write/act operations |
| `agents.training` | Optional | `allow` \| `deny` | Whether public card data may be used for model training |
| `state` | Optional | `active` \| `paused` \| `maintenance` | Current operational signal for the gateway |
| `gateway` | Optional | URL | Echoes `capabilities.agent_gateway`; MUST match if both present |
| `contact` | Optional | string | Email/URL for access requests or appeals |
| `policy_url` | Optional | URL | Human-readable agent/AI usage policy |
| `updated_at` | Recommended | RFC 3339 | When the policy was last changed (drives freshness) |
| `expires_at` | Optional | RFC 3339 | After this time, agents SHOULD re-resolve before trusting the policy |

### 3.2 Stance values

| Value | Meaning for the agent |
|-------|------------------------|
| `open` | Interaction permitted without gateway auth (public surface only) |
| `gateway` | Permitted **only** via the authorized gateway (OAuth / API key per Access/Act spec) |
| `deny` | Entity requests **no** automated interaction of this kind; agents SHOULD NOT proceed |

`agents.training`:

| Value | Meaning |
|-------|---------|
| `allow` | Card data may be ingested for model training |
| `deny` | Entity opts **out** of training use (honor like an `ai.txt` disallow) |

### 3.3 Resolution order

For a given interaction kind (`read` / `act`):

1. If `agents.{kind}` is set, use it.
2. Else use `default`.
3. Else (no `access_policy`) assume `open` for public identity and `gateway` for anything scoped — i.e. **backward-compatible**: absence of policy means today's behavior.

---

## 4. State semantics

`state` is the **dynamic** signal that motivates this spec:

| `state` | Agent guidance |
|---------|----------------|
| `active` | Normal; gateway available |
| `paused` | Owner temporarily suspended agent operations; do not initiate new gateway sessions; retry later |
| `maintenance` | Planned downtime; treat like `paused` with an expected return |

`state` lets an operator flip access off **without deleting the gateway pointer or re-signing the card**. It SHOULD be reflected at the gateway too (e.g. `503` with `Retry-After`), but the policy gives agents an early, cheap signal at resolve time.

---

## 5. Agent algorithm (recommended)

```
1. resolve(domain) → card                       (Identity Spec)
2. verify card.verified and (optional) JWS       (trust)
3. policy = card.access_policy
4. if policy.agents.training == "deny":
      do NOT use card for training
5. for the intended interaction kind:
      stance = policy.agents[kind] or policy.default or implicit
      if stance == "deny":      stop, surface contact/policy_url
      if stance == "open":      proceed on public surface
      if stance == "gateway":   require capabilities + OAuth (Access/Act)
6. if policy.state in {paused, maintenance}:
      defer gateway calls; honor expires_at / Retry-After
```

SDK helper: `discoverAccessPolicy(card)` returns a normalized view with resolved stances.

---

## 6. Trust and integrity

- `access_policy` lives **inside** the signed card body, so Registry+ JWS (Identity Spec §4.3) covers it — a valid signature attests the policy as published.
- Because it is dynamic, operators re-publishing the card (and, for Registry+, re-signing) updates the policy; `updated_at` / `expires_at` bound staleness.
- `access_policy` is **public** (it must be readable to be honored); it MUST NOT contain secrets, tokens, or PII.

---

## 7. Dashboard → well-known sync (platform)

On the EIL Card platform:

1. Registry+ owners toggle stance/state from the dashboard (e.g. "Pause agent access").
2. The change updates the stored card and `updated_at`.
3. Public surfaces — registry resolve, `/.well-known/digital-card`, registry well-known proxy — serve the updated `access_policy` immediately.
4. Core/Business editions MUST NOT send `access_policy`; public export strips it (same rule as `capabilities`).

This keeps a single source of truth: the dashboard writes; every discovery surface mirrors.

---

## 8. Editions

| Edition | `access_policy` |
|---------|-----------------|
| `core` (1.0) | Not allowed (stripped on export) |
| `business` (1.1) | Not allowed (stripped on export) |
| `registry_plus` (1.2) | Allowed |

No new `schema_version` is introduced; `access_policy` is a v1.2 (Registry+) field alongside `capabilities` and `signatures`.

---

## 9. Examples

### 9.1 Open identity, gateway-only data, no training

```json
{
  "access_policy": {
    "version": "0.1",
    "default": "gateway",
    "agents": { "read": "gateway", "act": "gateway", "training": "deny" },
    "state": "active",
    "updated_at": "2026-06-27T10:00:00Z"
  }
}
```

### 9.2 Temporarily paused

```json
{
  "access_policy": {
    "version": "0.1",
    "default": "gateway",
    "state": "paused",
    "contact": "agents@example.com",
    "updated_at": "2026-06-27T18:00:00Z",
    "expires_at": "2026-06-28T06:00:00Z"
  }
}
```

### 9.3 Fully closed to automated agents

```json
{
  "access_policy": {
    "version": "0.1",
    "default": "deny",
    "agents": { "training": "deny" },
    "policy_url": "https://example.com/no-agents",
    "updated_at": "2026-06-27T10:00:00Z"
  }
}
```

---

## 10. References

| Document | Path |
|----------|------|
| Identity Spec | `docs/eil-identity-spec-v0.1.md` |
| Access Spec (read) | `docs/eil-access-spec-v0.1.md` |
| Act Spec (write) | `docs/eil-act-spec-v0.1.md` |
| Well-known trust model | `docs/well-known-trust-model.md` |
| Card schema | `schema/SCHEMA.md` |
| SDK | `packages/sdk/SDK.md` |

---

## 11. Changelog

| Version | Date | Notes |
|---------|------|-------|
| v0.1 | 2026-06 | Initial draft — dynamic agent access policy + training opt-out + operational state |
