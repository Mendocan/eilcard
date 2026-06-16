# @digitalcard/sdk — v0.1 Spesifikasyonu (Faz B3)

> TypeScript SDK tasarım belgesi  
> Paket: `packages/sdk`  
> Şema: `schema/v1.0.schema.json`  
> Keşif: `kesif-stratejisi.md`  
> Son güncelleme: Haziran 2026

---

## 1. Özet

| Alan | Değer |
|------|-------|
| **Paket adı** | `@digitalcard/sdk` |
| **Sürüm** | `0.1.0` |
| **Runtime** | Node.js 20+, Edge (fetch), browser |
| **Bağımlılık** | Sıfır runtime dependency |
| **Ana API** | `DigitalCard.resolve({ domain \| handle })` |

---

## 2. Kurulum (planlanan)

```bash
npm install @digitalcard/sdk
```

```typescript
import { DigitalCard } from '@digitalcard/sdk';
```

---

## 3. Public API

### 3.1 `DigitalCard.resolve(input, options?)`

```typescript
const result = await DigitalCard.resolve({
  domain: 'sinyalle.com',
});

// veya
const result = await DigitalCard.resolve({
  handle: 'sinyalle',
});
```

**Dönüş:** `ResolveResult`

```typescript
interface ResolveResult {
  card: DigitalCard;      // OrganizationCard | PersonCard
  meta: ResolveMeta;      // source, urls, resolved_at
}
```

### 3.2 `DigitalCardClient` (instance API)

Çoklu istek, özel config veya test mock için:

```typescript
import { DigitalCardClient } from '@digitalcard/sdk';

const client = new DigitalCardClient({
  registryBaseUrl: 'https://api.digitalcard.tr',
  apiKey: process.env.DIGITALCARD_API_KEY,
  timeout: 10_000,
});

const { card, meta } = await client.resolve({ domain: 'sinyalle.com' });
```

### 3.3 Köprü fonksiyonları

| Fonksiyon | Girdi | Çıktı | Açıklama |
|-----------|-------|-------|----------|
| `toSchemaOrg(card)` | `DigitalCard` | JSON-LD object | schema.org Organization/Person |
| `toVCard(card)` | `PersonCard` | string | vCard 4.0 metni |
| `toLlmsTxtSection(card)` | `DigitalCard` | string | llms.txt Markdown bölümü |

```typescript
import { DigitalCard, toSchemaOrg, toLlmsTxtSection } from '@digitalcard/sdk';

const { card } = await DigitalCard.resolve({ domain: 'sinyalle.com' });
const jsonLd = toSchemaOrg(card);
const llmsSection = toLlmsTxtSection(card);
```

---

## 4. Keşif / Fallback Zinciri

```
resolve({ handle })
  └─► GET {registry}/v1/cards/{handle}
        └─► 200 → card + meta.source = "registry"
        └─► 404 → CardNotFoundError

resolve({ domain })
  └─► GET {registry}/v1/resolve?domain={domain}
        ├─► 200 → card + meta.source = "registry"
        └─► 404 → fallback
              └─► GET https://{domain}/.well-known/digital-card
                    ├─► 200 → card + meta.source = "well-known"
                    └─► fail → CardNotFoundError
```

**Kurallar:**
- `domain` ve `handle` birlikte verilemez → `InvalidResolveInputError`
- Registry 5xx → `RegistryError` (fallback yok)
- Registry timeout → `RegistryError`
- Well-known fallback `skipWellKnownFallback: true` ile kapatılabilir

**Domain normalizasyonu:**
- `Sinyalle.com` → `sinyalle.com`
- `https://sinyalle.com/path` → `sinyalle.com`

---

## 5. Yapılandırma

```typescript
interface DigitalCardClientOptions {
  registryBaseUrl?: string;   // default: https://api.digitalcard.tr
  apiKey?: string;            // Bearer token — yüksek kota
  timeout?: number;           // default: 10000 ms
  skipWellKnownFallback?: boolean;
  fetch?: typeof fetch;       // test / edge override
}
```

---

## 6. Hata Sınıfları

| Sınıf | Ne zaman |
|-------|----------|
| `InvalidResolveInputError` | domain ve handle boş veya ikisi birden |
| `CardNotFoundError` | Tüm keşif yolları başarısız |
| `RegistryError` | Registry 5xx veya ağ hatası |
| `SchemaValidationError` | Köprü fonksiyonu uyumsuz kart tipi |
| `DigitalCardError` | Taban sınıf |

```typescript
import { CardNotFoundError } from '@digitalcard/sdk';

try {
  await DigitalCard.resolve({ domain: 'unknown.example' });
} catch (e) {
  if (e instanceof CardNotFoundError) {
    console.log(e.input); // { domain: 'unknown.example' }
  }
}
```

---

## 7. Tip Sistemi

Kaynak: `src/types.ts` — `schema/v1.0.schema.json` ile hizalı.

```typescript
type DigitalCard = OrganizationCard | PersonCard;

// Discriminated union — type guard
if (card.type === 'organization') {
  card.name.official;
  card.products;
}
```

Exported types: `OrganizationCard`, `PersonCard`, `Product`, `CardAction`, `ResolveResult`, …

---

## 8. `toSchemaOrg()` Eşlemesi

### Organization

| Dijital Kart | schema.org |
|--------------|------------|
| `name.official` | `name` |
| `name.short` | `alternateName` |
| `contact.website` | `url` |
| `contact.email` | `email` |
| `contact.phone` | `telephone` |
| `description.*` | `description` |
| `logo_url` | `logo` |
| `same_as[]` | `sameAs` |

### Person

| Dijital Kart | schema.org |
|--------------|------------|
| `name.full` | `name` |
| `name.title` | `jobTitle` |
| `organization_ref` | `worksFor.@id` |
| `photo_url` | `image` |

---

## 9. Kullanım Örnekleri

### Agent — kurum bilgisi

```typescript
const { card } = await DigitalCard.resolve({ domain: 'sinyalle.com' });

if (card.type === 'organization') {
  console.log(card.name.official);       // Sinyalle
  console.log(card.description?.tagline);
  console.log(card.products?.map(p => p.name));
}
```

### Chatbot — doğrulanmış iletişim

```typescript
const { card, meta } = await DigitalCard.resolve({ handle: 'sinyalle' });

if (card.verified) {
  const emailAction = card.actions?.find(a => a.type === 'email');
  // Güvenilir iletişim kanalı
}
```

### SEO köprüsü

```typescript
const { card } = await DigitalCard.resolve({ domain: 'sinyalle.com' });
const jsonLd = toSchemaOrg(card);
// <script type="application/ld+json">...</script>
```

---

## 10. v0.1 Kapsamı

### Dahil

- [x] `resolve({ domain })` ve `resolve({ handle })`
- [x] Registry → well-known fallback
- [x] TypeScript tip tanımları
- [x] `toSchemaOrg()`, `toVCard()`, `toLlmsTxtSection()`
- [x] Hata sınıfları
- [x] `fetch` inject (test)

### Sonraya (v0.2+)

- [ ] Response şema validasyonu (Zod)
- [ ] Retry + exponential backoff
- [ ] ETag / If-None-Match cache
- [ ] `verify(card)` — DNS/TLS doğrulama client-side
- [ ] MCP tool wrapper
- [ ] Python SDK parity

---

## 11. Test Stratejisi (Faz D)

| Test | Yöntem |
|------|--------|
| Unit | Mock `fetch` — registry 200/404, well-known fallback |
| Types | `tsc --noEmit` |
| Integration | Sinyalle pilot registry (staging) |
| Bridges | Snapshot — `toSchemaOrg`, `toVCard` |

---

## 12. Dosya Yapısı

```
packages/sdk/
├── SDK.md           ← bu belge
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts     ← public exports
    ├── types.ts     ← şema tipleri
    ├── errors.ts
    ├── client.ts    ← resolve + fallback
    └── bridges.ts   ← toSchemaOrg, toVCard, toLlmsTxt
```

---

## 13. Sonraki Adım

**Faz D** — MVP geliştirme: `apps/web` registry API + SDK entegrasyon testi

---

*Faz B3 çıktısı. İmplementasyon iskeleti `packages/sdk/src/` altında; build Faz D'de.*
