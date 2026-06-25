import type { Locale } from "@/lib/i18n/types";
import { getPublicSupportEmail } from "@/lib/platform-config";
import { sendTransactionalEmail } from "@/lib/transactional-email";

export type SendPasswordResetInput = {
  to: string;
  userName: string;
  url: string;
  locale: Locale;
};

export async function sendPasswordResetMail(input: SendPasswordResetInput) {
  const support = getPublicSupportEmail();
  const subject =
    input.locale === "tr"
      ? "EIL Card — şifre sıfırlama"
      : "EIL Card — reset your password";

  const text =
    input.locale === "tr"
      ? `Merhaba ${input.userName},

Şifrenizi sıfırlamak için aşağıdaki bağlantıyı kullanın:

${input.url}

Bu bağlantı 1 saat geçerlidir. Siz talep etmediyseniz bu e-postayı yok sayın.

Destek: ${support}`
      : `Hi ${input.userName},

Use the link below to reset your password:

${input.url}

This link expires in 1 hour. If you did not request this, you can ignore this email.

Support: ${support}`;

  return sendTransactionalEmail({
    to: input.to,
    subject,
    text,
    from: "support",
  });
}
