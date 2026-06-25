import {
  getBillingFromEmail,
  getPublicSupportEmail,
} from "@/lib/platform-config";

export type EmailFromKind = "support" | "billing";

export type SendTransactionalEmailInput = {
  to: string;
  subject: string;
  text: string;
  from?: EmailFromKind;
};

function resolveFromAddress(kind: EmailFromKind): string {
  return kind === "billing" ? getBillingFromEmail() : getPublicSupportEmail();
}

function fromDisplayName(kind: EmailFromKind): string {
  return kind === "billing" ? "EIL Card Billing" : "EIL Card";
}

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.info("[transactional-email] skip (no RESEND_API_KEY)", input.to);
    return { sent: false, reason: "no_resend" };
  }

  const kind = input.from ?? "support";
  const address = resolveFromAddress(kind);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromDisplayName(kind)} <${address}>`,
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
