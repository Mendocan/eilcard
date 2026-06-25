# Consent UX rehberi — platform sahipleri için

> **Audience:** SaaS / platform operators integrating EIL Access  
> **Status:** Draft — June 2026  
> **Spec:** [EIL Access Spec v0.1](./eil-access-spec-v0.1.md) · [EIL Act Spec v0.1](./eil-act-spec-v0.1.md)

---

## 1. Amaç

Agent'lar public EIL JSON ile **kimliği** çözer; özel veri ve yazma/etkileşim için kullanıcı **onayı** gerekir. Bu rehber, platformunuzdaki consent ekranı ve akışı için minimum UX standartlarını tanımlar.

EIL Card consent UI sağlamaz — sizin gateway'iniz sağlar.

---

## 2. Temel prensipler

| Prensip | Uygulama |
|---------|----------|
| **Açık özne** | "Sinyalle agent'ı şunlara erişmek istiyor" — hangi agent uygulaması görünür |
| **Entity bağlamı** | Resolve edilen kurum adı + `verified` rozeti (EIL'den) |
| **Minimum scope** | Yalnızca istenen scope'lar listelenir; varsayılan hepsi seçili olmasın |
| **İptal kolay** | "Reddet" tek tık, eşit görünürlükte |
| **Sonradan yönetim** | Ayarlar → Bağlı agent'lar → scope daralt / bağlantı kes |
| **Süre** | "Bu erişim 90 gün geçerli" veya süresiz ise açıkça belirtin |

---

## 3. Örnek consent ekranı (wireframe)

```
┌─────────────────────────────────────────────────────────┐
│  [Agent logo]  Acme Assistant                           │
│                                                         │
│  sinyalle.com üzerinden doğrulanmış kurum adına          │
│  aşağıdaki verilere erişmek istiyor:                    │
│                                                         │
│  ☑ Sipariş geçmişi (read:orders)                        │
│  ☐ Profil detayları (read:profile)                      │
│                                                         │
│  Bu agent şunları yapabilir:                            │
│  ☐ Blog yazısı yayınla (write:post)                     │
│  ☐ Yorum yap (act:comment)                              │
│                                                         │
│  [ Reddet ]              [ İzin ver ]                   │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Zorunlu metin öğeleri

1. **Agent adı** ve geliştirici / sağlayıcı
2. **Kurum adı** — EIL resolve'dan `name.official` veya `name.full`
3. **Scope listesi** — insan dilinde + teknik id (parantez içi)
4. **Veri kullanımı** — kısa cümle (saklama süresi, satış yok)
5. **İptal yolu** — "Ayarlar → Agent erişimi"

---

## 5. `verified` sinyali

EIL Card `verified: true` ise consent ekranında gösterin:

> Bu kurum DNS ile doğrulanmıştır (EIL Card).

`verified: false` veya abonelik lapse ise uyarı:

> Kurum doğrulaması aktif değil — dikkatli ilerleyin.

---

## 6. Scope açıklamaları (örnek TR/EN)

| Scope | Kullanıcıya gösterilen (TR) |
|-------|----------------------------|
| `read:profile` | Profil ve iletişim detayları (public kartın ötesinde) |
| `read:orders` | Sipariş ve ödeme geçmişi |
| `read:posts_private` | Yalnızca size özel içerikler |
| `read:crm` | Destek kayıtları özeti |
| `write:post` | Blog veya duyuru yayınlama / düzenleme |
| `act:comment` | Yorum veya yanıt gönderme |

Write ve act scope'ları için **ayrı onay** gösterin — salt okunur erişimle birleştirmeyin.

---

## 7. Act scope consent (write / interact)

`write:` ve `act:` scope'ları destructive veya kullanıcı adına görünür etki yaratabilir:

1. **Ayrı bölüm** — "Bu agent şunları yapabilir" (read'den ayrı)
2. **Her action** — `capabilities.actions[].label` veya scope açıklaması
3. **Geri alma** — "Yayınlanan içerikleri silebilirsiniz" gibi kısa not

Bkz. [EIL Act Spec v0.1](./eil-act-spec-v0.1.md).

---

## 8. Erişim sonrası

- **Dashboard:** Kullanıcıya "Acme Assistant — read:orders, write:post" satırı
- **Bildirim:** İlk erişimde e-posta veya in-app (opsiyonel)
- **Revoke:** Anında token iptali; agent bir sonraki istekte 401 alır
- **Audit:** Kullanıcı kendi erişim logunu görebilmeli (enterprise)

---

## 9. Agent geliştiriciler için notlar

- Consent URL'ine `state` ve PKCE zorunlu (OAuth 2.1)
- `eil_card_id` parametresini authorization isteğine ekleyin
- Token aldıktan sonra `eil_card_id` claim'ini resolve sonucuyla karşılaştırın
- Scope escalation istemeyin — kullanıcıyı yeniden consent'e yönlendirin
- Act çağrılarında `Idempotency-Key` kullanın (Act Spec §5)

---

## 10. Yasal / gizlilik

- KVKK / GDPR: lawful basis (consent) ve DPA agent sağlayıcı ile
- Public EIL kartta kişisel veri tutmayın; özel veri yalnızca gateway'de
- Çocuk hesapları / hassas sektörler için ek kısıtlama tanımlayın

---

## 11. İlgili belgeler

- [EIL Access Spec v0.1](./eil-access-spec-v0.1.md)
- [EIL Act Spec v0.1](./eil-act-spec-v0.1.md)
- [Pilot Gateway](./pilot-gateway.md)
- [EIL Identity Spec v0.1](./eil-identity-spec-v0.1.md)
