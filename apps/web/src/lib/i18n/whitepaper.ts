/** EIL Whitepaper v1.0 — EN/TR content (schema-aligned). */

export const whitepaperExampleJson = `{
  "schema_version": "1.0",
  "card_id": "example.com",
  "type": "organization",
  "handle": "example",
  "verified": true,
  "verification_method": ["dns"],
  "name": {
    "official": "Example Technology Inc.",
    "short": "Example"
  },
  "contact": {
    "email": "info@example.com",
    "website": "https://example.com"
  },
  "description": {
    "tagline": "Infrastructure for autonomous agents",
    "summary": "Canonical organization profile for AI agents — no HTML scraping required."
  },
  "products": [
    {
      "id": "agent-core",
      "name": "Agent Core API",
      "description": "High-throughput machine routing interface."
    }
  ],
  "same_as": ["https://github.com/example"],
  "updated_at": "2026-06-17T00:00:00.000Z",
  "human_url": "https://eilcard.com/kart/example",
  "registry_url": "https://eilcard.com/api/v1/cards/example"
}`;

export const whitepaperDiscoveryFlow = `[AI Agent / SDK]
   │
   ├── 1. Registry (primary)
   │      GET /api/v1/resolve?domain={domain}
   │
   ├── 2. Well-known (fallback + domain proof)
   │      GET https://{domain}/.well-known/digital-card
   │
   └── 3. DNS TXT (verification signal)
          _digital-card.{domain}`;

const whitepaperEn = {
  metaTitle: "EIL Whitepaper — Entity Identity Layer",
  metaDescription:
    "Technical whitepaper v1.0: verified machine-readable identity for autonomous AI agents — problem, architecture, schema, security, and roadmap.",
  eyebrow: "Whitepaper v1.0",
  title: "Entity Identity Layer (EIL)",
  subtitle: "Infrastructure for the Agent Web",
  tagline:
    "Verified, machine-readable identity for organizations and persons — domain-bound, agent-native, canonical.",
  version: "Version 1.0.0",
  author: "EIL Card / Sinyalle pilot",
  date: "June 2026",
  executiveSummaryTitle: "Executive summary",
  executiveSummary:
    "Today's web was built for human eyes: pages, layouts, and funnels. The agent era pushes autonomous systems to infer who an entity is from megabytes of HTML, SEO snippets, and search noise — wasting compute, amplifying hallucination risk, and weakening trust boundaries. Entity Identity Layer (EIL) introduces a domain-bound, machine-readable canonical record that agents read via resolve() in milliseconds. EIL is not a payment card or user login platform; it is identity infrastructure for the agent web.",
  problemTitle: "1. Problem statement",
  problemIntro:
    "Three structural limits in the human-centric web slow autonomous AI adoption:",
  problemItems: [
    {
      title: "Compute and energy waste",
      body: "Agents download, strip, and tokenize HTML, CSS, and JavaScript to learn an official name or product list — work that should be a single JSON read.",
    },
    {
      title: "Identity ambiguity",
      body: "TLS secures the pipe, not the meaning behind the domain. Without a verified entity layer, models guess from snippets and training noise.",
    },
    {
      title: "Structured data mismatch",
      body: "Schema.org helps search engines index pages for humans. It is not optimized as the primary trust boundary for agent function calling and registry-backed resolve().",
    },
  ],
  solutionTitle: "2. The solution: EIL",
  solutionBody:
    "EIL lets organizations publish one authoritative Digital Card: canonical JSON tied to a domain, exposed through a public registry and optional /.well-known/digital-card on the entity's own origin. Agents call DigitalCard.resolve({ domain }) or hit the registry API directly. Verified records expose verified: true after DNS (or other) attestation — a machine trust signal distinct from transport security.",
  architectureTitle: "3. Technical architecture & discovery",
  architectureIntro:
    "EIL uses a hybrid discovery model: registry for speed and indexing; well-known for domain-bound proof; DNS TXT for ownership verification. The TypeScript SDK tries registry first, then falls back to the domain well-known URL.",
  discoveryCaption: "Hybrid discovery flow (SDK resolve)",
  schemaTitle: "4. Data schema specification",
  schemaIntro:
    "EIL Card schema v1.0 discriminates organization and person profiles. The example below matches the live registry format — not a fictional alternate schema. Full reference: schema v1.0 and @digitalcard/sdk.",
  schemaCaption: "Organization card (illustrative — schema v1.0)",
  securityTitle: "5. Security & trust framework",
  securityIntro:
    "Trust is layered: transport (TLS), attestation (DNS verification), and canonical source (registry + synced well-known).",
  securityItems: [
    {
      title: "DNS domain verification",
      status: "live" as const,
      body: "Dashboard TXT challenge at _digital-card.{domain}. Verified cards expose verified: true and verification_method: [\"dns\"].",
    },
    {
      title: "Registry as authoritative source",
      status: "live" as const,
      body: "Registry updates first; domain well-known can proxy or mirror registry JSON (nginx proxy pattern). SDK compares updated_at when both surfaces exist.",
    },
    {
      title: "JSON Web Signatures (JWS)",
      status: "roadmap" as const,
      body: "Signed card payloads for tamper detection on self-hosted well-known — planned for schema v1.1.",
    },
    {
      title: "DNSSEC guidance",
      status: "roadmap" as const,
      body: "Enterprise hardening for TXT record integrity — documentation and optional verification, not required for MVP.",
    },
  ],
  statusLive: "Live",
  statusRoadmap: "Roadmap",
  ecosystemTitle: "6. Ecosystem integration & roadmap",
  ecosystemIntro: "Adoption surface shipped or planned:",
  roadmapItems: [
    {
      title: "Registry + SDK + well-known",
      status: "live" as const,
      body: "@digitalcard/sdk, eilcard.com registry API, dashboard discovery panel, agent-card.json template, llms.txt exports.",
    },
    {
      title: "Agent integration docs",
      status: "live" as const,
      body: "/docs/agents — system prompts and function-calling templates for OpenAI, Anthropic, and Gemini.",
    },
    {
      title: "Framework tools",
      status: "roadmap" as const,
      body: "LangChain EILResolveTool, LlamaIndex reader, OpenAPI spec, MCP resolve tools.",
    },
    {
      title: "Schema.org bridge",
      status: "roadmap" as const,
      body: "Optional resolve fallback that infers organization JSON from page JSON-LD when no EIL card exists — meta.source: schema.org-inferred, verified: false.",
    },
    {
      title: "Standards track",
      status: "roadmap" as const,
      body: "IANA well-known URI registration and Internet-Draft process after spec stabilization.",
    },
  ],
  conclusionTitle: "7. Conclusion",
  conclusion:
    "The web is gaining a machine-facing layer. Agents should not parse homepages to learn who stands behind a domain. EIL delivers verified, canonical entity JSON — the identity infrastructure for autonomous systems. The pilot is live at eilcard.com with domain-bound well-known on participating origins.",
  pilotLabel: "Live pilot",
  pilotBody: "Sinyal 24 (sinyalle.com) — resolve, well-known proxy, and agent discovery exports.",
  ctaPrimary: "Create your card",
  ctaSecondary: "Read agent integration guide",
  ctaDocs: "API documentation",
  backHome: "← Back to home",
    landingLink: "Read the EIL whitepaper (v1.0) →",
};

const whitepaperTr = {
  metaTitle: "EIL Whitepaper — Entity Identity Layer",
  metaDescription:
    "Teknik whitepaper v1.0: otonom AI agent'lar için doğrulanmış makine okunur kimlik — sorun, mimari, şema, güvenlik ve yol haritası.",
  eyebrow: "Whitepaper v1.0",
  title: "Entity Identity Layer (EIL)",
  subtitle: "Ajan Web'i için altyapı",
  tagline:
    "Kurum ve kişiler için doğrulanmış, makine okunur kimlik — domain'e bağlı, agent-native, canonical.",
  version: "Sürüm 1.0.0",
  author: "EIL Card / Sinyalle pilot",
  date: "Haziran 2026",
  executiveSummaryTitle: "Özet",
  executiveSummary:
    "Günümüz web'i insan gözü için tasarlandı: sayfalar, düzenler, huniler. Ajan çağında otonom sistemler, bir varlığın kim olduğunu megabaytlarca HTML, SEO snippet'leri ve arama gürültüsünden çıkarmaya zorlanıyor — bu da compute israfı, halüsinasyon riski ve zayıf güven sınırları demek. Entity Identity Layer (EIL), agent'ların resolve() ile milisaniyeler içinde okuduğu domain'e bağlı canonical JSON kaydı sunar. EIL ödeme kartı veya kullanıcı girişi değildir; agent web'i için kimlik altyapısıdır.",
  problemTitle: "1. Sorun tanımı",
  problemIntro:
    "İnsan odaklı web'deki üç yapısal sınır, otonom AI benimsenmesini yavaşlatır:",
  problemItems: [
    {
      title: "Compute ve enerji israfı",
      body: "Agent'lar resmi ad veya ürün listesi için HTML, CSS ve JavaScript indirip temizlemek zorunda — oysa bu tek bir JSON okuması olmalı.",
    },
    {
      title: "Kimlik belirsizliği",
      body: "TLS boruyu güvence altına alır, domain'in arkasındaki anlamı değil. Doğrulanmış varlık katmanı olmadan modeller snippet ve eğitim gürültüsünden tahmin eder.",
    },
    {
      title: "Yapılandırılmış veri uyumsuzluğu",
      body: "Schema.org arama motorlarının insanlar için indekslemesine yardımcı olur; agent function calling ve registry destekli resolve() için birincil güven sınırı olarak optimize değildir.",
    },
  ],
  solutionTitle: "2. Çözüm: EIL",
  solutionBody:
    "EIL, kurumların tek otoriter Digital Card yayınlamasını sağlar: domain'e bağlı canonical JSON, herkese açık registry ve isteğe bağlı kurumun kendi origin'inde /.well-known/digital-card. Agent'lar DigitalCard.resolve({ domain }) çağırır veya registry API'ye doğrudan gider. DNS (veya diğer) doğrulama sonrası verified: true makine güven sinyali sunar — taşıma güvenliğinden ayrıdır.",
  architectureTitle: "3. Teknik mimari ve keşif",
  architectureIntro:
    "EIL hibrit keşif kullanır: registry hız ve indeks; well-known domain kanıtı; DNS TXT sahiplik doğrulaması. TypeScript SDK önce registry'yi dener, sonra domain well-known URL'sine düşer.",
  discoveryCaption: "Hibrit keşif akışı (SDK resolve)",
  schemaTitle: "4. Veri şeması",
  schemaIntro:
    "EIL Card şema v1.0 kurum ve kişi profillerini ayırır. Aşağıdaki örnek canlı registry formatıyla uyumludur — kurgusal alternatif şema değildir. Tam referans: şema v1.0 ve @digitalcard/sdk.",
  schemaCaption: "Kurum kartı (örnek — şema v1.0)",
  securityTitle: "5. Güvenlik ve güven çerçevesi",
  securityIntro:
    "Güven katmanlıdır: taşıma (TLS), doğrulama (DNS), canonical kaynak (registry + senkron well-known).",
  securityItems: [
    {
      title: "DNS domain doğrulaması",
      status: "live" as const,
      body: "Panelde _digital-card.{domain} TXT doğrulaması. Doğrulanmış kartlar verified: true ve verification_method: [\"dns\"] sunar.",
    },
    {
      title: "Registry otoriter kaynak",
      status: "live" as const,
      body: "Önce registry güncellenir; domain well-known registry JSON'unu proxy veya yansıtabilir (nginx proxy modeli). SDK iki yüzey varsa updated_at karşılaştırır.",
    },
    {
      title: "JSON Web Signatures (JWS)",
      status: "roadmap" as const,
      body: "Self-host well-known için imzalı kart yükleri — şema v1.1 planında.",
    },
    {
      title: "DNSSEC rehberi",
      status: "roadmap" as const,
      body: "TXT bütünlüğü için kurumsal sertleştirme — MVP için zorunlu değil.",
    },
  ],
  statusLive: "Canlı",
  statusRoadmap: "Yol haritası",
  ecosystemTitle: "6. Ekosistem entegrasyonu ve yol haritası",
  ecosystemIntro: "Benimsenme yüzeyi — yayında veya planlanan:",
  roadmapItems: [
    {
      title: "Registry + SDK + well-known",
      status: "live" as const,
      body: "@digitalcard/sdk, eilcard.com registry API, panel keşif paneli, agent-card.json şablonu, llms.txt export'ları.",
    },
    {
      title: "Agent entegrasyon dokümantasyonu",
      status: "live" as const,
      body: "/docs/agents — OpenAI, Anthropic ve Gemini için sistem prompt ve function calling şablonları.",
    },
    {
      title: "Framework araçları",
      status: "roadmap" as const,
      body: "LangChain EILResolveTool, LlamaIndex reader, OpenAPI spec, MCP resolve araçları.",
    },
    {
      title: "Schema.org köprüsü",
      status: "roadmap" as const,
      body: "EIL kartı yoksa sayfa JSON-LD'sinden kurum JSON'u çıkaran opsiyonel resolve fallback — meta.source: schema.org-inferred, verified: false.",
    },
    {
      title: "Standartlaşma",
      status: "roadmap" as const,
      body: "Şema sabitlendikten sonra IANA well-known URI kaydı ve Internet-Draft süreci.",
    },
  ],
  conclusionTitle: "7. Sonuç",
  conclusion:
    "Web makineye dönük bir katman kazanıyor. Agent'lar bir domain'in arkasında kim olduğunu öğrenmek için ana sayfa parse etmemeli. EIL doğrulanmış canonical varlık JSON'u sunar — otonom sistemlerin kimlik altyapısı. Pilot eilcard.com'da canlı; katılımcı origin'lerde domain well-known proxy ile.",
  pilotLabel: "Canlı pilot",
  pilotBody: "Sinyal 24 (sinyalle.com) — resolve, well-known proxy ve agent keşif export'ları.",
  ctaPrimary: "Kartınızı oluşturun",
  ctaSecondary: "Agent entegrasyon rehberi",
  ctaDocs: "API dokümantasyonu",
  backHome: "← Ana sayfaya dön",
  landingLink: "EIL whitepaper'ı okuyun (v1.0) →",
};

export type WhitepaperMessages = typeof whitepaperEn;

export const whitepaperMessages = {
  en: whitepaperEn,
  tr: whitepaperTr,
};
