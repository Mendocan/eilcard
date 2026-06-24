# Core edition (v1.0)

> Faz 4 E2-B — mevcut kartların resmi adlandırılması  
> Son güncelleme: Haziran 2026

---

## Özet

**Core edition** = şema `1.0` + `edition: "core"`. Bugün registry'deki tüm canlı kartlar bu katmandadır.

| Alan | Değer |
|------|-------|
| `edition` | `core` |
| `schema_version` | `1.0` |
| Min. plan | Free (verified rozeti için Verified+) |
| Durum | Canlı — geriye uyumlu |

E2-A migration ile mevcut kartlar otomatik `core` + `1.0` aldı. Yeni kartlar da varsayılan olarak Core oluşturulur.

---

## Core ne içerir?

Tek marka, KOBİ veya pilot müşteri için yeterli alan seti:

- **Kimlik:** `name`, `contact`, `legal` (opsiyonel)
- **Anlatım:** `description.tagline`, `description.summary`
- **Katalog:** `products[]` — slug, ad, açıklama, URL
- **Keşif:** `actions[]`, `same_as[]`, `apps`
- **Güven:** `verified`, `verification_method` (Eksen 1 — abonelik)

Business edition (`offerings[]`, iş kolu hiyerarşisi) E2-C'de gelir. Core'da `products[]` holding anlatımı için kullanılır.

---

## Holding anlatımı (Core pattern)

Holding veya çok iş kolu olan kurumlar Core'da **tek dev JSON** yazmak zorunda değil. Önerilen yapı:

```
description.summary  → holding / ana marka özeti (1 paragraf)
products[]           → iş kolu veya ürün hattı (her biri kendi URL'si)
actions[]            → insan yüzü linkleri (web, iletişim)
same_as[]            → resmi sosyal / Wikipedia profilleri
```

**Örnek:** Sinyal 24 (Sinyalle) — sosyal platform markası; `products[]` içinde uygulama ve hizmet satırları, `summary` marka hikayesi.

**Yapma:** Tüm iştirakleri tek `products[]` listesine sıkıştırmak yerine Business edition'a geçiş planla (`offerings[]` hiyerarşisi, E2-C).

---

## Canlı referanslar (production)

| Rol | Handle | Domain | Edition | Plan (Eksen 1) | URL |
|-----|--------|--------|---------|----------------|-----|
| **Pilot müşteri** | `sinyal24` | sinyalle.com | Core | Verified | [kart](https://eilcard.com/kart/sinyal24) · [resolve](https://eilcard.com/api/v1/resolve?domain=sinyalle.com) |
| **Registry operatörü** | `eilcard` | eilcard.com | Core | Pro | [kart](https://eilcard.com/kart/eilcard) · [resolve](https://eilcard.com/api/v1/resolve?domain=eilcard.com) |
| **Demo (registry dışı)** | — | — | — | — | [/example](https://eilcard.com/example) |

- **Edition** = kart zenginliği (Eksen 2)
- **Plan** = abonelik, limit, `verified` otoritesi (Eksen 1)
- Pilot ve operatör kartları ikisi de **Core + DNS verified**; plan farkı kota ve org limitlerini belirler.

---

## Agent keşfi

Agent'lar resolve çıktısında şunları görür:

```json
{
  "edition": "core",
  "schema_version": "1.0",
  "verified": true,
  ...
}
```

`edition` ve `schema_version` birlikte okunmalı; Core kartlarda `1.1` alanları (`offerings[]` vb.) yoktur.

---

## İlgili belgeler

- `schema/SCHEMA.md` — şema alanları
- `YAPILACAKLAR.md` — Faz 4 E2-C (Business edition)
- `docs/strateji-agent-cagi.md` — üç eksen modeli
