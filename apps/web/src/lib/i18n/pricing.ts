import type { Locale } from "./types";

export type PricingEditionId = "core" | "business" | "registry_plus";

export type PricingEditionCopy = {
  name: string;
  schema: string;
  minPlan: string;
  summary: string;
  features: string[];
  audience: string;
};

export type PricingCopy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  subtitleLive: string;
  editionsTitle: string;
  editionsIntro: string;
  editionRoadmap: string;
  editions: Record<PricingEditionId, PricingEditionCopy>;
  plansTitle: string;
  plansIntro: string;
  tierFree: string;
  tierVerified: string;
  tierPro: string;
  colFeature: string;
  rowCards: string;
  rowOrgCards: string;
  rowProducts: string;
  rowOfferings: string;
  rowEditions: string;
  rowResolve: string;
  rowDns: string;
  rowVerifiedBadge: string;
  editionCoreOnly: string;
  editionCoreBusiness: string;
  editionAll: string;
  perMonth: string;
  included: string;
  comingSoon: string;
  churnTitle: string;
  churnIntro: string;
  churnItems: string[];
  churnNote: string;
  ctaTitle: string;
  ctaBody: string;
  ctaRegister: string;
  checkoutVerified: string;
  checkoutPro: string;
  checkoutSignIn: string;
  backDashboard: string;
  backHome: string;
};

export const pricingMessages: Record<Locale, PricingCopy> = {
  en: {
    metaTitle: "Pricing — EIL Card",
    metaDescription:
      "Core, Business, and Registry+ card editions. Verified and Pro subscriptions unlock trust, limits, and richer schemas.",
    eyebrow: "Pricing",
    title: "Card editions and subscription plans",
    subtitle:
      "Choose a card edition for agent-ready content, then a subscription for trust signals and registry capacity. Limits sync with tier-limits.ts.",
    subtitleLive:
      "Choose a card edition in the dashboard, then subscribe via Polar for verified: true and higher limits. Manage billing from your dashboard.",
    editionsTitle: "Card editions (what agents read)",
    editionsIntro:
      "Editions define schema richness — products, offerings, and future enterprise fields. Your subscription unlocks which editions you can publish.",
    editionRoadmap: "Roadmap",
    editions: {
      core: {
        name: "Core",
        schema: "Schema v1.0",
        minPlan: "Free · verified badge needs Verified+",
        summary:
          "Single brand or pilot: identity, summary, products[], links, and same_as profiles.",
        features: [
          "name, contact, description",
          "products[] catalog",
          "actions[] and same_as[]",
          "DNS verification (with paid plan)",
        ],
        audience: "SMBs, pilots, one primary brand",
      },
      business: {
        name: "Business",
        schema: "Schema v1.1",
        minPlan: "Verified or Pro",
        summary:
          "Holdings and multi-line orgs: nested offerings hierarchy plus content language.",
        features: [
          "Everything in Core",
          "offerings[] business lines",
          "content_locale for card language",
          "Higher product/offering quotas",
        ],
        audience: "Holdings, agencies, rich catalogs",
      },
      registry_plus: {
        name: "Registry+",
        schema: "Schema v1.2",
        minPlan: "Pro + enterprise add-on",
        summary:
          "High-trust registry: cryptographic attestation and agent tooling for regulated use cases.",
        features: [
          "Everything in Business",
          "JWS signature field",
          "MCP resolve tools (@digitalcard/mcp)",
          "SLA and priority support (contract)",
        ],
        audience: "Finance, public sector, high assurance",
      },
    },
    plansTitle: "Subscriptions (trust and limits)",
    plansIntro:
      "Subscriptions renew registry authority — verified badge, resolve quota, card count, and which editions you can use. Checkout uses existing Verified and Pro products; no separate SKU per edition.",
    tierFree: "Free",
    tierVerified: "Verified",
    tierPro: "Pro",
    colFeature: "Feature",
    rowCards: "Cards per account",
    rowOrgCards: "Organization cards",
    rowProducts: "Products per org card",
    rowOfferings: "Offerings per org card (Business)",
    rowEditions: "Card editions",
    rowResolve: "Resolve requests / month",
    rowDns: "DNS domain verification",
    rowVerifiedBadge: "verified: true (active subscription)",
    editionCoreOnly: "Core",
    editionCoreBusiness: "Core, Business",
    editionAll: "Core, Business, Registry+",
    perMonth: "/ month",
    included: "Included",
    comingSoon: "Checkout soon",
    churnTitle: "When a paid subscription ends",
    churnIntro:
      "You keep your account and card data. Trust and capacity depend on an active subscription that renews on schedule:",
    churnItems: [
      "Grace period (typically 14–30 days) with full access while we remind you to renew.",
      "After grace, your effective plan downgrades to Free limits (resolve quota, card count, products).",
      "The verified: true trust signal requires an active paid plan plus DNS attestation — it is not permanent after lapse.",
      "Public JSON and well-known export remain available; registry listing may be rate-limited.",
      "You may export canonical JSON and self-host /.well-known/digital-card on your domain.",
    ],
    churnNote:
      "Exact grace length and billing terms will appear in checkout and the Refund Policy before you pay.",
    ctaTitle: "Ready to register?",
    ctaBody: "Create a free account, publish a card, and start DNS verification from the dashboard.",
    ctaRegister: "Create account",
    checkoutVerified: "Subscribe — Verified",
    checkoutPro: "Subscribe — Pro",
    checkoutSignIn: "Sign in to subscribe",
    backDashboard: "Back to dashboard",
    backHome: "← Back to home",
  },
  tr: {
    metaTitle: "Fiyatlandırma — EIL Card",
    metaDescription:
      "Core, Business ve Registry+ kart edition'ları. Verified ve Pro abonelikleri güven, limit ve zengin şemayı açar.",
    eyebrow: "Fiyatlandırma",
    title: "Kart edition'ları ve abonelik planları",
    subtitle:
      "Agent'lar için kart zenginliğini edition ile seçin; güven sinyali ve registry kapasitesi için abonelik. Limitler tier-limits.ts ile senkron.",
    subtitleLive:
      "Panelden kart edition'ını seçin, verified: true ve yüksek limitler için Polar ile abone olun — faturalandırmayı panelden yönetin.",
    editionsTitle: "Kart edition'ları (agent'ların okuduğu katman)",
    editionsIntro:
      "Edition'lar şema zenginliğini belirler — ürünler, offerings ve ileride enterprise alanlar. Aboneliğiniz hangi edition'ları yayınlayabileceğinizi açar.",
    editionRoadmap: "Yol haritası",
    editions: {
      core: {
        name: "Core",
        schema: "Şema v1.0",
        minPlan: "Ücretsiz · rozet için Verified+",
        summary:
          "Tek marka veya pilot: kimlik, özet, products[], linkler ve same_as profilleri.",
        features: [
          "name, contact, description",
          "products[] katalog",
          "actions[] ve same_as[]",
          "DNS doğrulama (ücretli planda)",
        ],
        audience: "KOBİ, pilot, tek ana marka",
      },
      business: {
        name: "Business",
        schema: "Şema v1.1",
        minPlan: "Verified veya Pro",
        summary:
          "Holding ve çok iş kolu: iç içe offerings hiyerarşisi ve kart içeriği dili.",
        features: [
          "Core'daki her şey",
          "offerings[] iş kolu ağacı",
          "content_locale kart dili",
          "Daha yüksek ürün/offering kotası",
        ],
        audience: "Holding, ajans, zengin katalog",
      },
      registry_plus: {
        name: "Registry+",
        schema: "Şema v1.2",
        minPlan: "Pro + enterprise eklenti",
        summary:
          "Yüksek güven registry: kriptografik doğrulama ve agent araçları (regülasyonlu senaryolar).",
        features: [
          "Business'taki her şey",
          "JWS imza alanı",
          "MCP resolve araçları (@digitalcard/mcp)",
          "SLA ve öncelikli destek (sözleşme)",
        ],
        audience: "Finans, kamu, yüksek güvence",
      },
    },
    plansTitle: "Abonelikler (güven ve limitler)",
    plansIntro:
      "Abonelikler registry otoritesini yeniler — verified rozeti, resolve kotası, kart sayısı ve kullanılabilir edition'lar. Ödeme mevcut Verified ve Pro ürünleriyle; edition başına ayrı SKU yok.",
    tierFree: "Ücretsiz",
    tierVerified: "Verified",
    tierPro: "Pro",
    colFeature: "Özellik",
    rowCards: "Hesap başına kart",
    rowOrgCards: "Kurum kartı",
    rowProducts: "Kurum kartı başına ürün",
    rowOfferings: "Kurum kartı başına offering (Business)",
    rowEditions: "Kart edition'ları",
    rowResolve: "Resolve isteği / ay",
    rowDns: "DNS domain doğrulama",
    rowVerifiedBadge: "verified: true (aktif abonelik)",
    editionCoreOnly: "Core",
    editionCoreBusiness: "Core, Business",
    editionAll: "Core, Business, Registry+",
    perMonth: "/ ay",
    included: "Dahil",
    comingSoon: "Ödeme yakında",
    churnTitle: "Ücretli abonelik sona erdiğinde",
    churnIntro:
      "Hesabınız ve kart verileriniz kalır. Güven ve kapasite, yenilenen aktif aboneliğe bağlıdır:",
    churnItems: [
      "Grace dönemi (genelde 14–30 gün): tam erişim devam eder, yenileme hatırlatmaları gönderilir.",
      "Grace sonrası efektif plan Ücretsiz limitlere düşer (resolve kotası, kart sayısı, ürün).",
      "verified: true güven sinyali aktif ücretli plan + DNS doğrulaması gerektirir — süre bitince kalıcı değildir.",
      "Herkese açık JSON ve well-known export kullanılabilir; registry listeleme kotaya tabi olabilir.",
      "Canonical JSON export edip domain'inizde /.well-known/digital-card barındırabilirsiniz.",
    ],
    churnNote:
      "Grace süresi ve faturalandırma koşulları ödeme öncesinde checkout ve İade Politikası'nda netleşecektir.",
    ctaTitle: "Kayıt olmaya hazır mısınız?",
    ctaBody: "Ücretsiz hesap açın, kart yayınlayın ve panelden DNS doğrulamasına başlayın.",
    ctaRegister: "Hesap oluştur",
    checkoutVerified: "Abone ol — Verified",
    checkoutPro: "Abone ol — Pro",
    checkoutSignIn: "Abone olmak için giriş yapın",
    backDashboard: "Panele dön",
    backHome: "← Ana sayfaya dön",
  },
};
