# YAPILACAKLAR

> EIL Card — öncelikli iş listesi  
> Son güncelleme: 2026-06-19

---

## Kısa vade — Agent keşif yüzeyi

Entegrasyon rehberi (`/docs/agents`) — **yayında** (kısa vade maddeleri tamamlandı).

- [x] **eilcard.com kök `llms.txt`** — Registry'nin kendi agent keşif dosyası (`/llms.txt` route); resolve, well-known, docs ve pilot örnek linkleri.
- [x] **`/docs/agents` sayfası** — OpenAI Actions, Anthropic tool use, Gemini function calling için copy-paste şablonları; curl + `@digitalcard/sdk` örnekleri.
- [x] **Dashboard: `llms.txt` patch bloğu** — Domain'e eklenecek EIL bölümü (resolve, well-known, agent-card); Sinyalle pilotu için indirilebilir / kopyalanabilir snippet.

---

## Kısa vade — Ticari hazırlık (Polar + uyumluluk)

Ödeme, iade ve chargeback riskini düşürmek için site ve operasyon tarafı tamamlanmalı.

### Yasal ve şeffaflık sayfaları

- [ ] **`/pricing`** — Free / Verified / Pro limit tablosu (`tier-limits.ts` ile senkron)
- [ ] **`/legal/terms`** — hizmet koşulları, abonelik, hesap kullanımı (EN; checkout için)
- [ ] **`/legal/privacy`** — toplanan veriler, saklama, üçüncü taraflar
- [ ] **`/legal/refund`** — iade süresi, iptal, yenileme, destek kanalı
- [ ] **Footer linkleri** — Pricing, Terms, Privacy, Refunds
- [ ] **Kayıt onayı** — hesap oluştururken Terms/Privacy kabul metni

### Polar entegrasyonu

- [ ] Polar org + Verified/Pro ürünleri (USD)
- [ ] Checkout + customer portal linki
- [ ] Webhook → `user_plans.tier` + `polar_subscription_id`
- [ ] Dashboard “Upgrade” ve “Manage billing”
- [ ] Env: `POLAR_ACCESS_TOKEN`, webhook secret, product ID'leri
- [ ] Polar account review öncesi site + ürün açıklaması hazır

### Resmi iletişim kanalı (e-posta)

İki katman gerekir: **gelen kutusu** (insan) + **işlem postası** (uygulama API).

**Karar:** Gelen kutusu **Namecheap Private Email** ([namecheap.com/hosting/email](https://www.namecheap.com/hosting/email/)) — domain ve VPS zaten Namecheap'te; DNS çoğu durumda otomatik kurulur.

| Katman | Amaç | Sağlayıcı |
|--------|------|-----------|
| **Gelen kutusu** | support@, billing@, hello@ | **Namecheap Private Email** |
| **İşlem postası** | şifre sıfırlama, fatura bildirimi, sistem | **Resend** (`RESEND_API_KEY` hazır; ~3.000/ay ücretsiz) |

**Önerilen plan (EIL Card başlangıç):** **Starter** — 1 mailbox + **10 alias** (yıllık ~$14.88 yenileme; ilk yıl promosyonlu daha düşük). Tek mailbox (`support@`) + alias'lar: `billing@`, `hello@`, `noreply@` yönlendirmesi. İleride moderatör için **Pro** (3 mailbox) veya **Ultimate** (5 mailbox).

**Önerilen adresler:** `support@eilcard.com` (ana), `billing@eilcard.com` (alias), `hello@eilcard.com` (alias)

**Kurulum sırası (Namecheap):**
1. Namecheap → Domain List → `eilcard.com` → **Private Email** ekle (30 gün deneme; domain Namecheap'teyse MX genelde otomatik)
2. Webmail'de mailbox + alias'ları tanımla
3. SPF/DKIM — Namecheap panelinde Private Email için kayıtları doğrula
4. **Resend** — aynı domain için ayrı SPF/DKIM (işlem postası; gelen kutusu ile çakışmaması için Resend dokümantasyonundaki birleşik SPF)
5. Production `.env`: `SUPPORT_EMAIL=support@eilcard.com`, `BILLING_EMAIL=billing@eilcard.com`, `RESEND_API_KEY`
6. About, footer, Terms/Refund sayfalarında support adresi
7. Polar checkout + fatura bildirimlerinde `billing@`

**Maliyet (başlangıç):** Private Email Starter ~**$1–1.25/ay** (yıllık faturalama) + Resend free tier ≈ **~$15/yıl** toplam.

- [x] **Admin → Ayarlar** — iletişim env durumu, güvenlik notu, ekip rolleri yol haritası
- [ ] **Namecheap Private Email** — Starter + alias'lar (`support@`, `billing@`, `hello@`)
- [ ] Resend domain doğrulama + şifre sıfırlama / bildirim şablonları
- [ ] `SUPPORT_EMAIL` / `BILLING_EMAIL` production `.env` ve About sayfası

### Admin panel iyileştirmeleri

- [x] **Doğrulama sayacı düzeltmesi** — yalnızca gerçekten bekleyen (kart henüz doğrulanmamış) DNS işlemleri; eski `pending` satırları temizlenir
- [x] **Çift dil/çıkış butonu** — mobil üst / masaüstü sidebar tek konum
- [x] **Ayarlar sayfası** (`/admin/settings`) — iletişim, güvenlik, ekip planı
- [ ] **Rol tabanlı admin** — editör, moderatör, admin; davet + DB hesapları
- [ ] **Admin şifre değiştirme UI** — `ADMIN_PASSWORD` yerine DB veya güvenli rotasyon akışı

---

## Orta vade — Integration surface

Odak: **AI ekosistemine entegre edilebilirlik ve adaptasyon hızı.**

### 1. AI framework entegrasyonları (Tool / Plugin)

- [x] **LangChain `EILResolveTool`** — `packages/sdk/examples/langchain-eil-resolve-tool.ts` + `/docs/agents`
- [x] **Python agent şablonları** — `packages/sdk/examples/python/` (resolve, `@tool`, agent loop) + `/docs/agents`
- [x] **Güvenlik sertleştirme** — rate limit (in-process), security headers (Caddy + Next.js), resolve kotası (plan bazlı), `security.txt`, panel public JSON uyarısı
- [ ] **LlamaIndex `EILReader` (Data Connector)** — HTML scrape yerine resolve + well-known'dan temiz kurumsal JSON; RAG pipeline'a doğrudan besleme.
- [ ] **MCP sunucusu** — `resolve_domain`, `get_card_by_handle` araçları (`kesif-stratejisi.md` Faz 3+ ile hizalı).

### 2. LLM sistem komutları ve Function Calling

- [x] **OpenAPI 3.x spec** — `public/openapi.yaml` → `/openapi.yaml`; `/docs` linki
- [x] **Standart system prompt şablonu** — `/docs/agents`'ta; "EIL'i HTML taramadan önce kontrol et" (OpenAI, Anthropic, Gemini varyantları).
- [x] **SDK agent tool** — `buildEILResolveToolDefinition`, `invokeEILResolve` (`@digitalcard/sdk`)
- [ ] **JSON Schema → tool definition export** — Function calling şemalarının otomatik üretimi (TS + Python örnekleri).

### 3. Güven katmanı (kriptografik doğrulama)

- [ ] **JWS imza alanı** — Kart JSON'unda `signature` / `jws`; registry authoritative imza; agent tarafında doğrulama SDK'sı.
- [ ] **DNSSEC dokümantasyonu** — `_digital-card` TXT pointer güveni için rehber (zorunluluk değil, enterprise opsiyon).
- [ ] **Proxy vs native well-known güven modeli** — Registry proxy (Sinyalle modeli) ile self-host arasında trust sinyalleri dokümante edilsin.

### 4. Geriye dönük uyumluluk (Bridge)

- [ ] **Schema.org bridge** — EIL yoksa `resolve` fallback: sayfa HTML'inden `Organization` / `LocalBusiness` JSON-LD okuyup EIL formatına dönüştürme (`toSchemaOrg` ters yön).
- [ ] **Bridge response meta** — `meta.source: "schema.org-inferred"`, `verified: false` — agent'ın güven seviyesini ayırt etmesi.

### 5. Adoption araçları (özet yol haritası)

| Araç | Durum | Yapılacak |
|------|--------|-----------|
| **Universal NPM SDK** | Kısmen var (`@digitalcard/sdk`) | Python paketi (`eilcard` / `digitalcard`), publish ve docs |
| **EIL CLI** | Yok | `eil-card init`, `verify`, `export well-known` |
| **Playground** | Yayında | `/playground` — domain/handle resolve simülatörü |
| **Entegrasyon rehberi** | Yayında | `/docs/agents` — Python + TS + LLM şablonları |
| **Whitepaper** | Yayında | `/insights/eil-whitepaper` — EN/TR v1.0 |

---

## Uzun vade — Standart ve ekosistem

### Ekip / Açık Kaynak hazırlığı

- [ ] **Branch protection rules** — Ekip büyüdüğünde veya açık kaynak katkılar başladığında `main` branch'i korumaya al. GitHub → Settings → Branch protection rules → Require PR + review zorunluluğu ekle.

- [ ] IANA `/.well-known/digital-card` kaydı
- [ ] Federated registry / mesh değerlendirmesi
- [ ] Büyük AI sağlayıcılarına resmi entegrasyon başvurusu (OpenAPI + pilot metriklerle)

---

## Mevcut (referans — tekrar yapılmayacak)

- Registry API: `resolve`, `cards/{handle}`, `well-known` mirror
- TypeScript SDK: `DigitalCard.resolve`, well-known fallback, `toSchemaOrg`, `toLlmsTxtSection`
- SDK agent tool: `buildEILResolveToolDefinition`, `invokeEILResolve`
- LangChain JS/TS: `EILResolveTool` (`packages/sdk/examples/`)
- Python şablonları: resolve, `@tool`, agent loop (`packages/sdk/examples/python/`)
- OpenAPI 3.1 spec: `/openapi.yaml`
- Dashboard keşif paneli: proxy snippet, well-known check, agent-card, llms.txt indirme
- Güvenlik: rate limit, security headers, resolve kotası, `security.txt`, public data uyarısı
- Whitepaper v1.0: `/insights/eil-whitepaper` (EN/TR)
- Sinyalle pilot: nginx proxy, domain well-known **ok**

---

## İlgili belgeler

- `kesif-stratejisi.md` — keşif stratejisi ve MVP kararları
- `packages/sdk/SDK.md` — SDK spesifikasyonu
- `schema/SCHEMA.md` — kart JSON şeması
