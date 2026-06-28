# EIL Card

Entity Identity Layer — verified org/person JSON for AI agents.

## What is EIL Card?

When AI agents need to identify a company or person, they often scrape web pages — slow, fragile, and sometimes wrong.

**EIL Card** provides a **verified identity record** bound to your domain:

- Agents read it in one call: `GET /api/v1/resolve?domain=example.com`
- DNS-backed `verified: true` trust signal
- Optional publish at `/.well-known/digital-card` on your domain

**It is not a payment card or user login.** SSL secures the connection; EIL certifies **meaning** — official name, contact, products.

| | |
|---|---|
| Website | https://eilcard.com |
| Agent integration | https://eilcard.com/docs/agents |
| Compliance checker | https://eilcard.com/playground |
| TypeScript SDK | `@digitalcard/sdk` |
| Python SDK | `pip install eil-card` |

Edition overview: [`docs/core-edition.md`](docs/core-edition.md)

## Live examples (Core edition)

**Pilot (customer)** — Sinyal 24 · Core · Verified  
- Card: https://eilcard.com/kart/sinyal24  
- Resolve: https://eilcard.com/api/v1/resolve?domain=sinyalle.com  

**Registry operator** — EIL Card · Core · Pro  
- Card: https://eilcard.com/kart/eilcard  
- Resolve: https://eilcard.com/api/v1/resolve?domain=eilcard.com  

**Demo (not in registry)** — themed layout only: https://eilcard.com/example

## Roadmap

Internal planning and edition roadmap: [`YAPILACAKLAR.md`](YAPILACAKLAR.md)
