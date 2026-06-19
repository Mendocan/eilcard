import { getPublicSupportEmail } from "@/lib/platform-config";

type PlanNoticeInput = {
  to: string;
  userName: string;
  expiresAt: Date;
  locale: "en" | "tr";
};

/** Transactional billing notices — requires Resend when enabled in Faz 2+. */
export async function sendPlanExpiringNotice(input: PlanNoticeInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.info("[billing-email] skip (no RESEND_API_KEY)", input.to);
    return { sent: false as const, reason: "no_resend" };
  }

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

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `EIL Card <${from}>`,
      to: input.to,
      subject,
      text,
    }),
  });

  if (!res.ok) {
    console.error("[billing-email] resend failed", await res.text());
    return { sent: false as const, reason: "resend_error" };
  }

  return { sent: true as const };
}
