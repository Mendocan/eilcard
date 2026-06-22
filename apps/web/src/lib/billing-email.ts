import { sendTransactionalEmail } from "@/lib/transactional-email";
import { getPublicSupportEmail } from "@/lib/platform-config";

type PlanNoticeInput = {
  to: string;
  userName: string;
  expiresAt: Date;
  locale: "en" | "tr";
};

export async function sendPlanExpiringNotice(input: PlanNoticeInput) {
  const from = getPublicSupportEmail();
  const subject =
    input.locale === "tr"
      ? "EIL Card aboneliğiniz yakında sona eriyor"
      : "Your EIL Card subscription is ending soon";
  const date = input.expiresAt.toISOString().slice(0, 10);
  const text =
    input.locale === "tr"
      ? `Merhaba ${input.userName},\n\nEIL Card aboneliğiniz ${date} tarihinde sona eriyor. Yenilemek için panele giriş yapın: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard\n\nDestek: ${from}`
      : `Hi ${input.userName},\n\nYour EIL Card subscription ends on ${date}. Sign in to renew: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard\n\nSupport: ${from}`;

  return sendTransactionalEmail({
    to: input.to,
    subject,
    text,
  });
}
