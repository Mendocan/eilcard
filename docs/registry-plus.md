# Registry+ edition (E2-D)

> Enterprise / high-trust registry layer  
> Son güncelleme: Haziran 2026

---

## Özet

**Registry+** = şema `1.2` + `edition: "registry_plus"`. Business edition alanlarının üstüne kriptografik attestation ve agent MCP araçları eklenir.

| Gereksinim | Değer |
|------------|--------|
| Min. plan | **Pro** (efektif tier) |
| Enterprise add-on | Admin tarafından açılır (sözleşme) |
| `schema_version` | `1.2` |
| Durum | Iskelet canlı — JWS doğrulama CLI sonraki adım |

---

## Edition karşılaştırması

| Özellik | Business | Registry+ |
|---------|----------|-----------|
| `offerings[]` | ✅ | ✅ |
| `content_locale` | ✅ | ✅ |
| `signatures.registry` (JWS) | — | ✅ |
| MCP resolve tools | — | ✅ (`@digitalcard/mcp`) |
| SLA / öncelikli destek | — | Sözleşme (manuel) |

---

## JWS imza alanı (`signatures`)

Registry+ kartları isteğe bağlı compact JWS taşıyabilir:

```json
{
  "edition": "registry_plus",
  "schema_version": "1.2",
  "signatures": {
    "registry": {
      "alg": "RS256",
      "kid": "eilcard-key-2026",
      "jws": "eyJhbGciOiJSUzI1NiIs..."
    }
  }
}
```

- **Şimdilik:** saklama + public export; JWS doğrulama CLI sonraki adım.
- **Core / Business:** `signatures` ve `capabilities` API tarafından reddedilir.

---

## Enterprise add-on

Polar'da ayrı SKU yok. Akış:

1. Müşteri **Pro** aboneliği (Verified yetmez — Registry+ edition seçimi Pro + add-on).
2. Sözleşme sonrası admin → kullanıcı detayı → **Enterprise add-on** işaretle.
3. Dashboard'da kart edition → **Registry+** seçilebilir.

---

## MCP sunucusu

Paket: `packages/mcp` (`@digitalcard/mcp`)

| Tool | API |
|------|-----|
| `resolve_entity` | domain **or** handle (unified) |
| `resolve_domain` | `/api/v1/resolve?domain=` |
| `get_card_by_handle` | `/api/v1/cards/{handle}` |

Bkz. `packages/mcp/README.md` — Claude Desktop / Cursor MCP yapılandırması.

---

## Federated registry değerlendirmesi

**Karar (2026-06):** Ertele — tek registry (`eilcard.com`) MVP için yeterli.

| Seçenek | Artı | Eksi |
|---------|------|------|
| Merkezi registry (bugün) | Hız, analytics, billing | SPOF algısı |
| Federated mesh | Dağıtık güven | Ops maliyeti, spec olgunluğu |
| Hibrit + well-known | Domain kanıtı var | Federation henüz gerekmez |

**Tetikleyici:** 50+ kurumsal Registry+ müşteri veya kamu RFP talebi gelince yeniden değerlendir.

---

## İlgili belgeler

- `schema/SCHEMA.md` — `signatures`, `capabilities`
- `docs/eil-identity-spec-v0.1.md` — identity + discovery spec
- `docs/eil-access-spec-v0.1.md` — authorized read + OAuth reference
- `docs/eil-act-spec-v0.1.md` — authorized write/act
- `docs/consent-ux-guide.md` — platform consent UX
- `docs/pilot-gateway.md` — external gateway pointer pattern
- `docs/strateji-agent-cagi.md` — E3-A MCP + Identity spec
- `docs/core-edition.md` — Core / Business referans
