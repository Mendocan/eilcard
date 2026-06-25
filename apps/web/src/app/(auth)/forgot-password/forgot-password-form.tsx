"use client";

import Link from "next/link";
import { useState } from "react";
import type { Messages } from "@/lib/i18n/messages";
import { requestPasswordReset } from "@/lib/auth-client";

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]";

type Props = {
  m: Messages["auth"];
};

export function ForgotPasswordForm({ m }: Props) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const redirectTo = `${window.location.origin}/reset-password`;
    const result = await requestPasswordReset({ email, redirectTo });
    setLoading(false);

    if (result.error) {
      setError(m.forgotPasswordFailed);
      return;
    }

    setMessage(m.forgotPasswordSent);
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{m.forgotPasswordTitle}</h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
        {m.forgotPasswordSubtitle}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]"
          >
            {m.loginEmail}
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
        {message && (
          <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
        )}

        <button
          type="submit"
          disabled={loading || Boolean(message)}
          className="w-full rounded-lg bg-[var(--color-text)] px-4 py-2.5 text-sm font-medium text-[var(--color-bg)] transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? m.forgotPasswordLoading : m.forgotPasswordSubmit}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
        <Link
          href="/login"
          className="font-medium text-[var(--color-accent)] hover:opacity-80"
        >
          {m.backToSignIn}
        </Link>
      </p>
    </>
  );
}
