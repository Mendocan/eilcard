import type { Locale } from "@/lib/i18n/types";
import { sendTransactionalEmail } from "@/lib/transactional-email";
import { getPublicSupportEmail } from "@/lib/platform-config";

type SendEmailVerificationInput = {
  to: string;
  userName: string;
  url: string;
  locale: Locale;
};

export async function sendEmailVerificationMail(
  input: SendEmailVerificationInput
) {
  const support = getPublicSupportEmail();
  const subject =
    input.locale === "tr"
      ? "EIL Card — e-posta adresinizi doğrulayın"
      : "EIL Card — verify your email address";

  const text =
    input.locale === "tr"
      ? `Merhaba ${input.userName},

EIL Card hesabınızı etkinleştirmek için e-posta adresinizi doğrulayın:

${input.url}

Bu bağlantı 1 saat geçerlidir. Siz talep etmediyseniz bu e-postayı yok sayın.

Destek: ${support}`
      : `Hi ${input.userName},

Verify your email to activate your EIL Card account:

${input.url}

This link expires in 1 hour. If you did not request this, you can ignore this email.

Support: ${support}`;

  return sendTransactionalEmail({
    to: input.to,
    subject,
    text,
  });
}
