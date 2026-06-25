# Dijital Kart — Şema v1.0

> Faz B1 çıktısı  
> Son güncelleme: Haziran 2026  
> Dosyalar: `v1.0.schema.json`, `examples/`

---

## 1. Özet

| Alan | Değer |
|------|-------|
| **Versiyon** | `1.0` (Core edition); `1.1` (Business / Registry+) |
| **Edition** | `core` \| `business` \| `registry_plus` — kart zenginliği katmanı |
| **Format** | JSON (UTF-8) |
| **Tipler** | `organization`, `person` |
| **JSON Schema** | `v1.0.schema.json` (draft 2020-12) |
| **Keşif** | Registry + `/.well-known/digital-card` |

---

## 1b. Edition modeli (Eksen 2)

Edition, kartın şema zenginliğini belirler. Abonelik planı (tier) hangi edition'ların kullanılabileceğini sınırlar.

| Edition | `schema_version` | Min. plan | Kim için |
|---------|------------------|-----------|----------|
| **core** | `1.0` | Free | KOBİ, pilot, tek marka |
| **business** | `1.1` | Verified+ | Holding, çok iş kolu |
| **registry_plus** | `1.2` | Pro + enterprise add-on | Finans, kamu, yüksek güven |

- `edition` registry'de kart seviyesinde saklanır (kullanıcı planından bağımsız alan).
- Plan düşerse edition etiketi kalır; Eksen 1 kuralları (verified revoke, limit) uygulanır.
- Business / Registry+ alanları (`offerings[]` vb.) E2-C'de tanımlanır.

---

## 1c. Core edition (v1.0) — resmi adlandırma

Tüm mevcut ve yeni varsayılan kartlar **Core edition** sayılır:

- `edition: "core"`, `schema_version: "1.0"`
- E2-A migration ile geriye uyumlu; ek veri dönüşümü gerekmez

### Holding / çok marka (Core'da)

Core tek monolit JSON değildir. Önerilen anlatım:

| Alan | Kullanım |
|------|----------|
| `description.summary` | Holding veya ana marka özeti |
| `products[]` | İş kolu / ürün hattı (id, name, url) |
| `actions[]`, `same_as[]` | İnsan ve agent link yüzeyi |

Çok seviyeli `offerings[]` hiyerarşisi → Business edition (v1.1, E2-C).

Detay: `docs/core-edition.md`

---

## 1d. Business edition (şema v1.1)

Business ve Registry+ kartları `schema_version: "1.1"` kullanır.

### Yeni alanlar (organization)

| Alan | Zorunlu | Açıklama |
|------|---------|----------|
| `content_locale` | ❌ | Kart içeriği dili: `en` \| `tr` |
| `offerings[]` | ❌ | İş kolu / ürün / hizmet hiyerarşisi |

### `offerings[]` yapısı

```json
{
  "id": "digital",
  "name": "Digital division",
  "kind": "line",
  "description": "Software and platforms",
  "url": "https://example.com/digital",
  "items": [
    {
      "id": "platform",
      "name": "Main platform",
      "kind": "product",
      "url": "https://example.com/app"
    }
  ]
}
```

| `kind` | Anlam |
|--------|--------|
| `line` | İş kolu / division |
| `product` | Ürün |
| `service` | Hizmet |

- Core kartlarda `products[]` kullanılır; Business'ta `offerings[]` tercih edilir (ikisi birlikte de olabilir).
- API, Core edition'da `offerings` ve `content_locale` gönderimini reddeder.

## 1e. Registry+ edition (şema v1.2)

Registry+ kartları `schema_version: "1.2"` kullanır. Business alanlarının üzerine kriptografik attestation eklenir.

| Alan | Zorunlu | Açıklama |
|------|---------|----------|
| `signatures.registry` | ❌ | Compact JWS — registry JSON attestation |

```json
{
  "signatures": {
    "registry": {
      "alg": "RS256",
      "kid": "key-2026",
      "jws": "eyJhbGciOiJSUzI1NiIs..."
    }
  }
}
```

| `alg` | Desteklenen |
|-------|-------------|
| `RS256` | ✅ |
| `ES256` | ✅ |
| `EdDSA` | ✅ |

- API, Core/Business edition'da `signatures` gönderimini reddeder.
- JWS **doğrulama** aracı E3-A'da; v1.2 şimdilik saklama + export.

---

## 2. Ortak Alanlar

| Alan | Zorunlu | Tip | Açıklama |
|------|---------|-----|----------|
| `schema_version` | ✅ | `"1.0"` \| `"1.1"` \| `"1.2"` | Şema sürümü (edition ile eşleşir) |
| `edition` | ✅ | enum | `core` \| `business` \| `registry_plus` (default: `core`) |
| `card_id` | ✅ | string | Canonical ID — genelde domain (org) veya benzersiz handle (person) |
| `type` | ✅ | enum | `organization` \| `person` |
| `handle` | ❌ | string | Registry kısa adı (`sinyalle`) |
| `verified` | ❌ | boolean | Doğrulama durumu (default: false) |
| `verification_method` | ⚠️ | string[] | `verified: true` ise zorunlu |
| `updated_at` | ✅ | ISO 8601 | Son güncelleme |
| `created_at` | ❌ | ISO 8601 | Oluşturulma |
| `human_url` | ❌ | URL | İnsan görünümü |
| `registry_url` | ❌ | URL | Registry canonical endpoint |
| `same_as` | ❌ | URL[] | Dış profil linkleri (LinkedIn, Wikipedia…) |

### verification_method değerleri

| Değer | Ne kanıtlar |
|-------|-------------|
| `dns` | Domain TXT kaydı |
| `email` | Kurumsal e-posta onayı |
| `tls` | Domain ↔ card_id eşleşmesi |
| `trade_registry` | Ticaret sicili (şirket) |
| `public_record` | Kamu kaydı (üniversite, belediye) |

---

## 3. Organization Card

### Zorunlu alanlar

- `schema_version`, `card_id`, `type`, `name.official`, `contact`, `updated_at`
- `contact`: en az biri — `email`, `website`, `phone`

### Alan referansı

| Alan | Zorunlu | Açıklama |
|------|---------|----------|
| `name.official` | ✅ | Resmî unvan |
| `name.short` | ❌ | Kısa ad (Sinyal 24) |
| `name.alternate` | ❌ | Alternatif isimler |
| `legal.country` | ❌ | ISO 3166-1 alpha-2 (`TR`) |
| `legal.type` | ❌ | `technology_company`, `smb`, `enterprise`, `public_institution`, `university`, `ngo` |
| `legal.tax_id` | ❌ | Vergi no |
| `legal.trade_registry` | ❌ | Ticaret sicil no |
| `description.tagline` | ❌ | Kısa slogan (max 280) |
| `description.summary` | ❌ | Uzun açıklama (max 2000) |
| `products[]` | ❌ | Ürün/hizmet listesi |
| `products[].id` | ✅* | URL-safe slug (*ürün varsa) |
| `products[].name` | ✅* | Ürün adı |
| `products[].description` | ❌ | Açıklama |
| `products[].url` | ❌ | Ürün sayfası |
| `apps.play_store` | ❌ | Google Play URL |
| `apps.app_store` | ❌ | App Store URL |
| `apps.web_app` | ❌ | Web uygulama URL |
| `actions[]` | ❌ | Agent/insan eylemleri |
| `logo_url` | ❌ | Logo |

### Örnek

`examples/organization.sinyalle.json`

---

## 4. Person Card

### Zorunlu alanlar

- `schema_version`, `card_id`, `type`, `name.full`, `contact`, `updated_at`
- `contact`: en az biri — `email`, `phone`

### Alan referansı

| Alan | Zorunlu | Açıklama |
|------|---------|----------|
| `name.full` | ✅ | Tam ad |
| `name.given` | ❌ | Ad |
| `name.family` | ❌ | Soyad |
| `name.title` | ❌ | Unvan |
| `organization_ref` | ❌ | Bağlı kurum `card_id` |
| `contact.whatsapp` | ❌ | WhatsApp numarası |
| `description.summary` | ❌ | Kısa bio |
| `actions[]` | ❌ | vCard, calendar, email… |
| `modes[]` | ❌ | Bağlam modları (post-MVP) |
| `photo_url` | ❌ | Profil fotoğrafı |

### Örnek

`examples/person.sample.json`

---

## 5. Actions

| type | `value` | `url` | Açıklama |
|------|---------|-------|----------|
| `call` | telefon | — | Arama |
| `email` | e-posta | — | E-posta |
| `link` | URL | — | Genel link |
| `whatsapp` | numara | — | WhatsApp |
| `app` | URL veya app id | — | Uygulama |
| `vcard` | opsiyonel | — | vCard export tetikler |
| `calendar` | — | ✅ zorunlu | Randevu linki |

---

## 6. schema.org Eşleme Haritası

SDK `toSchemaOrg(card)` bu dönüşümü uygular.

### Organization → schema.org/Organization

| Dijital Kart | schema.org | Not |
|--------------|------------|-----|
| `card_id` (domain) | `@id` | `https://{card_id}/#organization` |
| `type` | `@type` | `"Organization"` |
| `name.official` | `name` | |
| `name.short` | `alternateName` | |
| `name.alternate[]` | `alternateName` | birleştir |
| `description.tagline` + `summary` | `description` | birleştir |
| `contact.website` | `url` | |
| `contact.email` | `email` | |
| `contact.phone` | `telephone` | |
| `logo_url` | `logo` | ImageObject veya URL |
| `legal.country` + adres* | `address.addressCountry` | *adres Faz 2+ |
| `legal.type` | `additionalType` | |
| `products[]` | `makesOffer` / `hasOfferCatalog` | Faz 2+: OfferCatalog |
| `same_as[]` | `sameAs` | |
| `verified` | — | Dijital Kart özgün (schema.org'da yok) |

### Person → schema.org/Person

| Dijital Kart | schema.org | Not |
|--------------|------------|-----|
| `card_id` | `@id` | |
| `type` | `@type` | `"Person"` |
| `name.full` | `name` | |
| `name.title` | `jobTitle` | |
| `organization_ref` | `worksFor.@id` | linked org |
| `contact.email` | `email` | |
| `contact.phone` | `telephone` | |
| `photo_url` | `image` | |
| `human_url` | `url` | |
| `description.summary` | `description` | |
| `same_as[]` | `sameAs` | |

### Örnek schema.org çıktısı (Organization)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://sinyalle.com/#organization",
  "name": "Sinyalle",
  "alternateName": "Sinyal 24",
  "url": "https://sinyalle.com",
  "email": "info@sinyalle.com",
  "description": "Yeni nesil sosyal medya platformu — her fikir bir kelebek etkisi yaratabilir."
}
```

---

## 7. v1.0 Kapsam Dışı (sonraki sürümler)

| Alan / özellik | Planlanan sürüm |
|----------------|-----------------|
| `structure.*` (org şeması) | v1.1 — kamu/üniversite |
| `address` (tam adres) | v1.1 |
| `modes[]` (person) | v1.1 — MVP sonrası |
| `signatures` (JWS) | v1.2 — Registry+ edition (`signatures.registry` compact JWS) |
| `capabilities` (agent gateway) | v1.2+ — Eksen 3, reserved extension |
| `offerings[]` | v1.1 — Business edition |
| `locations[]` (şubeler) | v1.1 — KOBİ |
| `opening_hours` | v1.1 — KOBİ |

---

## 8. Doğrulama

Şema dosyası: `v1.0.schema.json`

Örnekleri doğrulamak için herhangi bir JSON Schema 2020-12 uyumlu validator kullanılabilir.

---

## 9. Referanslar

- [schema.org Organization](https://schema.org/Organization)
- [schema.org Person](https://schema.org/Person)
- [Google Organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization)
- `kesif-stratejisi.md` — keşif ve endpoint formatı
- `digital.md` §6 — orijinal taslak örnekler
