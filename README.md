# EIL Card

Entity Identity Layer — verified org/person JSON for AI agents.

## EIL Card nedir?

AI agent'lar bir şirketi veya kişiyi tanımak istediğinde çoğu zaman web sayfasını tarar — yavaş, kırılgan, bazen yanlış.

**EIL Card**, domain'inize bağlı **doğrulanmış bir kimlik kaydı** sunar:

- Agent tek çağrıda okur: `GET /api/v1/resolve?domain=example.com`
- DNS ile doğrulanmış `verified: true` sinyali
- İsteğe bağlı `/.well-known/digital-card` ile domain üzerinde yayın

**Ödeme kartı veya kullanıcı girişi değildir.** SSL bağlantıyı güvenli kılar; EIL **anlamı** doğrular — resmi ad, iletişim, ürünler.

| | |
|---|---|
| Site | https://eilcard.com |
| Agent rehberi | https://eilcard.com/docs/agents |
| Uyumluluk testi | https://eilcard.com/playground |
| TypeScript SDK | `@digitalcard/sdk` |
| Python SDK | `pip install eil-card` |

Edition özeti: [`docs/core-edition.md`](docs/core-edition.md)

## Live examples (Core edition)

**Pilot (customer)** — Sinyal 24 · Core · Verified  
- Card: https://eilcard.com/kart/sinyal24  
- Resolve: https://eilcard.com/api/v1/resolve?domain=sinyalle.com  

**Registry operator** — EIL Card · Core · Pro  
- Card: https://eilcard.com/kart/eilcard  
- Resolve: https://eilcard.com/api/v1/resolve?domain=eilcard.com  

**Demo (not in registry)** — themed layout only: https://eilcard.com/example

## Roadmap

Internal planning and edition roadmap (Eksen 2): [`YAPILACAKLAR.md`](YAPILACAKLAR.md)
