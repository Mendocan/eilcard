# EIL Card — Agent çağı stratejisi

> Durum değerlendirmesi ve yol haritası  
> Son güncelleme: 2026-06-22  
> Bağlam: Gemini ile yapılan vizyon sohbeti + kod tabanı gerçekliği

---

## Kuzey yıldızı (değişmez)

**Agent'lar web'i kazımasın; entity kimliği domain-bound, doğrulanmış ve makine-okunur olsun.**

- İnsanlar için: kart sayfası, marka, deneyim (SaaS, topluluk, alışveriş).
- Agent'lar için: `resolve()` / `/.well-known/digital-card` — canonical JSON, HTML değil.
- Satılan şey: süreli güven hizmeti (`verified` + kota + registry), ham JSON dosyası değil.

---

## Bugün neredeyiz (dürüst envanter)

| Katman | Durum | Kod / ürün |
|--------|--------|------------|
| **Entity kimliği (Who)** | Canlı | handle, domain, org/person JSON, DNS TXT |
| **Keşif (Discovery)** | Canlı | Registry `resolve`, well-known fallback, `llms.txt` |
| **Güven sinyali (Trust)** | Canlı | `verified` + abonelik, grace/cron revoke |
| **Edition / şema zenginliği** | Planlı (Eksen 2) | Core → Business → Registry+ |
| **Özel veri erişimi (Read scoped)** | Yok | Kullanıcı onayı, agent token, platform gateway |
| **Aksiyon (Write/Act)** | Yok | Post, etkileşim, idempotent agent API |

**Sonuç:** EIL Card bugün **kimlik + registry + public read** katmanında. Gemini'nin "kör nokta" dediği dinamik/özel veri ve yazma yetkisi **bilinçli olarak sonraki eksen**.

---

## Üç eksen modeli (ticari + teknik)

| Eksen | Ne satılır / ne inşa edilir | Zaman |
|-------|-----------------------------|--------|
| **Eksen 1** | Abonelik, limit, `verified`, Polar, churn | Tamamlandı (Faz 0–2) |
| **Eksen 2** | Edition, şema v1.1, `offerings[]`, feature gate | Faz 4 (şimdi) |
| **Eksen 3** | Agent keşif yüzeyi, MCP, authorized read/act spec | Faz 5+ |

**Kritik ayrım:** Eksen 3'ü tek monolit "EIL her şey" yapma. Çekirdek = kimlik; **EIL Access** = ayrı spec (platform gateway + consent).

---

## Gelecek beklentisi (temkinli)

### Web ölecek mi?

Hayır. Rolü değişir:

- **Bilgi-only siteler** — agent özetler; tıklama trafiği düşer.
- **Aksiyon/deneyim platformları** — hayatta kalır (SaaS, topluluk, ödeme).
- **Agent-friendly siteler** — public canonical JSON + (ileride) capability manifest kazanır.

### Agent tarama nasıl evrilir?

1. **Gözlemci** — HTML/DOM scrape (bugün, pahalı, hatalı).
2. **Okuyucu** — well-known / registry JSON (EIL bugünkü sweet spot).
3. **Yetkili okuyucu** — scoped token, kullanıcı onayı (Eksen 3-B).
4. **Aktör** — write/act token, idempotent API (Eksen 3-C).

EIL Card'ın öncelik sırası: 2 → mükemmelleştir → 3-B spec → 3-C spec.

---

## Mimari: Static vs Dynamic (kör nokta)

### Public layer (mevcut)

`/.well-known/digital-card` veya registry `resolve`:

- Kurum/kimlik, iletişim, ürünler, `same_as`, `verified` metadata.
- **Agent için yeterli:** "Bu entity kim, resmi kayıt nerede?"

### Dynamic layer (henüz yok)

Örnek: "Kullanıcının 15 Mart'taki paylaşımı"

- EIL public JSON'da **olmamalı** (PII, consent, platform-specific).
- Çözüm: kartta **pointer**, veri **platform API**'de:

```json
{
  "capabilities": {
    "agent_gateway": "https://api.example.com/v1/agent-gateway",
    "auth": "oauth2",
    "scopes": ["read:posts_public", "read:posts_private"]
  }
}
```

Akış: Discovery → Consent (kullanıcı onayı) → Scoped token → Gateway read.

**EIL'in rolü:** capability manifest + entity binding; **OAuth/token platformun işi** (EIL Access spec ile standartlaştırılır).

---

## OAuth / "Login with Google"dan fark

| | Klasik OAuth | EIL (hedef) |
|---|--------------|-------------|
| Özne | Kullanıcı hesabı | **Entity** (domain + registry) |
| Amaç | Siteye login | Agent'ın **hangi canonical kaynağı** okuyacağı / yapacağı |
| Güven | IdP | DNS + registry `verified` |
| Veri | Profil scope | Public JSON + scoped private API |

EIL "giriş" değil; **entity identity + (ileride) permission manifest**.

---

## Dev şirketler bunu neden kabul eder? (Gerçekçi pitch)

Öncelik sırası:

1. **Güvenilirlik** — entity halüsinasyonu, yanlış domain, sahte kurum azalır.
2. **Hukuk / izin** — agent-friendly, robots.txt benzeri "bu dille konuş" sözleşmesi.
3. **Maliyet** — küçük JSON vs çok MB HTML (ikincil argüman).

**Strateji:** Devlere doğrudan "standart kabul edin" demek yerine:

- Geliştirici kitlesi (SDK, MCP tool, 5 dk kurulum)
- Ölçülebilir referans (`@eilcard`, pilot domain'ler)
- Açık spec (Identity v0.1; Access ayrı RFC)
- MCP / LangChain entegrasyonu — "yeni standart" değil "veri taşıyıcı"

---

## Kod yapısına hazırlık (şimdiden)

Eksen 2 ve 3'e geçerken kırılmayı önleyen kararlar:

| Karar | Neden |
|-------|--------|
| `schema_version` + `edition` alanları | Şema evrimi registry'de görünür |
| Public JSON vs private API ayrımı | Legal + güvenlik; public kart şişmez |
| `capabilities` için reserved extension | v1.0'da boş/null; v1.2+ doldurulur |
| SDK: `resolve()` sabit; `discoverCapabilities()` sonra | Geriye uyum |
| Platform gateway EIL repo dışı | Sinyalle vb. ayrı servis; EIL spec ortak |

**Yapma (erken):** Tüm sosyal platform OAuth'unu EIL core'a gömme; "Universal Agent Protocol" adıyla monolit auth servisi.

---

## Faz planı (Eksen 3)

### E3-A — Agent discovery (6–12 ay, Eksen 2 ile paralel mümkün)

- [ ] MCP sunucusu: `resolve_entity`, `get_card_by_handle`
- [ ] `capabilities` extension taslağı (SCHEMA.md, boş default)
- [ ] **EIL Identity Spec v0.1** — public draft (GitHub)
- [ ] Agent docs: scrape yok, resolve var (ölçülebilir latency örneği)
- [ ] Schema.org bridge (çift yazım, kırılma yok)

### E3-B — Authorized read (12–24 ay)

- [ ] **EIL Access Spec** taslağı (Identity'den ayrı belge)
- [ ] Capability manifest şeması (`agent_gateway`, scopes, auth type)
- [ ] OAuth 2.1 / agent delegation referans akışı (platform implement eder)
- [ ] Consent UX rehberi (platform sahipleri için)
- [ ] Pilot: bir platform gateway (ör. harici proje, EIL pointer only)

### E3-C — Authorized act (24+ ay)

- [ ] Write scope modeli (`write:post`, `act:comment`)
- [ ] Idempotent agent action API pattern
- [ ] Audit log + rate limit + abuse standartları
- [ ] "Universal Agent Protocol" yalnızca konsensüs sonrası isimlendirme

---

## Stratejik notlar (sohbet özeti)

- **UI-less web** — agent için tasarım önemsiz; canonical JSON önemli.
- **SEO → Agent discovery** — uzun vadede "entity otoritesi" değer kazanır.
- **Robots.txt analojisi** — zorunluluk değil; agent SDK'ları destekleyince yayılma.
- **RFC/community** — önce çalışan impl + 10–50 domain; sonra resmi başvuru.
- **Maliyet %90** iddiası — pazarlama değil; ikincil teknik argüman.
- **Kişisel veri** — platform onayı + scope; EIL public kartta tutulmaz.

---

## İlgili belgeler

- `YAPILACAKLAR.md` — uygulama sırası ve checkbox'lar
- `kesif-stratejisi.md` — hibrit keşif kararları
- `schema/SCHEMA.md` — kart JSON şeması
- `packages/sdk/SDK.md` — SDK sözleşmesi
