import type { Locale } from "./types";

export type PricingCopy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  tierFree: string;
  tierVerified: string;
  tierPro: string;
  colFeature: string;
  rowCards: string;
  rowOrgCards: string;
  rowProducts: string;
  rowResolve: string;
  rowDns: string;
  rowVerifiedBadge: string;
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
  backHome: string;
};

export const pricingMessages: Record<Locale, PricingCopy> = {
  en: {
    metaTitle: "Pricing — EIL Card",
    metaDescription:
      "Free, Verified, and Pro plans for domain-verified entity identity in the EIL Card registry.",
    eyebrow: "Pricing",
    title: "Plans for verified entity identity",
    subtitle:
      "Limits sync with tier-limits.ts. Paid checkout launches with Polar; until then, contact support for upgrades.",
    tierFree: "Free",
    tierVerified: "Verified",
    tierPro: "Pro",
    colFeature: "Feature",
    rowCards: "Cards per account",
    rowOrgCards: "Organization cards",
    rowProducts: "Products per org card",
    rowResolve: "Resolve requests / month",
    rowDns: "DNS domain verification",
    rowVerifiedBadge: "verified: true (active subscription)",
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
    backHome: "← Back to home",
  },
  tr: {
    metaTitle: "Fiyatlandırma — EIL Card",
    metaDescription:
      "EIL Card registry için Ücretsiz, Verified ve Pro planları — domain doğrulamalı varlık kimliği.",
    eyebrow: "Fiyatlandırma",
    title: "Doğrulanmış varlık kimliği planları",
    subtitle:
      "Limitler tier-limits.ts ile senkron. Ücretli ödeme Polar ile açılacak; şimdilik yükseltme için destek ile iletişime geçin.",
    tierFree: "Ücretsiz",
    tierVerified: "Verified",
    tierPro: "Pro",
    colFeature: "Özellik",
    rowCards: "Hesap başına kart",
    rowOrgCards: "Kurum kartı",
    rowProducts: "Kurum kartı başına ürün",
    rowResolve: "Resolve isteği / ay",
    rowDns: "DNS domain doğrulama",
    rowVerifiedBadge: "verified: true (aktif abonelik)",
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
    backHome: "← Ana sayfaya dön",
  },
};
