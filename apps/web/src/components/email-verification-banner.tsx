"use client";

import { useState } from "react";
import { sendVerificationEmail } from "@/lib/auth-client";

type Props = {
  email: string;
  title: string;
  body: string;
  resendLabel: string;
  resendingLabel: string;
  sentLabel: string;
  failedLabel: string;
};

export function EmailVerificationBanner({
  email,
  title,
  body,
  resendLabel,
  resendingLabel,
  sentLabel,
  failedLabel,
}: Props) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">(
    "idle"
  );

  async function handleResend() {
    setStatus("sending");
    const result = await sendVerificationEmail({
      email,
      callbackURL: "/dashboard",
    });
    setStatus(result.error ? "failed" : "sent");
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
      <p className="font-medium text-[var(--color-text)]">{title}</p>
      <p className="mt-1 leading-relaxed text-[var(--color-text-muted)]">{body}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={status === "sending"}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium transition hover:bg-[var(--color-bg)] disabled:opacity-50"
        >
          {status === "sending" ? resendingLabel : resendLabel}
        </button>
        {status === "sent" && (
          <span className="text-[var(--color-success)]">{sentLabel}</span>
        )}
        {status === "failed" && (
          <span className="text-[var(--color-error)]">{failedLabel}</span>
        )}
      </div>
    </div>
  );
}
