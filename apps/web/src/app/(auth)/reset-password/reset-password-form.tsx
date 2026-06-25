"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Messages } from "@/lib/i18n/messages";
import { resetPassword } from "@/lib/auth-client";

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]";

type Props = {
  m: Messages["auth"];
};

export function ResetPasswordForm({ m }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const queryError = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    queryError === "invalid_token" ? m.resetPasswordInvalidToken : ""
  );
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError(m.resetPasswordInvalidToken);
      return;
    }

    setError("");
    setLoading(true);

    const result = await resetPassword({ newPassword: password, token });
    setLoading(false);

    if (result.error) {
      setError(m.resetPasswordFailed);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  if (!token && !queryError) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight">{m.resetPasswordTitle}</h1>
        <p className="mt-4 text-sm text-[var(--color-error)]">{m.resetPasswordInvalidToken}</p>
        <p className="mt-6 text-center text-sm">
          <Link href="/forgot-password" className="font-medium text-[var(--color-accent)]">
            {m.forgotPasswordLink}
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{m.resetPasswordTitle}</h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
        {m.resetPasswordSubtitle}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]"
          >
            {m.password}
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{m.passwordMin}</p>
        </div>

        {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
        {success && (
          <p className="text-sm text-[var(--color-text-muted)]">{m.resetPasswordSuccess}</p>
        )}

        <button
          type="submit"
          disabled={loading || success}
          className="w-full rounded-lg bg-[var(--color-text)] px-4 py-2.5 text-sm font-medium text-[var(--color-bg)] transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? m.resetPasswordLoading : m.resetPasswordSubmit}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
        <Link href="/login" className="font-medium text-[var(--color-accent)] hover:opacity-80">
          {m.backToSignIn}
        </Link>
      </p>
    </>
  );
}
