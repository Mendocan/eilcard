# Well-known trust model — native vs registry proxy

> **Status:** Draft — June 2026  
> **Audience:** Kart sahipleri, DevOps, AI agent geliştiricileri

---

## 1. Özet

EIL Card kimliği iki kanaldan doğrulanabilir:

| Kanal | URL | Kim sunar? | Güven özü |
|-------|-----|------------|-----------|
| **Native origin** | `https://{domain}/.well-known/digital-card` | Kart sahibinin kendi sunucusu | TLS + DNS kontrolü (isteğe bağlı DNSSEC) |
| **Registry proxy** | `https://eilcard.com/api/v1/well-known?domain={domain}` | EIL Card registry | Platform imzası + doğrulanmış domain kaydı |

Agent'lar ve SDK önce **registry resolve** kullanır; domain well-known ikincil kanıt veya mirror olarak değerlendirilir.

---

## 2. Native well-known (önerilen üretim modeli)

Kart sahibi JSON dosyasını kendi origin'inde yayınlar:

```
https://example.com/.well-known/digital-card
```

### 2.1 Statik dosya

Nginx / Apache / cPanel ile doğrudan JSON servis edilir. Snippet üretimi dashboard ve `apps/web/src/lib/well-known.ts` içindeki `nginxWellKnownSnippet()` ile yapılır.

**Güven varsayımları:**

- Tarayıcı ve agent, URL'nin host'unun **kartın `card_id` domain'i** olduğunu doğrular.
- TLS sertifikası geçerli olmalıdır (Let's Encrypt vb.).
- İçerik registry ile `card_id`, `handle` ve `updated_at` açısından uyumlu olmalıdır.

### 2.2 Registry proxy (nginx `proxy_pass`)

Domain yine `example.com` üzerinde görünür; içerik registry'den çekilir:

```nginx
location = /.well-known/digital-card {
    proxy_pass https://eilcard.com/api/v1/well-known?domain=example.com;
    proxy_set_header Host eilcard.com;
    proxy_ssl_server_name on;
}
```

**Avantaj:** Tek kaynak (registry); domain güncellemeleri otomatik yansır.  
**Dikkat:** Agent, yanıtın gerçekten `example.com` origin'inden geldiğini TLS ile doğrular; JSON'un registry mirror'ı olduğunu bilir. Bu, statik dosyadan **daha zayıf origin bağlamı**dır — registry zaten authoritative kabul edilir.

Snippet: `nginxWellKnownProxySnippet()` — bkz. [well-known.ts](../apps/web/src/lib/well-known.ts).

---

## 3. Registry well-known API

```
GET https://eilcard.com/api/v1/well-known?domain=sinyalle.com
```

- Doğrulanmış domain'e bağlı aktif kartı döner.
- `apps/web` içinde host edilir; EIL Card operasyon ekibi TLS ve erişim kontrolünü yönetir.
- Dashboard **well-known health check** (`checkDomainWellKnown`) uzaktaki native URL ile registry kaydını karşılaştırır: `ok`, `missing`, `mismatch`, `stale`, `html`, `unreachable`.

---

## 4. DNSSEC rolü

DNSSEC, resolver'ların DNS yanıtlarının değiştirilmediğini kriptografik olarak doğrulamasını sağlar.

| Senaryo | DNSSEC etkisi |
|---------|----------------|
| Native well-known + doğru A/AAAA | DNS hijack riski azalır; agent hâlâ TLS doğrulaması yapmalı |
| Registry proxy | Domain DNS'i yalnızca origin'e yönlendirir; JSON registry'den gelir |
| Sahte alt domain | DNSSEC + CAA + registry domain verification birlikte sahte kartı engeller |

**Agent rehberi (2025–2026):**

1. `DigitalCard.resolve({ domain })` ile registry authoritative yanıtı al.
2. `verified === true` ve `card_id === domain` kontrol et.
3. İsteğe bağlı: `https://{domain}/.well-known/digital-card` fetch et; `checkDomainWellKnown` mantığıyla uyum doğrula.
4. DNSSEC doğrulaması platforma özgüdür (Node `dns.resolve` DNSSEC bitini taşımaz); yüksek güven gereken kurulumlarda harici DNSSEC validator veya enterprise resolver kullanın.

EIL Card şu an DNSSEC'i zorunlu kılmaz; Registry+ **JWS imza** katmanı registry export'u için ek kanıt sağlar (`verify-registry-jws.mjs`).

---

## 5. Agent-card.json (E3-A)

Aynı trust modeli `/.well-known/agent-card.json` için geçerlidir:

- Native: `domainAgentCardUrl()` → `https://{domain}/.well-known/agent-card.json`
- Registry mirror: `registryAgentCardUrl()` → `https://eilcard.com/api/v1/cards/{handle}/agent-card.json`

Agent discovery önce registry resolve, sonra isteğe bağlı domain agent-card kontrolü.

---

## 6. Karar ağacı (kart sahibi)

```
Domain DNS kontrolüm var mı?
├─ Evet → Native statik JSON (en güçlü origin sinyali)
├─ Evet ama JSON'u elle güncellemek istemiyorum → nginx proxy_pass → registry API
└─ Hayır (sadece handle) → Yalnızca registry resolve; well-known opsiyonel
```

---

## 7. İlgili belgeler

- [EIL Identity Spec v0.1](./eil-identity-spec-v0.1.md)
- [Registry+ edition](./registry-plus.md)
- [Agent integration (/docs/agents)](https://eilcard.com/docs/agents)
- Kaynak: `apps/web/src/lib/well-known.ts`
