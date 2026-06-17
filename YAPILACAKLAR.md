# YAPILACAKLAR

> EIL Card — öncelikli iş listesi  
> Son güncelleme: 2026-06-17

---

## Kısa vade — Agent keşif yüzeyi

Entegrasyon rehberi (`/docs/agents`) — **yayında** (kısa vade maddeleri tamamlandı).

- [x] **eilcard.com kök `llms.txt`** — Registry’nin kendi agent keşif dosyası (`/llms.txt` route); resolve, well-known, docs ve pilot örnek linkleri.
- [x] **`/docs/agents` sayfası** — OpenAI Actions, Anthropic tool use, Gemini function calling için copy-paste şablonları; curl + `@digitalcard/sdk` örnekleri.
- [x] **Dashboard: `llms.txt` patch bloğu** — Domain’e eklenecek EIL bölümü (resolve, well-known, agent-card); Sinyalle pilotu için indirilebilir / kopyalanabilir snippet.

---

## Orta vade — Integration surface (Gemini önerileri)

Odak: **AI ekosistemine entegre edilebilirlik ve adaptasyon hızı.**

### 1. AI framework entegrasyonları (Tool / Plugin)

- [ ] **LangChain `EILResolveTool`** — Hazır tool sınıfı; agent akışında web aramasından önce `domain` / `handle` ile resolve.
- [ ] **LlamaIndex `EILReader` (Data Connector)** — HTML scrape yerine resolve + well-known’dan temiz kurumsal JSON; RAG pipeline’a doğrudan besleme.
- [ ] **MCP sunucusu** — `resolve_domain`, `get_card_by_handle` araçları (`kesif-stratejisi.md` Faz 3+ ile hizalı).

### 2. LLM sistem komutları ve Function Calling

- [ ] **OpenAPI 3.x spec** — `v1/resolve`, `v1/cards/{handle}`, `v1/well-known`; LLM’lerin zero-shot tool seçimi için açıklayıcı `description` alanları.
- [ ] **Standart system prompt şablonu** — “Kurumsal kimlik / iletişim / resmi ürünler için HTML kazımadan önce EIL katmanını kontrol et” (OpenAI, Anthropic, Google için varyantlar).
- [ ] **JSON Schema → tool definition export** — Function calling şemalarının otomatik üretimi (TS + Python örnekleri).

### 3. Güven katmanı (kriptografik doğrulama)

- [ ] **JWS imza alanı** — Kart JSON’unda `signature` / `jws`; registry authoritative imza; agent tarafında doğrulama SDK’sı.
- [ ] **DNSSEC dokümantasyonu** — `_digital-card` TXT pointer güveni için rehber (zorunluluk değil, enterprise opsiyon).
- [ ] **Proxy vs native well-known güven modeli** — Registry proxy (Sinyalle modeli) ile self-host arasında trust sinyalleri dokümante edilsin.

### 4. Geriye dönük uyumluluk (Bridge)

- [ ] **Schema.org bridge** — EIL yoksa `resolve` fallback: sayfa HTML’inden `Organization` / `LocalBusiness` JSON-LD okuyup EIL formatına dönüştürme (`toSchemaOrg` ters yön).
- [ ] **Bridge response meta** — `meta.source: "schema.org-inferred"`, `verified: false` — agent’ın güven seviyesini ayırt etmesi.

### 5. Adoption araçları (özet yol haritası)

| Araç | Durum | Yapılacak |
|------|--------|-----------|
| **Universal NPM SDK** | Kısmen var (`@digitalcard/sdk`) | Python paketi (`eilcard` / `digitalcard`), publish ve docs |
| **EIL CLI** | Yok | `eil-card init`, `verify`, `export well-known` |
| **Playground** | Yok | Tarayıcıda domain → “ajanlar sitemi nasıl görür?” simülatörü |
| **Entegrasyon rehberi** | Yayında | `/docs/agents` |

---

## Uzun vade — Standart ve ekosistem

- [ ] IANA `/.well-known/digital-card` kaydı
- [ ] Federated registry / mesh değerlendirmesi
- [ ] Büyük AI sağlayıcılarına resmi entegrasyon başvurusu (OpenAPI + pilot metriklerle)

---

## Mevcut (referans — tekrar yapılmayacak)

- Registry API: `resolve`, `cards/{handle}`, `well-known` mirror
- TypeScript SDK: `DigitalCard.resolve`, well-known fallback, `toSchemaOrg`, `toLlmsTxtSection`
- Dashboard keşif paneli: proxy snippet, well-known check, agent-card, llms.txt indirme
- Sinyalle pilot: nginx proxy, domain well-known **ok**

---

## İlgili belgeler

- `kesif-stratejisi.md` — keşif stratejisi ve MVP kararları
- `packages/sdk/SDK.md` — SDK spesifikasyonu
- `schema/SCHEMA.md` — kart JSON şeması
