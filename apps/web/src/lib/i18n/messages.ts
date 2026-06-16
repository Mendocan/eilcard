import type { Locale } from "./types";

const en = {
  meta: {
    title: "EIL — Entity Identity Layer",
    description:
      "Domain-verified entity identity for AI agents. Canonical JSON in milliseconds — not a payment card.",
  },
  nav: {
    docs: "Documentation",
    dashboard: "Dashboard",
    signIn: "Sign in",
    getStarted: "Get started",
    github: "GitHub",
  },
  hero: {
    eyebrow: "Entity Identity Layer",
    title: "Verified identity for the agent era",
    subtitle:
      "EIL standardizes who an organization or person is — domain-bound, machine-readable, and authoritative. Agents resolve canonical facts in milliseconds without scraping your site.",
    ctaPrimary: "Create your card",
    ctaSecondary: "View on GitHub",
  },
  pillars: {
    title: "Infrastructure, not another card product",
    items: [
      {
        title: "Domain-attested",
        body: "DNS and email verification tie identity to the domain you already own.",
      },
      {
        title: "Agent-native",
        body: "Registry API and /.well-known/digital-card — built for resolve(), not browsers alone.",
      },
      {
        title: "Canonical by design",
        body: "One verified record replaces conflicting HTML, snippets, and hallucinated answers.",
      },
    ],
  },
  compare: {
    title: "SSL secures the pipe. EIL certifies the meaning.",
    ssl: {
      layer: "SSL / TLS",
      question: "Is the connection authentic? Does this server own the domain?",
      example: "Transport security",
    },
    eil: {
      layer: "EIL",
      question: "Who is this entity? Are phone, address, and official name correct?",
      example: "resolve(domain)",
    },
    footnote:
      "Agents do not choose between SSL and EIL — they choose between crawling the web or reading a verified registry record.",
  },
  notThis: {
    title: "Scope",
    not: "Not this",
    is: "This is",
    notItems: [
      "Payment or banking card",
      "User login / SSO platform",
      "Replacement for SSL/TLS",
      "Business-card networking app",
    ],
    isItems: [
      "Verified organization & person identity",
      "Single source of truth for agents",
      "Registry + well-known discovery",
      "Trust signal via verified: true",
    ],
  },
  discovery: {
    title: "Discovery stack",
    steps: [
      {
        title: "Registry (primary)",
        body: "GET /v1/resolve?domain= — indexed, fast, verification metadata",
      },
      {
        title: "Well-known (fallback)",
        body: "GET /.well-known/digital-card — RFC 8615, domain-bound",
      },
      {
        title: "DNS TXT (hint)",
        body: "_digital-card.{domain} — ownership proof and registry pointer",
      },
    ],
  },
  sdk: {
    title: "SDK",
    caption: "resolve in one call",
  },
  footer: {
    tagline: "Entity identity for machines — not user login.",
    product: "EIL Card",
    about: "About",
    github: "GitHub",
    copyright: "© 2026 EIL Card",
  },
  about: {
    metaTitle: "About — EIL Card",
    metaDescription:
      "EIL (Entity Identity Layer) — domain-verified identity for AI agents.",
    eyebrow: "About",
    title: "EIL Card",
    expansion: "EIL — Entity Identity Layer",
    intro:
      "EIL Card is a registry and discovery layer for verified organization and person identity. Agents call resolve() to read canonical JSON tied to a domain — without scraping HTML or guessing from search results.",
    notTitle: "What EIL is not",
    notItems: [
      "A payment or banking card",
      "User login or SSO",
      "A replacement for SSL/TLS",
      "A business-card networking app",
    ],
    isTitle: "What EIL is",
    isItems: [
      "Domain-verified entity identity",
      "Machine-readable registry + well-known discovery",
      "Trust signal via verified records",
      "Open SDK and schema for integrators",
    ],
    contactTitle: "Contact",
    contactBody:
      "We do not publish a public support email. Use GitHub Issues on the project repository for bugs, ideas, and integration questions.",
    backHome: "← Back to home",
  },
  admin: {
    title: "Admin",
    loginTitle: "Admin access",
    loginSubtitle: "Platform operations console",
    password: "Password",
    signIn: "Sign in",
    signOut: "Sign out",
    invalidPassword: "Invalid password",
    notConfigured: "Admin is not configured on this server.",
    overview: "Overview",
    users: "Users",
    cards: "Cards",
    verified: "Verified",
    resolvesToday: "Resolves today",
    recentCards: "Recent cards",
    recentUsers: "Recent users",
    handle: "Handle",
    domain: "Domain",
    email: "Email",
    created: "Created",
    type: "Type",
    status: "Status",
    yes: "Yes",
    no: "No",
  },
} ;

export type Messages = typeof en;

const tr: Messages = {
  meta: {
    title: "EIL — Entity Identity Layer",
    description:
      "AI agent'lar için domain doğrulamalı varlık kimliği. Milisaniyeler içinde canonical JSON — ödeme kartı değil.",
  },
  nav: {
    docs: "Dokümantasyon",
    dashboard: "Panel",
    signIn: "Giriş",
    getStarted: "Başlayın",
    github: "GitHub",
  },
  hero: {
    eyebrow: "Entity Identity Layer",
    title: "Agent çağı için doğrulanmış kimlik",
    subtitle:
      "EIL, kurum ve kişinin kim olduğunu standartlaştırır — domain'e bağlı, makine okunur ve otoritatif. Agent'lar sitenizi taramadan canonical bilgiyi milisaniyeler içinde çözer.",
    ctaPrimary: "Kartınızı oluşturun",
    ctaSecondary: "GitHub'da görün",
  },
  pillars: {
    title: "Altyapı katmanı — bir kart ürünü değil",
    items: [
      {
        title: "Domain onaylı",
        body: "DNS ve e-posta doğrulaması kimliği sahip olduğunuz domain'e bağlar.",
      },
      {
        title: "Agent-native",
        body: "Registry API ve /.well-known/digital-card — resolve() için tasarlandı.",
      },
      {
        title: "Canonical tasarım",
        body: "Tek doğrulanmış kayıt; çelişkili HTML, snippet ve halüsinasyonun yerini alır.",
      },
    ],
  },
  compare: {
    title: "SSL boruyu güvence altına alır. EIL anlamı sertifikalar.",
    ssl: {
      layer: "SSL / TLS",
      question: "Bağlantı güvenli mi? Sunucu bu domain'e ait mi?",
      example: "Taşıma güvenliği",
    },
    eil: {
      layer: "EIL",
      question: "Bu varlık kim? Telefon, adres ve resmî ad doğru mu?",
      example: "resolve(domain)",
    },
    footnote:
      "Agent'lar SSL ile EIL arasında seçim yapmaz — web taraması ile doğrulanmış kayıt arasında seçim yapar.",
  },
  notThis: {
    title: "Kapsam",
    not: "Değil",
    is: "Budur",
    notItems: [
      "Ödeme veya banka kartı",
      "Kullanıcı girişi / SSO platformu",
      "SSL/TLS alternatifi",
      "Kartvizit / networking uygulaması",
    ],
    isItems: [
      "Doğrulanmış kurum ve kişi kimliği",
      "Agent'lar için tek bilgi kaynağı",
      "Registry + well-known keşif",
      "verified: true güven sinyali",
    ],
  },
  discovery: {
    title: "Keşif katmanları",
    steps: [
      {
        title: "Registry (birincil)",
        body: "GET /v1/resolve?domain= — indeksli, hızlı, doğrulama metadata",
      },
      {
        title: "Well-known (fallback)",
        body: "GET /.well-known/digital-card — RFC 8615, domain bağlı",
      },
      {
        title: "DNS TXT (ipucu)",
        body: "_digital-card.{domain} — sahiplik kanıtı ve registry yönlendirmesi",
      },
    ],
  },
  sdk: {
    title: "SDK",
    caption: "tek çağrıda resolve",
  },
  footer: {
    tagline: "Makine kimliği — kullanıcı girişi değil.",
    product: "EIL Card",
    about: "Hakkında",
    github: "GitHub",
    copyright: "© 2026 EIL Card",
  },
  about: {
    metaTitle: "Hakkında — EIL Card",
    metaDescription:
      "EIL (Entity Identity Layer) — AI agent'lar için domain doğrulamalı kimlik.",
    eyebrow: "Hakkında",
    title: "EIL Card",
    expansion: "EIL — Entity Identity Layer",
    intro:
      "EIL Card, doğrulanmış kurum ve kişi kimliği için bir registry ve keşif katmanıdır. Agent'lar domain'e bağlı canonical JSON'u HTML taramadan resolve() ile okur.",
    notTitle: "EIL ne değildir",
    notItems: [
      "Ödeme veya banka kartı",
      "Kullanıcı girişi / SSO",
      "SSL/TLS alternatifi",
      "Kartvizit / networking uygulaması",
    ],
    isTitle: "EIL nedir",
    isItems: [
      "Domain doğrulamalı varlık kimliği",
      "Makine okunur registry + well-known keşif",
      "Doğrulanmış kayıtlarla güven sinyali",
      "Entegratörler için açık SDK ve şema",
    ],
    contactTitle: "İletişim",
    contactBody:
      "Herkese açık destek e-postası yayınlamıyoruz. Hata, fikir ve entegrasyon soruları için GitHub Issues kullanın.",
    backHome: "← Ana sayfaya dön",
  },
  admin: {
    title: "Admin",
    loginTitle: "Yönetici erişimi",
    loginSubtitle: "Platform operasyon konsolu",
    password: "Şifre",
    signIn: "Giriş yap",
    signOut: "Çıkış",
    invalidPassword: "Geçersiz şifre",
    notConfigured: "Bu sunucuda admin yapılandırılmamış.",
    overview: "Genel bakış",
    users: "Kullanıcılar",
    cards: "Kartlar",
    verified: "Doğrulanmış",
    resolvesToday: "Bugünkü resolve",
    recentCards: "Son kartlar",
    recentUsers: "Son kullanıcılar",
    handle: "Handle",
    domain: "Domain",
    email: "E-posta",
    created: "Oluşturulma",
    type: "Tür",
    status: "Durum",
    yes: "Evet",
    no: "Hayır",
  },
};

export const messages: Record<Locale, Messages> = { en, tr };

export function t(locale: Locale): Messages {
  return messages[locale];
}
