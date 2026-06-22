import { getPublicSupportEmail } from "@/lib/platform-config";

export type SendTransactionalEmailInput = {
  to: string;
  subject: string;
  text: string;
};

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.info("[transactional-email] skip (no RESEND_API_KEY)", input.to);
    return { sent: false, reason: "no_resend" };
  }

  const from = getPublicSupportEmail();
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `EIL Card <${from}>`,
      to: input.to,
      subject: input.subject,
      text: input.text,
    }),
  });

  if (!res.ok) {
    console.error("[transactional-email] resend failed", await res.text());
    return { sent: false, reason: "resend_error" };
  }

  return { sent: true };
}
