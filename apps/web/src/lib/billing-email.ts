import type { Locale } from "@/lib/i18n/types";
import { getBillingFromEmail } from "@/lib/platform-config";
import {
  sendTransactionalEmail,
  type EmailFromKind,
} from "@/lib/transactional-email";

export type BillingMailInput = {  to: string;
  userName: string;
  locale: Locale;
};

export async function sendSubscriptionActivatedMail(
  input: BillingMailInput & { tierLabel: string }
) {
  const billing = getBillingFromEmail();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://eilcard.com";
  const subject =
    input.locale === "tr"
      ? "EIL Card aboneliğiniz aktif"
      : "Your EIL Card subscription is active";

  const text =
    input.locale === "tr"
      ? `Merhaba ${input.userName},

${input.tierLabel} planınız aktif. Panele giriş yaparak kartlarınızı yönetebilirsiniz:

${appUrl}/dashboard

Fatura soruları: ${billing}`
      : `Hi ${input.userName},

Your ${input.tierLabel} plan is now active. Sign in to manage your cards:

${appUrl}/dashboard

Billing questions: ${billing}`;

  return sendBillingEmail({ to: input.to, subject, text });
}

export async function sendSubscriptionCanceledMail(
  input: BillingMailInput & { graceEndsAt: Date }
) {
  const billing = getBillingFromEmail();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://eilcard.com";
  const date = input.graceEndsAt.toISOString().slice(0, 10);
  const subject =
    input.locale === "tr"
      ? "EIL Card abonelik iptali"
      : "EIL Card subscription canceled";

  const text =
    input.locale === "tr"
      ? `Merhaba ${input.userName},

Aboneliğiniz iptal edildi. ${date} tarihine kadar mevcut plan avantajlarınız devam eder; ardından hesap ücretsiz limite düşer.

Yenilemek için: ${appUrl}/dashboard

Fatura: ${billing}`
      : `Hi ${input.userName},

Your subscription was canceled. Plan benefits continue until ${date}, then your account moves to free limits.

Renew anytime: ${appUrl}/dashboard

Billing: ${billing}`;

  return sendBillingEmail({ to: input.to, subject, text });
}

export async function sendPlanExpiringNotice(input: {
  to: string;
  userName: string;
  expiresAt: Date;
  locale: Locale;
}) {
  const billing = getBillingFromEmail();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://eilcard.com";
  const date = input.expiresAt.toISOString().slice(0, 10);
  const subject =
    input.locale === "tr"
      ? "EIL Card aboneliğiniz yakında sona eriyor"
      : "Your EIL Card subscription is ending soon";

  const text =
    input.locale === "tr"
      ? `Merhaba ${input.userName},

EIL Card aboneliğiniz ${date} tarihinde sona eriyor. Yenilemek için panele giriş yapın:

${appUrl}/dashboard

Fatura: ${billing}`
      : `Hi ${input.userName},

Your EIL Card subscription ends on ${date}. Sign in to renew:

${appUrl}/dashboard

Billing: ${billing}`;

  return sendBillingEmail({ to: input.to, subject, text });
}

async function sendBillingEmail(input: {
  to: string;
  subject: string;
  text: string;
}) {
  return sendTransactionalEmail({
    ...input,
    from: "billing" satisfies EmailFromKind,
  });
}
