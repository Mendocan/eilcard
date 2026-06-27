# Registry JSON canonicalization — JWS signing payload

> **Status:** Draft — June 2026  
> **Audience:** SDK maintainers, security reviewers, Registry+ integrators

---

## 1. Why canonicalization matters

Registry+ cards include `signatures.registry.jws` — a compact JWS over the **public card JSON without the signatures block**. Agents and SDKs must reconstruct the same byte sequence the registry signed, or verification fails even when the card is authentic.

Canonicalization answers: *“Which JSON object is the signature over?”*

---

## 2. Signing scope

| Included | Excluded |
|----------|----------|
| All public card fields returned by `GET /api/v1/resolve` | `signatures` object (entire subtree) |
| Edition-specific fields (`capabilities`, `access_policy`, …) | HTTP `meta` wrapper (`source`, `resolved_at`) |
| `verified`, `card_id`, `handle`, `updated_at`, … | Request query parameters |

Implementation (TypeScript SDK):

```typescript
export function canonicalCardWithoutSignatures(card: Card): Record<string, unknown> {
  const clone = { ...card } as Record<string, unknown>;
  delete clone.signatures;
  return clone;
}
```

Python SDK mirrors this in `eil_card.jws`.

---

## 3. Payload comparison algorithm

Verification compares the JWS **payload** (middle segment, base64url-decoded JSON) to the resolved card:

1. Build `canonical = canonicalCardWithoutSignatures(card)`.
2. **Fast path:** `JSON.stringify(payload) === JSON.stringify(canonical)` — works when key order matches registry export.
3. **Fallback:** recursively sort object keys lexicographically, then compare stringified forms.

The fallback handles JSON serializers that emit keys in different orders. Arrays preserve element order; only object keys are sorted.

---

## 4. JWS compact form

```
{base64url(header)}.{base64url(payload)}.{base64url(signature)}
```

- **Header:** typically `{ "alg": "RS256", "kid": "..." }`
- **Payload:** canonical card JSON (no `signatures`)
- **Signing input:** UTF-8 bytes of `headerB64 + "." + payloadB64`
- **Algorithms:** `RS256`, `ES256` (Web Crypto / Node subtle.verify)

Without a registry public key PEM, SDKs perform **payload match only** (`verifyJws: true`). With PEM, full cryptographic verify runs (`requireValid: true`).

---

## 5. Well-known vs registry resolve

| Source | Canonicalization |
|--------|------------------|
| Registry resolve | Authoritative; includes `signatures` when Registry+ |
| Native `/.well-known/digital-card` | Should mirror registry fields; may omit `signatures` if served as static file |
| Registry proxy (`nginx proxy_pass`) | Same JSON as registry API |

Dashboard **well-known health check** compares `card_id`, `handle`, and `updated_at` — not full canonical hash. Agents should treat registry resolve as primary and use well-known as secondary origin proof.

---

## 6. Agent checklist

1. `DigitalCard.resolve({ domain })` — registry JSON.
2. Confirm `card_id === domain` and `verified === true`.
3. Optional: fetch native well-known; status should be `ok` (see playground compliance checker).
4. Registry+: `verifyRegistryJws(card, { publicKeyPem })` — payload match + signature valid.
5. Do **not** re-sign or mutate fields before verify; verify against the exact resolve response.

---

## 7. Related documents

- [Well-known trust model](./well-known-trust-model.md)
- [EIL access policy spec v0.1](./eil-access-policy-spec-v0.1.md)
- SDK: `packages/sdk/src/jws.ts`
- Python: `packages/python/eil_card/jws.py`
- CLI: `eil-card verify --domain … --jws`

---

## 8. Playground compliance checker

Public tool: [`/playground`](https://eilcard.com/playground) — runs registry resolve + well-known sync and scores core checks. API: `GET /api/v1/playground/compliance?domain=…`
