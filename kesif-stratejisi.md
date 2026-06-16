# Dijital Kart — Keşif Stratejisi (Faz A3)

> Agent'ların Dijital Kart'ı nasıl bulacağı — teknik karar belgesi  
> Araştırma dönemi: 2025–2026  
> Son güncelleme: Haziran 2026  
> İlgili dosyalar: `digital.md`, `faz.md`, `saha-analizi.md`, `pilot-sektor.md`

---

## 1. Karar Özeti

| Soru | Karar |
|------|-------|
| **Strateji** | **Hibrit** — merkezi registry + domain `.well-known` |
| **Birincil keşif (SDK)** | Registry API → `resolve(domain)` |
| **İkincil keşif (fallback)** | `https://{domain}/.well-known/digital-card` |
| **Handle keşfi** | Registry API → `GET /v1/cards/{handle}` |
| **Well-known path** | `/.well-known/digital-card` (uzantısız JSON) |
| **IANA kaydı** | MVP sonrası (spec v1.0 sabitlendikten sonra) |

**Tek cümle:** Registry hız ve handle çözümü sağlar; `.well-known` domain sahipliğini kanıtlar ve registry olmadan da çalışır — ikisi birlikte.

---

## 2. Seçeneklerin Değerlendirmesi

### 2.1 Yalnızca merkezi registry

```
Agent → GET api.digitalcard.tr/v1/resolve?domain=sinyalle.com → JSON
```

| Güçlü | Zayıf |
|-------|-------|
| Tek API, basit SDK | Tek başarısızlık noktası (SPOF) |
| Handle + domain çözümü | Platform bağımlılığı |
| Analytics, doğrulama, versiyon | "Gerçek canonical kaynak biz miyiz?" sorusu |
| Hızlı MVP | Registry olmadan kart yok |

**2025–2026 bağlam:** AWS, Microsoft, Google kendi agent registry'lerini çıkardı; cross-cloud kimlik registry'de kalınca kayboluyor ([DEV Community, 2026](https://dev.to/moltycel/registry-sprawl-is-the-new-agent-sprawl-4jfa)). Merkezi registry iş modeli için gerekli ama tek başına yeterli değil.

**Puan:** 3/5 — MVP için iyi, uzun vadede kırılgan.

---

### 2.2 Yalnızca `/.well-known/digital-card`

```
Agent → GET https://sinyalle.com/.well-known/digital-card → JSON
```

| Güçlü | Zayıf |
|-------|-------|
| RFC 8615 standart desen ([draft 2026](https://datatracker.ietf.org/doc/draft-nottingham-rfc8615bis/)) | Handle çözümü yok (`sinyalle` → domain?) |
| Domain = canonical kaynak (A2A ile aynı mantık) | DNS/domain olmayan entity'ler dışarıda |
| Registry maliyeti yok | Arama, indeks, analytics yok |
| Platform bağımsız | Her agent domain bilmeden bulamaz |

**2025–2026 bağlam:** A2A `agent-card.json` IANA'ya kayıtlı de facto standart ([Zylos Research, Mart 2026](https://zylos.ai/research/2026-03-07-ai-agent-identity-discovery-trust-frameworks/)). ANP protokolü de aktif (`.well-known`) + pasif (registry) hibrit öneriyor.

**Puan:** 4/5 — standart uyumu mükemmel; keşif ve iş modeli zayıf.

---

### 2.3 Hibrit (registry + well-known) ✅

```
SDK resolve({ domain: 'sinyalle.com' })
  1. GET https://api.digitalcard.tr/v1/resolve?domain=sinyalle.com
  2. (fallback) GET https://sinyalle.com/.well-known/digital-card
  3. (opsiyonel) DNS TXT _digital-card.sinyalle.com
```

| Güçlü | Zayıf |
|-------|-------|
| Registry: hız, handle, analytics | İki yüzey senkron tutulmalı |
| Well-known: domain kanıtı, standart uyum | Biraz daha karmaşık SDK |
| Registry down → domain fallback | MVP'de iki endpoint inşa |
| İş modeli + açık standart birlikte | — |

**2025–2026 bağlam:** Akademik ve endüstri konsensüsü — kimlik çözümlemesi ile capability metadata'yı ayır; federated/hybrid modeller öneriliyor ([arXiv 2508.03095](https://arxiv.org/html/2508.03095)). Rover AI çoklu sinyal yaklaşımı: `agent-card.json` + `llms.txt` + link header ([Retriever AI, 2026](https://www.rtrvr.ai/blog/agent-web-protocol-stack)).

**Puan:** 5/5 — seçilen strateji.

---

## 3. Karşılaştırma Matrisi

| Kriter | Yalnızca registry | Yalnızca well-known | **Hibrit** |
|--------|:-----------------:|:-------------------:|:----------:|
| Standart uyumu (RFC 8615) | ❌ | ✅ | ✅ |
| Handle çözümü | ✅ | ❌ | ✅ |
| Domain canonical kanıtı | ❌ | ✅ | ✅ |
| Registry-down dayanıklılık | ❌ | ✅ | ✅ |
| Analytics / kota | ✅ | ❌ | ✅ |
| MVP karmaşıklığı | Düşük | Düşük | Orta |
| İş modeli uyumu | ✅ | ❌ | ✅ |
| A2A ekosistem uyumu | Kısmen | ✅ | ✅ |
| **TOPLAM** | 3 | 4 | **5** |

---

## 4. Teknik Tasarım

### 4.1 Keşif katmanları

```
┌─────────────────────────────────────────────────────────────┐
│  KATMAN 1 — SDK / Registry (birincil)                       │
│  resolve(domain) | resolve(handle)                          │
│  → Hızlı, indeksli, analytics, doğrulama durumu             │
└───────────────────────────┬─────────────────────────────────┘
                            │ fallback
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  KATMAN 2 — Well-Known URI (ikincil)                        │
│  GET https://{domain}/.well-known/digital-card              │
│  → Domain sahipliği, registry bağımsız, standart uyum       │
└───────────────────────────┬─────────────────────────────────┘
                            │ opsiyonel
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  KATMAN 3 — DNS TXT (doğrulama + keşif ipucu)               │
│  _digital-card.{domain} TXT "v=1;registry=digitalcard.tr"   │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Well-known endpoint

| Alan | Değer |
|------|-------|
| **Path** | `/.well-known/digital-card` |
| **Method** | `GET` |
| **Content-Type** | `application/json` |
| **Cache-Control** | `public, max-age=3600` (ETag önerilir) |
| **Body** | Organization Card veya Person Card JSON (şema v1.0) |

**Örnek istek:**
```http
GET /.well-known/digital-card HTTP/1.1
Host: sinyalle.com
Accept: application/json
```

**Örnek yanıt (kısaltılmış):**
```json
{
  "schema_version": "1.0",
  "card_id": "sinyalle.com",
  "type": "organization",
  "verified": true,
  "verification_method": ["dns", "email"],
  "name": { "official": "Sinyalle", "short": "Sinyal 24" },
  "registry_url": "https://api.digitalcard.tr/v1/cards/sinyalle",
  "updated_at": "2026-06-16T00:00:00Z"
}
```

> `registry_url` alanı: well-known dosyasını okuyan agent'ın registry'deki canonical kayda yönlendirilmesi.

### 4.3 Registry API

| Endpoint | Açıklama |
|----------|----------|
| `GET /v1/resolve?domain={domain}` | Domain → kart JSON |
| `GET /v1/cards/{handle}` | Handle → kart JSON |
| `HEAD /v1/resolve?domain={domain}` | Varlık kontrolü (SDK prefetch) |

**Örnek:**
```http
GET /v1/resolve?domain=sinyalle.com HTTP/1.1
Host: api.digitalcard.tr
Accept: application/json
```

**Yanıt:** Tam kart JSON + metadata:
```json
{
  "card": { "...": "..." },
  "meta": {
    "source": "registry",
    "well_known_url": "https://sinyalle.com/.well-known/digital-card",
    "resolved_at": "2026-06-16T12:00:00Z"
  }
}
```

### 4.4 Handle vs domain

| Kavram | Örnek | Çözüm |
|--------|-------|-------|
| **Domain** | `sinyalle.com` | Registry resolve veya well-known |
| **Handle** | `sinyalle` | Yalnızca registry (`/v1/cards/sinyalle`) |
| **İnsan URL** | `card.digitalcard.tr/sinyalle` | Redirect → registry veya mini UI |

Handle, domain sahibi olmayan kurumlar için (gelecek); MVP'de domain birincil.

### 4.5 DNS TXT (doğrulama + keşif)

Doğrulama sırasında yayınlanır; agent'lar opsiyonel keşif ipucu olarak okuyabilir:

```
_digital-card.sinyalle.com.  TXT  "v=1;card_id=sinyalle.com;registry=api.digitalcard.tr"
```

| Amaç | Açıklama |
|------|----------|
| **Doğrulama** | Domain sahipliği kanıtı |
| **Keşif ipucu** | Registry URL'si |
| **Fallback değil** | TXT parse maliyeti yüksek; birincil keşif değil |

### 4.6 HTML Link header (opsiyonel, MVP+)

A2A best practice ([aigrowthagent.co, 2026](https://aigrowthagent.co/articles/agent-cards-best-practices/)):

```http
Link: </.well-known/digital-card>; rel="digital-card"
```

Ana sayfa HTML `<head>` içinde agent'ların well-known'u keşfetmesini kolaylaştırır.

### 4.7 SDK fallback zinciri

```typescript
async function resolve(input: { domain?: string; handle?: string }): Promise<Card> {
  // 1. Handle → yalnızca registry
  if (input.handle) {
    return await registry.getCard(input.handle);
  }

  // 2. Domain → registry (birincil)
  if (input.domain) {
    try {
      return await registry.resolve(input.domain);
    } catch (e) {
      if (!isNotFound(e)) throw e;
    }

    // 3. Fallback → well-known
    const wellKnown = await fetchWellKnown(input.domain);
    if (wellKnown) return wellKnown;
  }

  throw new CardNotFoundError(input);
}
```

**Öncelik gerekçesi:**
- Registry: hızlı, handle, analytics, doğrulama metadata
- Well-known: registry erişilemezse veya domain-only senaryoda çalışır

---

## 5. Senkronizasyon Kuralları

Hibrit modelde iki yüzey tutarlı olmalı:

| Olay | Registry | Well-known |
|------|----------|------------|
| Kart oluşturma | ✅ Yaz | ⚠️ DNS doğrulama sonrası yayınla |
| Kart güncelleme | ✅ Anında | ✅ Registry push veya panel tetikler |
| Doğrulama | ✅ `verified: true` | ✅ Aynı flag |
| Kart silme | ✅ Soft delete | ✅ 404 veya redirect |

**MVP kuralı:** Panel güncellemesi → registry önce → doğrulanmış domain'lerde well-known otomatik güncelle (proxy veya static deploy).

**Çakışma çözümü:** Registry **authoritative** (birincil kaynak); well-known registry ile senkronize edilir. SDK her iki kaynaktan okursa `updated_at` karşılaştırır; registry öncelikli.

---

## 6. A2A ve Diğer Standartlarla İlişki

| Standart | Path | Dijital Kart ilişkisi |
|----------|------|----------------------|
| **A2A Agent Card** | `/.well-known/agent-card.json` | Farklı amaç — agent yetenekleri; birlikte yaşar |
| **llms.txt** | `/llms.txt` | Tamamlayıcı — site indeksi; `toLlmsTxt()` köprüsü |
| **JSON-LD** | Sayfa `<head>` | Export hedefi — `toSchemaOrg()` |
| **MCP** | Sunucu tool | `resolve_organization` tool olarak sunulabilir |
| **Dijital Kart** | `/.well-known/digital-card` | Org/person canonical profil |

**Sinyalle örneği — çoklu sinyal (gelecek):**
```
sinyalle.com/
├── .well-known/digital-card    ← kurum kimliği (Dijital Kart)
├── .well-known/agent-card.json ← (ileride) Sinyalle agent yetenekleri
├── llms.txt                    ← site özeti
└── (HTML) JSON-LD Organization ← sayfa metadata
```

---

## 7. MVP Kapsamı vs Sonraya

### MVP (Faz D)

- [x] Registry: `GET /v1/resolve?domain=` — **karar**
- [x] Registry: `GET /v1/cards/{handle}` — **karar**
- [ ] Well-known: panel tarafından host edilen proxy URL (`card.digitalcard.tr/.well-known/...`) veya kullanıcı DNS yönlendirmesi
- [ ] DNS TXT doğrulama
- [ ] SDK fallback zinciri (registry → well-known)
- [ ] `Link` header — sonraya

### Faz 3+

- [ ] Kullanıcı domain'inde native `/.well-known/digital-card` (CNAME veya self-host rehberi)
- [ ] IANA well-known URI kaydı (`digital-card`)
- [ ] JWS imza (A2A v1.0 deseni)
- [ ] Federated registry / mesh (DUADP tarzı)
- [ ] MCP `resolve` tool

---

## 8. Sinyalle Pilot Akışı

```
1. Sinyalle panelden Organization Card oluşturur
2. DNS TXT doğrulama: _digital-card.sinyalle.com
3. Registry'ye kayıt: handle=sinyalle, domain=sinyalle.com
4. Well-known yayın:
   - MVP: api.digitalcard.tr proxy VEYA sinyalle.com'a CNAME
   - Faz 3: sinyalle.com/.well-known/digital-card (native)
5. SDK test:
   DigitalCard.resolve({ domain: 'sinyalle.com' })
6. Başarı: agent Story 24, Reels 24... bilgisini JSON'dan alır
```

---

## 9. Açık Sorular (Faz A3 sonrası)

- [ ] Well-known MVP'de proxy mi, self-host mu? (Pilot için proxy önerilir)
- [ ] `digital-card` vs `digital-card.json` uzantısı — A2A `agent-card.json` ile tutarlılık
- [ ] IANA kayıt zamanlaması
- [ ] Handle namespace kuralları (`sinyalle` rezervasyon, marka ihlali)

---

## 10. Kaynaklar (2025–2026)

- [RFC 8615 bis draft (Şubat 2026)](https://datatracker.ietf.org/doc/draft-nottingham-rfc8615bis/)
- [A2A Agent Discovery](https://a2a-protocol.org/v0.3.0/topics/agent-discovery/)
- [Zylos: AI Agent Identity & Discovery (Mart 2026)](https://zylos.ai/research/2026-03-07-ai-agent-identity-discovery-trust-frameworks/)
- [arXiv: Agent Registry Evolution (2025)](https://arxiv.org/html/2508.03095)
- [ANP: Active + Passive Discovery](https://github.com/agent-network-protocol/AgentNetworkProtocol/blob/main/08-ANP-Agent-Discovery-Protocol-Specification.md)
- [Retriever AI: Agent-Web Protocol Stack](https://www.rtrvr.ai/blog/agent-web-protocol-stack)
- [Registry Sprawl (2026)](https://dev.to/moltycel/registry-sprawl-is-the-new-agent-sprawl-4jfa)
- [Agent Cards Best Practices](https://aigrowthagent.co/articles/agent-cards-best-practices/)

---

*Bu belge Faz A3 çıktısıdır. Faz A tamamlandı — sonraki: Faz B1 (JSON şema v1.0).*
