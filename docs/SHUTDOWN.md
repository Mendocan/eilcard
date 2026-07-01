# EIL Card — Altyapı kapatma planı

> **Durum:** Faz 1 tamam — Faz 2 (VPS) sırada (2026-06-30)  
> **Hedef:** Yalnızca yerel kod + GitHub repo kalsın; canlı ağ hizmetleri kapatılsın.  
> **Faz 3:** **Seçenek A** — Cloudflare zone tamamen kaldır → Namecheap BasicDNS.

---

## Kontrol listesi

| Faz | Madde | Durum |
|-----|--------|--------|
| 0 | Postgres / `.env.prod` yedeği (opsiyonel) | [ ] |
| 1 | Polar webhook + ürünler arşiv | [x] 2026-06-30 |
| 1 | Resend `eilcard.com` domain kaldır | [x] 2026-06-30 |
| 1 | GitHub Actions disable + secrets sil | [x] 2026-06-30 |
| 1 | PyPI — yeni publish yok | [x] workflow `if: false` |
| 2 | DigitalOcean Droplet destroy (`209.38.35.151`) | [ ] **← şimdi** |
| 3A | Cloudflare: `eilcard.com` zone **Remove** | [ ] (Seçenek A) |
| 4 | Namecheap Private Email iptal | [ ] |
| 4 | Namecheap nameserver → BasicDNS | [ ] |
| 4 | Domain `eilcard.com` tut / expire kararı | [ ] |
| 5 | Repo private veya README “paused” notu | [ ] |
| 6 | Sinyalle well-known / gateway (Signal repo) | [ ] |

---

## Faz 0 — Yedek (opsiyonel)

VPS ayaktayken (SSH):

```bash
ssh -i ~/.ssh/id_ed25519_eilcard root@209.38.35.151
cd /opt/digital_card
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T postgres \
  pg_dump -U postgres digitalcard > /root/eilcard-backup-$(date +%Y%m%d).sql
```

Yerel indirme (PowerShell):

```powershell
scp -i $env:USERPROFILE\.ssh\id_ed25519_eilcard root@209.38.35.151:/root/eilcard-backup-*.sql C:\digital_card\backups\
```

`.env.prod` sunucudan kopyalamayın repoya; güvenli klasörde saklayın.

---

## Faz 1 — Üçüncü taraf (şimdi)

### 1A — Polar (~5 dk)

1. Giriş: [polar.sh](https://polar.sh) → organization
2. **Settings → Webhooks** (veya Developers): `https://eilcard.com/api/webhook/polar` endpoint’ini **sil**
3. **Products**: Verified / Pro ürünlerini **arşivle** veya satışı kapat
4. **Subscriptions**: Aktif abonelik varsa (Sinyalle test) → iptal veya not alın
5. `POLAR_ACCESS_TOKEN` — panelden revoke (opsiyonel, secret silmek yeterli)

### 1B — Resend (~2 dk)

1. Giriş: [resend.com/domains](https://resend.com/domains)
2. **eilcard.com** → **Remove** / Delete domain
3. API key’i silmek zorunlu değil; GitHub secret silinince kullanılmaz

### 1C — GitHub (~5 dk)

**Kod (yerel, push gerekir):**
- `ci.yml` — yalnızca `workflow_dispatch` (otomatik CI kapalı)
- `publish-python.yml` — `if: false` (PyPI publish kapalı)

**Sizin tarayıcıda** — [github.com/Mendocan/eilcard/settings](https://github.com/Mendocan/eilcard/settings):

1. **Secrets and variables → Actions** → silin:
   - `PYPI_API_TOKEN`
   - Polar ile ilgili secret varsa (ör. `POLAR_*`)
   - Deploy / VPS secret’ları varsa
2. **Actions → General**: İsteğe bağlı “Disable actions” (tümü kapalı)
3. Veya her workflow: **⋯ → Disable workflow**

Push sonrası otomatik CI tetiklenmez.

### 1D — PyPI

- `eil-card` paketi PyPI’da kalabilir; **yeni sürüm yayınlanmayacak** (workflow kapalı).
- Paketi yayından kaldırmak ayrı PyPI destek süreci — gerekmez.

---

## Faz 2 — DigitalOcean

1. [DigitalOcean dashboard](https://cloud.digitalocean.com/dashboard?i=31aa39)
2. Droplet `209.38.35.151` → **Destroy** (isteğe bağlı önce snapshot)
3. Doğrulama: `ping eilcard.com` / tarayıcı — site açılmamalı (DNS hâlâ eski IP’ye gidebilir; Faz 3 sonrası netleşir)

---

## Faz 3A — Cloudflare (Seçenek A)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **eilcard.com**
2. **Overview** → sağ altta **Remove site from Cloudflare** (veya Zone Settings → Delete zone)
3. Onaylayın — tüm DNS kayıtları Cloudflare’de silinir

**Sonra Namecheap (Faz 4 ile birlikte):**
1. [Namecheap](https://ap.www.namecheap.com/) → Domain List → `eilcard.com` → Manage
2. **Nameservers** → **Namecheap BasicDNS** (Custom DNS / Cloudflare nameserver’ları kaldır)
3. Advanced DNS boş veya parking — **A kaydı eklemeyin** (site kapalı)

---

## Faz 4 — Namecheap e-posta

1. Private Email → subscription → **Cancel** / auto-renew off
2. `hello@`, `billing@`, `platform@`, `support@` alias’lar gider

---

## Faz 5 — Repo

- Kod `C:\digital_card` + GitHub’da kalır
- İsteğe bağlı: repo **Private**, README’de “Live service discontinued”

---

## Sinyalle etkisi (bilgi)

Kapatınca çalışmayı durdurur:
- `https://eilcard.com/api/v1/resolve?domain=sinyalle.com`
- Registry proxy well-known (varsa)
- `agent-gateway.eilcard.com`

Signal reposunda ayrı güncelleme gerekir.

---

## Hafıza kartı (kapatıldıktan sonra)

| Eski parça | Panel |
|------------|--------|
| VPS | DigitalOcean — silindi |
| DNS | Cloudflare zone — kaldırıldı |
| Domain | Namecheap — tutuldu / expire |
| E-posta | Namecheap Private Email — iptal |
| Kod | `C:\digital_card` + GitHub |
