# Dijital Kart — Deploy Rehberi (Namecheap VPS)

> Hedef: **Namecheap** (domain + VPS) + Docker + Caddy (otomatik SSL).  
> Sinyalle/Sinyal 24 ile aynı sağlayıcı → tek panel, az bağlam değişimi.  
> Docker'a aşinalık varsa **Coolify'a gerek yok** → doğrudan `docker-compose.prod.yml` (§4B).  
> Tahmini: ~$7–10/ay VPS + ~$12/yıl `.com` domain.

> **KVKK notu:** Namecheap VPS veri merkezleri Phoenix (ABD) ve **Amsterdam (EU)**.  
> KVKK için **Amsterdam** seçilmeli (EU; yurtdışı aktarım SCC ile — `is-plani.md` §C2).

---

## 0. Genel Bakış

```
İnternet → Namecheap DNS → VPS:443 (Caddy, otomatik SSL) → Docker (app:3000 + postgres + redis)
```

Üç bileşeni Namecheap üzerinden kuracağız:
1. **Domain** — Namecheap `.com` tescili
2. **VPS** — Namecheap VPS (Amsterdam) + Docker
3. **DNS + SSL** — Namecheap DNS (A kaydı) + VPS'te Caddy (Let's Encrypt)

> **Seçilen yol: §4B (düz docker-compose)** — Docker bilgisi olduğu için en şeffaf ve hızlısı.  
> Cloudflare (CDN/cache) opsiyoneldir; resolve trafiği büyüyünce §3'te eklenebilir.

---

## 1. Domain Tescili (Namecheap)

1. [namecheap.com](https://www.namecheap.com) → Domains → adını sorgula (`.com`)
2. Sepete ekle → ücretsiz WhoisGuard (gizlilik) açık kalsın
3. Satın al (~$10–15/yıl)

> DNS yönetimini Namecheap'te bırakacağız (§3). Cloudflare şart değil.

---

## 2. VPS Kurulumu (Namecheap)

### 2.1 Sunucu satın al

1. Namecheap → Hosting → **VPS** → Pulsar (2GB) veya üstü
2. **Data center: Amsterdam** (KVKK — EU)
3. **OS: Ubuntu 24.04 (Blank 64 Bit)** — cPanel YOK (Docker kullanacağız)
4. SSH erişim bilgileri e-posta ile gelir

> MVP için 2GB RAM yeterli (app + postgres + redis). Trafik artınca yükseltilebilir.

### 2.2 Sunucuya bağlan

```bash
ssh root@SUNUCU_IP
```

### 2.3 Docker kur

```bash
curl -fsSL https://get.docker.com | sh
docker --version
docker compose version
```

### 2.4 Güvenlik duvarı

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

---

## 3. DNS Ayarı (Namecheap)

1. Namecheap → Domain List → domainin yanında **Manage**
2. **Advanced DNS** sekmesi → Host Records → **Add New Record**:
   - Type: `A Record`, Host: `@`, Value: `SUNUCU_IP`, TTL: Automatic
   - Type: `A Record`, Host: `www`, Value: `SUNUCU_IP`, TTL: Automatic
3. Kaydet (yayılma birkaç dakika–saat)

> SSL'i VPS'te Caddy otomatik halledecek (§4B.4). Cloudflare gerekmez.

> **Opsiyonel — Cloudflare (sonra):** Resolve trafiği büyüyünce CDN/cache için
> nameserver'ları Cloudflare'e taşıyıp A kaydını proxy'li ekleyebilirsin
> (SSL modu: Full strict). MVP'de gerekli değil.

---

## 4B. docker-compose ile Deploy (Seçilen Yol)

### 4B.1 Kodu sunucuya al

```bash
git clone <REPO_URL> digital_card
cd digital_card
```

### 4B.2 Ortam değişkenlerini hazırla

```bash
cp .env.prod.example .env.prod
nano .env.prod   # değerleri doldur (güçlü şifreler!)
```

Güçlü değer üret:
```bash
openssl rand -base64 24   # POSTGRES_PASSWORD
openssl rand -base64 32   # BETTER_AUTH_SECRET
```

### 4B.3 Başlat

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Stack 4 servis: **caddy** (80/443, otomatik SSL) → **app** (3000, içeride) → **postgres** → **redis**.  
Başlangıç sırası: postgres (healthy) → migrate (şema) → app → caddy.

### 4B.4 SSL — otomatik (Caddy dahili)

SSL ayrı kurulum gerektirmez. `Caddyfile` + `APP_DOMAIN` ile Caddy,
Let's Encrypt sertifikasını otomatik alır ve yeniler.

Ön koşullar:
- §3'teki **A kaydı** domaini VPS IP'sine yönlendiriyor olmalı (sertifika doğrulaması için)
- 80 ve 443 portları açık (§2.4)

İlk istekte Caddy sertifikayı alır; birkaç saniye sürebilir.

---

## 5. Deploy Sonrası Kontrol

```bash
# Konteyner durumu
docker compose -f docker-compose.prod.yml ps

# App logları
docker compose -f docker-compose.prod.yml logs -f app

# Migration logları
docker compose -f docker-compose.prod.yml logs migrate
```

Tarayıcıdan test (kendi domainini koy):
- `https://DOMAIN` → landing
- `https://DOMAIN/register` → kayıt
- `https://DOMAIN/api/v1/resolve?domain=...` → resolve

---

## 6. Güncelleme (yeni sürüm)

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Migration container her başlangıçta `__migrations` tablosunu kontrol eder; yalnızca yeni `.sql` dosyalarını uygular (idempotent).

---

## 7. Yedekleme (önemli)

```bash
# Postgres yedeği
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U digitalcard digitalcard > backup_$(date +%F).sql
```

Cron ile günlük otomatik yedek + offsite kopya önerilir (KVKK §2.4).

---

## 8. Migration Üretme (geliştirme tarafı)

Şema değiştiğinde yerelde:

```bash
pnpm --filter @digitalcard/web db:generate   # yeni .sql üretir
git add apps/web/drizzle && git commit
```

Üretimde migrate container otomatik uygular.

---

## Maliyet Özeti

| Kalem | Tutar |
|-------|-------|
| VPS (Namecheap Pulsar, Amsterdam) | ~$7–10/ay |
| Domain (.com, Namecheap) | ~$12/yıl |
| SSL (Caddy/Let's Encrypt) | Ücretsiz |
| Resend (başlangıç) | Ücretsiz |
| **Toplam** | **~$7–10/ay + yıllık domain** |

---

## Sorun Giderme

| Belirti | Çözüm |
|---------|-------|
| `password authentication failed` | Postgres volume eski şifreyle kalmış → `down -v` ile sıfırla (DİKKAT: veri silinir) |
| App 502 | `docker compose logs app` — env eksik mi? |
| Migration çalışmadı | `docker compose logs migrate` — DATABASE_URL doğru mu? |
| SSL alınamıyor | A kaydı VPS IP'sine yönleniyor mu? 80/443 açık mı? `docker compose logs caddy` |
| Türkçe karakter bozuk | API UTF-8 ister; gerçek tarayıcı formu sorunsuz |

---

## Abonelik cron (grace / downgrade)

Polar webhook anlık plan günceller; süresi dolmuş abonelikler için günlük reconcile gerekir.

1. Repodaki script: `scripts/cron-subscription-reconcile.sh`
2. VPS'te çalıştırılabilir yap: `chmod +x /opt/digital_card/scripts/cron-subscription-reconcile.sh`
3. `.env.prod` içinde `CRON_SECRET` tanımlı olmalı (app ile aynı değer)
4. Crontab (her gün 03:00 UTC):

```bash
0 3 * * * /opt/digital_card/scripts/cron-subscription-reconcile.sh >> /var/log/eilcard-cron.log 2>&1
```

Manuel test:

```bash
CRON_SECRET="$(grep ^CRON_SECRET= /opt/digital_card/.env.prod | cut -d= -f2-)"
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://eilcard.com/api/cron/subscription-reconcile
```

### Grace pilot (Sinyalle)

DB-only simulation — Polar'a dokunmaz:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm migrate \
  node apps/web/scripts/simulate-subscription-lapse.mjs sinyal24 --grace-active

docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm migrate \
  node apps/web/scripts/simulate-subscription-lapse.mjs sinyal24 --grace-expired

/opt/digital_card/scripts/cron-subscription-reconcile.sh

docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm migrate \
  node apps/web/scripts/simulate-subscription-lapse.mjs sinyal24 --restore
```
