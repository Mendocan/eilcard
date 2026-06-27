# EIL Card — Adoption playbook (#E)

> **Goal:** 40–50 verified cards from indie AI / agent developers (bottom-up traction).  
> **Updated:** June 2026

---

## North-star metric

| Metric | Target | Where to track |
|--------|--------|----------------|
| **Verified cards** | 50 | Admin → Overview → Adoption goal |
| Registered cards | 80+ | Admin → Cards |
| Resolve volume | Growing week-over-week | Admin → Analytics |

Verified = DNS proof + active subscription (public `verified: true`).

---

## Who to reach first

1. **Indie agent builders** — LangChain, CrewAI, LlamaIndex, Custom GPT authors
2. **Open-source maintainers** — projects that call external APIs and need entity trust
3. **SaaS with public identity** — already have a domain + product page
4. **Pilot story** — Sinyalle gateway (`sinyalle.com`) as live reference

Defer enterprise platform outreach until 50 verified cards and stable DevX (SDK, MCP, CLI, PyPI).

---

## Copy-paste outreach (DM / email)

### Short (Twitter / Discord)

> Building agents that touch real companies? Before scraping HTML, resolve the entity:
> `GET https://eilcard.com/api/v1/resolve?domain=example.com`
> Templates: https://eilcard.com/docs/agents — `pip install eil-card` or `@digitalcard/sdk`

### Medium (email / forum)

> Hi — I'm working on EIL Card: a registry + well-known layer so agents read **verified** entity JSON instead of guessing from search snippets.
>
> - Resolve: `DigitalCard.resolve({ domain })` (TS) or `pip install eil-card` (Python)
> - MCP tool `resolve_entity` for Cursor / Claude Desktop
> - Pilot: live gateway + `access_policy` ("robots.txt for agents") on Registry+
>
> If you ship agent tools, I'd love feedback on https://eilcard.com/docs/agents — free tier to publish a card, DNS verify for `verified: true`.

### For developers already on the registry

> Your card is live. Next steps agents expect:
> 1. Publish `/.well-known/digital-card` on your domain (dashboard shows the URL)
> 2. Registry+: set `capabilities.agent_gateway` if you expose OAuth read/act
> 3. Registry+: toggle `access_policy` in dashboard (pause agent access without deleting gateway)

---

## Weekly checklist

- [ ] Share the **3-step funnel** on `/docs/agents` (install → pilot → publish) in one agent-dev thread
- [ ] Post one concrete snippet (resolve timing, access_policy, or JWS verify) with link to `/docs/agents`
- [ ] Reply in 3 agent-dev threads with resolve example (not generic pitch)
- [ ] Invite 2 teams to create a card + DNS verify
- [ ] Review admin adoption counter; note blockers in `YAPILACAKLAR.md`

---

## Assets to share

| Asset | URL |
|-------|-----|
| Agent integration guide | `/docs/agents` |
| Playground | `/playground` |
| OpenAPI | `/openapi.yaml` |
| Pilot gateway docs | `docs/pilot-gateway-sinyalle.md` (repo) |
| Access policy spec | `docs/eil-access-policy-spec-v0.1.md` |
| PyPI | `pip install eil-card` |
| npm | `@digitalcard/sdk` |

---

## Success signals (qualitative)

- External repos importing `@digitalcard/sdk` or `eil-card`
- Unprompted cards created outside the team
- Resolve events on non-pilot domains
- Questions about `capabilities` / gateway OAuth (means agents are going past identity)

---

## Anti-patterns

- Pitching "SEO for AI" before showing resolve JSON
- Targeting big platforms before 50 verified indie cards
- Promising OAuth inside EIL Card core (gateway stays on platform)
