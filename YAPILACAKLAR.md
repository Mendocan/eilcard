# YAPILACAKLAR

> EIL Card — öncelikli iş listesi  
> Son güncelleme: 2026-06-25

---

## Kuzey yıldızı (tek cümle)

**Satılan şey JSON dosyası değil; süreli, yenilenebilir güven hizmetidir** — registry barındırma + DNS doğrulama + `verified: true` otoritesi + resolve kotası. Kart verisi kalabilir; güven sinyali ve premium limitler abonelik yenilenmedikçe düşer.

---

## Temel kararlar (erken kilit — geri dönüş maliyeti yüksek)

Bunlar sonradan değişirse migration, müşteri sözleşmesi ve SDK davranışı kırılır. **Önce bunları kodla, sonra özellik ekle.**

| # | Karar | Açıklama |
|---|--------|----------|
| 1 | **Hibrit keşif** | Registry birincil, `/.well-known/digital-card` fallback (`kesif-stratejisi.md`) |
| 2 | **`verified` ≠ kalıcı** | DNS + aktif abonelik birlikte; süre bitince veya domain değişince revoke |
| 3 | **`getEffectiveTier()`** | `expires_at` geçmişse DB tier ne olursa olsun efektif tier = free |
| 4 | **Churn: grace → downgrade** | 14–30 gün tam erişim → free limitleri + `verified` düşür (JSON silinmez) |
| 5 | **Domain değişimi = re-doğrulama** | PATCH update’te domain değişirse `verified=false`, DNS kapat, kuyruğa al |
| 6 | **Public JSON açık, otorite ücretli** | Resolve/well-known okunabilir; verified rozeti ve yüksek kota abonelikle |
| 7 | **Kart geçmişi (minimal log)** | Müşteri PATCH’lerinde `changed_fields` + timestamp (tam diff sonra) |
| 8 | **İki eksenli ticari model** | **Eksen 1** = abonelik (limit, güven, Polar); **Eksen 2** = edition (kart zenginliği, şema). Edition vitrin; abonelik arka plan motoru |
| 9 | **Kimlik ≠ erişim** | Public EIL kart = entity kimliği; özel veri + agent token = **platform gateway** (EIL Access spec, Eksen 3). Core şişirilmez |

**Bilinçli olarak ertelenen (Eksen 2–3 sırasıyla):** JWS imza, federated registry, rol tabanlı admin; authorized read/act (Eksen 3-B/C).

---

## Uygulama sırası (tıkanmayı önleyen yol)

Her faz bitmeden sonrakine geçme. Paralel iş yalnızca aynı faz içinde.

### Faz 0 — Temeli sabitle (1–2 hafta, kod)

- [x] **`getEffectiveTier()`** — `user-plan.ts`; tüm limit/kota kontrolleri buna bağlansın
- [x] **Domain değişiminde revoke** — `update/route.ts` + kuyruk senkronu
- [x] **Doğrulama kuyruğu (kart merkezli)** — doğrulanmamış kartlar listelensin (deploy + test)
- [x] **`card_change_logs` migration** — minimal: card_id, user_id, fields[], created_at
- [x] **Git commit + push** — birikmiş UI/operatör/kuyruk/Faz 0 değişiklikleri (`4622f3a`)

### Faz 1 — Ticari iskelet (Polar öncesi yasal zemin)

- [x] **`/pricing`** — tier tablosu + “abonelik bitince ne olur” kutusu
- [x] **`/legal/terms`** + **`/legal/refund`** — abonelik, export hakkı, verified süresi
- [x] **`/legal/privacy`** — gizlilik politikası
- [x] **Footer linkleri** + kayıt Terms onayı

### Faz 2 — Polar + churn otomasyonu

- [x] **Polar org + ürünler** — Verified/Pro product ID'leri → VPS `.env.prod` (canlı E2E: ödeme → Verified plan → kart oluşturma)
- [x] **Webhook** → `/api/webhook/polar` → `tier`, `expires_at`, `polar_subscription_id`
- [x] **Grace + downgrade** — `SUBSCRIPTION_GRACE_DAYS`, cron `/api/cron/subscription-reconcile`, verified revoke
- [x] **Checkout + portal** — `/api/billing/checkout`, `/portal`
- [x] **Dashboard billing panel** — bitiş tarihi, upgrade, manage billing
- [x] **Resend iskelet** — `billing-email.ts` (plan expiring notice)
- [x] **VPS cron script** — `scripts/cron-subscription-reconcile.sh` (crontab kurulumu sunucuda)

### Faz 3 — Pilot müşteri + operatör kartı

- [x] Production operatör: `@eilcard` + `eilcard.com` DNS doğrulama (verified)
- [x] **Sinyalle pilot — abonelik satın alma (E2E)** — `@sinyal24` hesabı, kart oluşturma, Polar Verified checkout ($9 test ödemesi) → webhook → plan
- [ ] **Sinyalle pilot — churn simülasyonu (opsiyonel)** — `simulate-subscription-lapse.mjs` + cron reconcile (grace → downgrade → `--restore`; Polar iptal etmeden DB testi)
- [x] Admin: son müşteri değişikliği — `/admin/changes` (`card_change_logs`)
- [x] Admin: kuyruk durumu — `/admin/verification`
- [x] Operatör script'leri — `seed-platform-operator-card.mjs`, deploy hook

### Faz 4 — Eksen 2 (edition katmanı)

> **Eksen 1 kuruldu** (Faz 0–2): plan, limit, `verified`, Polar, churn, registry, resolve.  
> **Faz 4 = Eksen 2:** kart edition’ları ve şema zenginliği — Eksen 1’in **üstüne** inşa edilir, yerine geçmez.

**Dışarı (müşteri dili):** Core → Business → Registry+  
**İçeride (kod):** `user_plans.tier` + `edition` / `schema_version` + feature gate

#### Eksen 1 referans (tamamlandı — dokunma, genişlet)

- [x] `tier-limits.ts` — Free / Verified / Pro kota tablosu
- [x] Polar checkout, webhook, portal, billing panel
- [x] DNS doğrulama + `verified: true` + abonelik revoke
- [x] Grace + cron downgrade
- [x] Şema v1.0 — `name`, `contact`, `description`, `products[]`, `actions`, `same_as`

#### E2-A — Edition iskeleti (karar + kod)

- [x] **Edition enum** — `core` | `business` | `registry_plus` (DB veya kart metadata)
- [x] **Plan ↔ edition eşlemesi** — hangi tier hangi edition alanlarını açar (ör. Business → Verified+)
- [x] **Feature gate** — API + dashboard: edition dışı alan reddedilir veya gizlenir
- [x] **Pricing / satış dili** — vitrin: edition (Core → Business → Registry+); arka plan: Verified/Pro Polar planları
- [x] **`SCHEMA.md` + SDK** — edition ve `schema_version` ilişkisi belgelenir

#### E2-B — Core edition (mevcut durumun adlandırılması)

- [x] **Core = v1.0** — bugünkü kartlar resmi olarak Core edition sayılır (geriye uyumlu)
- [x] **Holding anlatımı** — docs: özet + `products[]` + URL’ler; tek dev JSON değil
- [x] **Pilot referansları güncelle** — Sinyalle + `@eilcard` = Core + Eksen 1 Verified/Pro

#### E2-C — Business edition (şema v1.1)

- [x] **`offerings[]`** — birleşik ürün/hizmet hiyerarşisi (`schema/SCHEMA.md` v1.1 taslağı)
- [x] **`content_locale`** (veya eşdeğeri) — kart içeriği dili
- [x] **Dashboard UI** — offering editörü, org kartı / iş kolu hiyerarşisi
- [x] **Public kart + resolve** — v1.1 alanları export (schema.org, llms.txt güncellemesi)
- [x] **Validasyon** — Business edition + Verified+ plan zorunluluğu
- [x] **Migration** — v1.0 kartlar Core olarak kalır; v1.1 opt-in yükseltme

#### E2-D — Registry+ edition (enterprise / ileri)

- [x] **JWS imza alanı** — `signatures.registry` (compact JWS); Registry+ gate + dashboard
- [x] **MCP sunucusu** — `@digitalcard/mcp`: `resolve_domain`, `get_card_by_handle`
- [x] **Enterprise add-on** — `user_plans.enterprise_addon` + admin toggle; Registry+ edition gate
- [x] **Federated registry** değerlendirmesi — `docs/registry-plus.md` (ertelendi, tetikleyiciler)

**Edition ↔ plan özeti (hedef)**

| Edition | Şema | Min. plan | Kim için |
|---------|------|-----------|----------|
| **Core** | v1.0 | Free (verified yok) / Verified+ | KOBİ, pilot, tek marka |
| **Business** | v1.1 | Verified+ | Holding, çok iş kolu, zengin katalog |
| **Registry+** | v1.2 | Pro + enterprise add-on | Finans, kamu, yüksek güven |

---

### Faz 5 — Eksen 3 (agent çağı — kimlik sonrası)

> **Strateji özeti:** `docs/strateji-agent-cagi.md`  
> Bugün: kimlik + public `resolve`. Yarın: capability manifest → authorized read → authorized act.  
> **Sıra:** Faz 4 (Eksen 2) bitmeden E3-B/C koduna girme.

#### E3-A — Agent discovery (keşif yüzeyi)

- [x] **MCP sunucusu** — `resolve_entity`, `get_card_by_handle`
- [x] **`capabilities` extension** — SCHEMA.md taslağı; v1.0'da boş/default
- [x] **EIL Identity Spec v0.1** — public draft (kimlik katmanı only)
- [x] **Schema.org bridge** — çift yazım, geriye uyum
- [x] Agent docs — scrape yerine resolve; latency / güven örneği

#### E3-B — Authorized read (özel veri, kullanıcı onayı)

- [x] **EIL Access Spec** taslağı — Identity belgesinden ayrı (`docs/eil-access-spec-v0.1.md`)
- [x] Capability manifest — `agent_gateway`, scopes, auth type (şema + `discoverCapabilities()`)
- [x] OAuth 2.1 / agent delegation referans akışı (platform implement eder)
- [x] Consent UX rehberi — platform sahipleri için (`docs/consent-ux-guide.md`)
- [x] Pilot gateway — harici platform pointer (`docs/pilot-gateway.md`); gateway kodu EIL dışı

#### E3-C — Authorized act (yazma / etkileşim)

- [ ] Write scope modeli (`write:post`, `act:comment`)
- [ ] Idempotent agent action API pattern
- [ ] Audit + rate limit + abuse standartları

**Yapma:** Tüm OAuth/agent auth'u EIL Card core monolitine gömme.

---

## Kısa vade — Kart içeriği ve UI (önce UI, sonra şema)

Strateji: Mevcut şema v1.0 alanlarıyla zengin kart içeriği; şema v1.1 (`offerings[]` vb.) UI oturduktan sonra.

- [x] **Dashboard — “AI agent'lar için” alanı** (yeni + düzenle): özet, ürünler (org), link/projeler (person → `actions`), `same_as`
- [x] **Public kart (`/kart/[handle]`)** — özet, ürünler, linkler, profiller, iletişim; EN/TR etiketleri
- [x] **Kart sayfası dil tutarlılığı** — UI etiketleri ziyaretçi çerezi yerine kart içeriği diline göre (TR içerik → TR etiket)
- [x] **`/example` — temalı demo sayfa** — registry kaydı değil; EN/TR tutarlı “kart böyle görünür” önizlemesi ([eilcard.com/example](https://eilcard.com/example))
- [x] **Landing kart önizlemesi** — ana sayfada mini demo + `/example` linki
- [x] **Yanlış `@eilcard` registry kartı kaldırıldı** — platform kartı müşteri hesabında (Sinyalle) olmamalı; demo yalnızca `/example`
- [x] **Platform operatör hesabı** — `is_platform_operator` + `PLATFORM_OPERATOR_EMAIL`; rezerve handle/domain; admin ayarları; `ensure-platform-operator.mjs`
- [x] **Operatör hesabını production'da kur** — `platform@eilcard.com` kayıtlı + ensure script + `@eilcard` kartı
- [x] **`@eilcard` DNS doğrulama** — `eilcard.com` verified (2026-06-20)
- [ ] **Şema v1.1 / Business edition** — → Faz 4 E2-C (`offerings[]`, `content_locale`)

**Canlı referanslar (Core edition)**

| Tür | Edition | Plan | URL |
|-----|---------|------|-----|
| Demo (statik) | — | — | https://eilcard.com/example |
| Pilot (gerçek, doğrulanmış) | Core | Verified | https://eilcard.com/kart/sinyal24 |
| Operatör (registry) | Core | Pro | https://eilcard.com/kart/eilcard |
| Resolve (pilot) | Core | Verified | https://eilcard.com/api/v1/resolve?domain=sinyalle.com |
| Resolve (operatör) | Core | Pro | https://eilcard.com/api/v1/resolve?domain=eilcard.com |

Detay: `docs/core-edition.md`

---

## Kısa vade — Agent keşif yüzeyi

Entegrasyon rehberi (`/docs/agents`) — **yayında** (kısa vade maddeleri tamamlandı).

- [x] **eilcard.com kök `llms.txt`** — resolve, well-known, docs; pilot + `/example` linkleri
- [x] **`/docs/agents` sayfası** — OpenAI / Anthropic / Gemini şablonları; curl + SDK
- [x] **Dashboard: `llms.txt` patch bloğu** — domain'e eklenecek EIL bölümü; indirilebilir snippet

---

## Kısa vade — Site ve deploy

- [x] **Production VPS** — DigitalOcean Amsterdam, Docker Compose + Caddy, `eilcard.com` canlı
- [x] **Footer** — `support@eilcard.com`; tagline + iletişim yan yana; landing’deki yinelenen İletişim bölümü kaldırıldı
- [x] **`platform-config.ts`** — `SUPPORT_EMAIL` / `BILLING_EMAIL` varsayılanları
- [x] **Deploy script** — `scripts/prod-deploy-eilcard.sh` (tarball → VPS → rebuild)
- [x] **VPS `.env.prod`** — Polar, CRON_SECRET, SUPPORT_EMAIL (sunucuda; repoda yok)
- [x] **VPS crontab** — günlük `scripts/cron-subscription-reconcile.sh`

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

İki katman: **gelen kutusu** (insan) + **işlem postası** (uygulama API).

**Karar:** Gelen kutusu **Namecheap Private Email** — domain Namecheap/DigitalOcean DNS.

| Katman | Amaç | Sağlayıcı |
|--------|------|-----------|
| **Gelen kutusu** | support@, billing@, hello@ | **Namecheap Private Email** |
| **İşlem postası** | şifre sıfırlama, fatura bildirimi | **Resend** (~3.000/ay ücretsiz) |

**Önerilen adresler:** `support@eilcard.com` (ana), `billing@` (alias → support@)

- [x] **Namecheap Private Email** — Starter; `support@` çalışıyor; `billing@` alias
- [x] **Footer + About** — `support@eilcard.com` görünür
- [x] **Admin → Ayarlar** — iletişim env durumu, güvenlik notu, ekip yol haritası
- [ ] **Resend** — şifre sıfırlama / bildirim şablonları
- [x] **E-posta doğrulama** — kayıt sonrası Resend + `/verify-email` + dashboard banner
- [ ] **`hello@` alias** (opsiyonel)
- [ ] Polar checkout + fatura bildirimlerinde `billing@`

### Admin panel iyileştirmeleri

- [x] **Doğrulama kuyruğu (kart merkezli)** — doğrulanmamış kartlar; admin verify → kuyruktan düşer
- [x] **Doğrulama sayacı düzeltmesi** — doğrulanmamış kart sayısı (kuyruk ile uyumlu)
- [x] **Çift dil/çıkış butonu** — mobil üst / masaüstü sidebar tek konum
- [x] **Ayarlar sayfası** (`/admin/settings`)
- [ ] **Rol tabanlı admin** — editör, moderatör, admin; davet + DB hesapları
- [ ] **Admin şifre değiştirme UI** — `ADMIN_PASSWORD` yerine DB veya güvenli rotasyon

---

## Orta vade — Integration surface

Odak: **AI ekosistemine entegre edilebilirlik ve adaptasyon hızı.**

### 1. AI framework entegrasyonları (Tool / Plugin)

- [x] **LangChain `EILResolveTool`** — `packages/sdk/examples/langchain-eil-resolve-tool.ts` + `/docs/agents`
- [x] **Python agent şablonları** — `packages/sdk/examples/python/` + `/docs/agents`
- [x] **Güvenlik sertleştirme** — rate limit, security headers, resolve kotası, `security.txt`, public JSON uyarısı
- [ ] **LlamaIndex `EILReader` (Data Connector)**
- [x] **MCP sunucusu** — `@digitalcard/mcp` (`resolve_entity`, `resolve_domain`, `get_card_by_handle`)

### 2. LLM sistem komutları ve Function Calling

- [x] **OpenAPI 3.x spec** — `/openapi.yaml`
- [x] **Standart system prompt şablonu** — `/docs/agents`
- [x] **SDK agent tool** — `buildEILResolveToolDefinition`, `invokeEILResolve`
- [ ] **JSON Schema → tool definition export**

### 3. Güven katmanı (kriptografik doğrulama)

- [ ] **JWS imza alanı**
- [ ] **DNSSEC dokümantasyonu**
- [ ] **Proxy vs native well-known güven modeli**

### 4. Geriye dönük uyumluluk (Bridge)

- [x] **Schema.org bridge**
- [x] **Bridge response meta**

### 5. Adoption araçları (özet yol haritası)

| Araç | Durum | Yapılacak |
|------|--------|-----------|
| **Universal NPM SDK** | Kısmen var (`@digitalcard/sdk`) | Python paketi, publish |
| **EIL CLI** | Yok | `eil-card init`, `verify`, `export well-known` |
| **Playground** | Yayında | `/playground` |
| **Kart demo** | Yayında | `/example` (statik; registry değil) |
| **Entegrasyon rehberi** | Yayında | `/docs/agents` |
| **Whitepaper** | Yayında | `/insights/eil-whitepaper` EN/TR |

---

## Uzun vade — Standart ve ekosistem

### Ekip / Açık Kaynak hazırlığı

- [ ] **Branch protection rules** — `main` için PR + review

- [ ] IANA `/.well-known/digital-card` kaydı
- [ ] Federated registry / mesh değerlendirmesi
- [ ] Büyük AI sağlayıcılarına resmi entegrasyon başvurusu

---

## Mevcut (referans — tekrar yapılmayacak)

- Registry API: `resolve`, `cards/{handle}`, `well-known` mirror
- TypeScript SDK: `DigitalCard.resolve`, well-known fallback, `toSchemaOrg`, `toLlmsTxtSection`
- SDK agent tool, LangChain örneği, Python şablonları
- OpenAPI 3.1: `/openapi.yaml`
- Dashboard keşif paneli: proxy snippet, well-known check, agent-card, llms.txt
- Güvenlik: rate limit, headers, resolve kotası, `security.txt`
- Whitepaper v1.0: `/insights/eil-whitepaper` (EN/TR)
- Sinyalle pilot: nginx proxy, domain well-known **ok**; Polar Verified checkout E2E ($9 test) **ok**
- Operatör kartı: `@eilcard` + `eilcard.com` DNS verified
- **Eksen 1** ticari omurga: Polar, tier limits, grace/cron (Faz 0–2)
- Kart UI v1.0: agent discovery alanları (şema değişmeden)
- Demo sayfa: `/example` — Northwind Studio temalı önizleme (registry dışı)

---

## İlgili belgeler

- `docs/registry-plus.md` — Registry+ edition, JWS, MCP, enterprise add-on
- `docs/strateji-agent-cagi.md` — agent çağı stratejisi, üç eksen, E3 yol haritası
- `kesif-stratejisi.md` — keşif stratejisi ve MVP kararları
- `packages/sdk/SDK.md` — SDK spesifikasyonu
- `schema/SCHEMA.md` — kart JSON şeması
- `deploy.md` — VPS deploy rehberi
