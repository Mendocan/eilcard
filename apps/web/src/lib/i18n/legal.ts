import type { Locale } from "./types";

export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export type LegalDocument = {
  metaTitle: string;
  metaDescription: string;
  title: string;
  updated: string;
  sections: LegalSection[];
};

export type LegalMessages = {
  terms: LegalDocument;
  privacy: LegalDocument;
  refund: LegalDocument;
  backHome: string;
};

export const legalMessages: Record<Locale, LegalMessages> = {
  en: {
    backHome: "← Back to home",
    terms: {
      metaTitle: "Terms of Service — EIL Card",
      metaDescription: "Terms for using the EIL Card registry and related services.",
      title: "Terms of Service",
      updated: "Last updated: 19 June 2026",
      sections: [
        {
          title: "1. Service",
          paragraphs: [
            "EIL Card (“EIL”, “we”, “service”) provides a registry and discovery layer for organization and person identity records (“Digital Cards”). The service includes a dashboard, public card pages, resolve API, optional well-known mirroring guidance, and domain verification workflows.",
            "EIL is not a payment card, bank product, user login provider for third-party sites, or a replacement for HTTPS transport security.",
          ],
        },
        {
          title: "2. Accounts",
          paragraphs: [
            "You must provide accurate registration information and keep your credentials secure. The account owner is the person responsible for billing and dashboard access.",
            "Organization or person identity is defined when you create a Digital Card, not at account registration.",
          ],
        },
        {
          title: "3. Subscriptions and verified status",
          paragraphs: [
            "Free and paid tiers have different limits (cards, products, resolve quota). Paid plans are billed on a subscription basis when checkout is enabled.",
            "The verified field and verification_method in public JSON indicate that EIL has attested domain control (e.g. DNS TXT) and, for paid tiers, that an active subscription is in good standing. Verified status is time-bound and may lapse when a subscription ends or when material identity data (such as domain) changes without re-verification.",
            "We may change plan limits with reasonable notice; published limits at /pricing reflect the current configuration.",
          ],
        },
        {
          title: "4. Your content and export",
          paragraphs: [
            "You retain rights to the factual content you submit. You grant EIL a license to host, display, and distribute your Digital Card JSON through the registry, resolve API, and related discovery surfaces for the purpose of operating the service.",
            "You may export canonical JSON and publish /.well-known/digital-card on your own domain. Self-hosted copies may become stale if not synced with the registry.",
          ],
        },
        {
          title: "5. Acceptable use",
          paragraphs: [
            "You may not use EIL to impersonate others, publish fraudulent identity claims, abuse rate limits, attempt unauthorized access, or violate applicable law.",
            "We may suspend accounts or remove cards that violate these terms or pose abuse or legal risk.",
          ],
        },
        {
          title: "6. Disclaimer and liability",
          paragraphs: [
            "The service is provided “as is”. EIL does not guarantee uninterrupted availability. Agents and integrators should treat verified as one signal among others appropriate to their trust model.",
            "To the extent permitted by law, EIL’s liability is limited to fees paid in the twelve months before the claim.",
          ],
        },
        {
          title: "7. Contact",
          paragraphs: [
            "Questions about these terms: support@eilcard.com. Billing: billing@eilcard.com (or support@ when billing alias is unavailable).",
          ],
        },
      ],
    },
    privacy: {
      metaTitle: "Privacy Policy — EIL Card",
      metaDescription: "How EIL Card collects and uses personal and card data.",
      title: "Privacy Policy",
      updated: "Last updated: 19 June 2026",
      sections: [
        {
          title: "1. Data we collect",
          paragraphs: [
            "Account data: name, email, authentication credentials (hashed), session metadata.",
            "Card data: handles, domains, JSON body fields you submit, verification records, resolve analytics aggregates.",
            "Technical data: IP address, user agent, and logs for security, rate limiting, and abuse prevention.",
          ],
        },
        {
          title: "2. How we use data",
          paragraphs: [
            "To operate the registry, dashboard, verification workflows, billing (when enabled), and support.",
            "Public card fields you publish are intentionally world-readable via /kart, resolve API, and well-known discovery.",
          ],
        },
        {
          title: "3. Sharing",
          paragraphs: [
            "We use infrastructure providers (hosting, email). Payment processing will use Polar when checkout launches. We do not sell personal data.",
            "We may disclose data if required by law or to protect the service and users.",
          ],
        },
        {
          title: "4. Retention",
          paragraphs: [
            "Account and card data are kept while your account is active. You may request deletion by contacting support. Backups may retain data for a limited period.",
          ],
        },
        {
          title: "5. Your rights",
          paragraphs: [
            "Depending on your jurisdiction (including GDPR/KVKK where applicable), you may request access, correction, or deletion of personal data. Contact support@eilcard.com.",
          ],
        },
        {
          title: "6. Contact",
          paragraphs: ["Privacy questions: support@eilcard.com"],
        },
      ],
    },
    refund: {
      metaTitle: "Refund Policy — EIL Card",
      metaDescription: "Cancellation, renewal, and refund terms for EIL Card subscriptions.",
      title: "Refund Policy",
      updated: "Last updated: 19 June 2026",
      sections: [
        {
          title: "1. Subscriptions",
          paragraphs: [
            "Paid plans (Verified, Pro) renew automatically when billing is enabled through our payment provider unless you cancel before renewal.",
            "Prices and billing intervals will be shown at checkout before you pay.",
          ],
        },
        {
          title: "2. Cancellation and grace",
          paragraphs: [
            "You may cancel renewal through the customer billing portal when available, or by emailing billing@eilcard.com.",
            "After cancellation, access typically continues until the end of the paid period, followed by a grace window (planned 14–30 days) with reminders. After grace, your account downgrades to Free tier limits and verified attestation may lapse as described on /pricing.",
          ],
        },
        {
          title: "3. Refunds",
          paragraphs: [
            "If you are unsatisfied, contact billing@eilcard.com within 14 days of initial purchase for the same plan tier. We will review good-faith refund requests; abuse or chargeback fraud may result in account closure.",
            "Partial refunds for unused time after the refund window are generally not offered unless required by law.",
          ],
        },
        {
          title: "4. Chargebacks",
          paragraphs: [
            "Please contact us before disputing a charge with your bank. Unresolved chargebacks may lead to suspension.",
          ],
        },
        {
          title: "5. Contact",
          paragraphs: ["Billing and refunds: billing@eilcard.com"],
        },
      ],
    },
  },
  tr: {
    backHome: "← Ana sayfaya dön",
    terms: {
      metaTitle: "Hizmet Koşulları — EIL Card",
      metaDescription: "EIL Card registry ve ilgili hizmetlerin kullanım koşulları.",
      title: "Hizmet Koşulları",
      updated: "Son güncelleme: 19 Haziran 2026",
      sections: [
        {
          title: "1. Hizmet",
          paragraphs: [
            "EIL Card (“EIL”, “biz”, “hizmet”), kurum ve kişi kimlik kayıtları (“Digital Card”) için registry ve keşif katmanı sunar. Hizmet; panel, herkese açık kart sayfaları, resolve API, isteğe bağlı well-known rehberi ve domain doğrulama akışlarını içerir.",
            "EIL bir ödeme kartı, banka ürünü, üçüncü taraf siteler için SSO veya HTTPS taşıma güvenliği yerine geçmez.",
          ],
        },
        {
          title: "2. Hesaplar",
          paragraphs: [
            "Kayıt bilgilerinizin doğru olması ve kimlik bilgilerinizin güvenliği sizin sorumluluğunuzdadır. Hesap sahibi, faturalandırma ve panele erişimden sorumlu kişidir.",
            "Kurum veya kişi kimliği, hesap açılışında değil Digital Card oluşturulurken tanımlanır.",
          ],
        },
        {
          title: "3. Abonelik ve verified durumu",
          paragraphs: [
            "Ücretsiz ve ücretli planların limitleri farklıdır (kart, ürün, resolve kotası). Ödeme açıldığında ücretli planlar abonelik esaslı faturalandırılır.",
            "Herkese açık JSON’daki verified alanı ve verification_method, EIL’in domain kontrolünü (ör. DNS TXT) ve ücretli planlarda aktif aboneliği teyit ettiğini gösterir. Verified durumu sürelidir; abonelik biter veya domain gibi kritik veri yeniden doğrulanmadan değişirse sona erebilir.",
            "Plan limitlerini makul bildirimle güncelleyebiliriz; güncel limitler /pricing sayfasındadır.",
          ],
        },
        {
          title: "4. İçerik ve export",
          paragraphs: [
            "Gönderdiğiniz içeriğin hakları sizde kalır. EIL’e registry, resolve API ve keşif yüzeyleri üzerinden kart JSON’unuzu barındırma ve dağıtma lisansı verirsiniz.",
            "Canonical JSON export edebilir ve kendi domain’inizde /.well-known/digital-card yayınlayabilirsiniz. Self-host kopyalar senkronize edilmezse eskiyebilir.",
          ],
        },
        {
          title: "5. Kabul edilebilir kullanım",
          paragraphs: [
            "Başkalarını taklit etmek, sahte kimlik iddiası, kota kötüye kullanımı, yetkisiz erişim veya yasa dışı kullanım yasaktır.",
            "Bu koşulları ihlal eden veya risk oluşturan hesap/kartları askıya alabilir veya kaldırabiliriz.",
          ],
        },
        {
          title: "6. Sorumluluk",
          paragraphs: [
            "Hizmet “olduğu gibi” sunulur. Kesintisiz erişim garanti edilmez. Entegratörler verified’ı kendi güven modeline uygun sinyallerden biri olarak değerlendirmelidir.",
            "Yasanın izin verdiği ölçüde sorumluluk, talepten önceki on iki ayda ödenen ücretlerle sınırlıdır.",
          ],
        },
        {
          title: "7. İletişim",
          paragraphs: [
            "Koşullar hakkında: support@eilcard.com. Faturalandırma: billing@eilcard.com (alias yoksa support@).",
          ],
        },
      ],
    },
    privacy: {
      metaTitle: "Gizlilik Politikası — EIL Card",
      metaDescription: "EIL Card kişisel ve kart verilerini nasıl toplar ve kullanır.",
      title: "Gizlilik Politikası",
      updated: "Son güncelleme: 19 Haziran 2026",
      sections: [
        {
          title: "1. Topladığımız veriler",
          paragraphs: [
            "Hesap: ad, e-posta, kimlik bilgileri (hash), oturum meta verileri.",
            "Kart: handle, domain, gönderdiğiniz JSON alanları, doğrulama kayıtları, resolve istatistikleri.",
            "Teknik: IP, user agent, güvenlik ve rate limit logları.",
          ],
        },
        {
          title: "2. Kullanım",
          paragraphs: [
            "Registry, panel, doğrulama, faturalandırma (açıldığında) ve destek için.",
            "Yayınladığınız kart alanları /kart, resolve API ve well-known ile kasıtlı olarak herkese açıktır.",
          ],
        },
        {
          title: "3. Paylaşım",
          paragraphs: [
            "Barındırma ve e-posta altyapı sağlayıcıları kullanılır. Ödeme Polar ile yapılacaktır. Kişisel veri satılmaz.",
            "Yasa gereği veya hizmeti korumak için açıklama yapılabilir.",
          ],
        },
        {
          title: "4. Saklama",
          paragraphs: [
            "Hesap ve kart verileri hesap aktifken saklanır. Silme talebi için support@eilcard.com. Yedekler sınırlı süre tutulabilir.",
          ],
        },
        {
          title: "5. Haklarınız",
          paragraphs: [
            "GDPR/KVKK kapsamında erişim, düzeltme veya silme talep edebilirsiniz: support@eilcard.com.",
          ],
        },
        {
          title: "6. İletişim",
          paragraphs: ["Gizlilik: support@eilcard.com"],
        },
      ],
    },
    refund: {
      metaTitle: "İade Politikası — EIL Card",
      metaDescription: "EIL Card abonelik iptali, yenileme ve iade koşulları.",
      title: "İade Politikası",
      updated: "Son güncelleme: 19 Haziran 2026",
      sections: [
        {
          title: "1. Abonelikler",
          paragraphs: [
            "Ücretli planlar (Verified, Pro), iptal edilmediği sürece ödeme sağlayıcı üzerinden otomatik yenilenir.",
            "Fiyat ve dönem checkout ekranında ödeme öncesi gösterilir.",
          ],
        },
        {
          title: "2. İptal ve grace",
          paragraphs: [
            "Müşteri portalından veya billing@eilcard.com ile yenilemeyi iptal edebilirsiniz.",
            "İptal sonrası genelde ödenen dönem sonuna kadar erişim devam eder; ardından planlanan 14–30 günlük grace ve hatırlatmalar gelir. Grace sonrası Ücretsiz limitler ve verified durumu /pricing’de anlatıldığı gibi düşebilir.",
          ],
        },
        {
          title: "3. İadeler",
          paragraphs: [
            "Memnun kalmazsanız, aynı plan için satın almadan sonraki 14 gün içinde billing@eilcard.com yazın. Kötü niyetli chargeback hesap kapatılmasına yol açabilir.",
            "Süre dışında kısmi iade genelde sunulmaz; yasa zorunlu kılmadıkça.",
          ],
        },
        {
          title: "4. Chargeback",
          paragraphs: [
            "Banka itirazından önce bize yazın. Çözümsüz chargeback askıya almaya neden olabilir.",
          ],
        },
        {
          title: "5. İletişim",
          paragraphs: ["Fatura ve iade: billing@eilcard.com"],
        },
      ],
    },
  },
};
