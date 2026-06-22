"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Messages } from "@/lib/i18n/messages";
import { signUp } from "@/lib/auth-client";

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]";

type Props = {
  m: Messages["auth"];
};

export function RegisterForm({ m }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!acceptedTerms) {
      setError(m.termsRequired);
      return;
    }
    setLoading(true);

    const result = await signUp.email({ name, email, password });
    setLoading(false);

    if (result.error) {
      setError(result.error.message ?? m.registerFailed);
      return;
    }

    const user = result.data?.user;
    if (user && !user.emailVerified) {
      router.push("/verify-email");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{m.registerTitle}</h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
        {m.registerSubtitle}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="name"
            className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]"
          >
            {m.accountOwner}
          </label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
            {m.accountOwnerHint}
          </p>
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]"
          >
            {m.email}
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
          <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">{m.passwordMin}</p>
        </div>

        <label className="flex cursor-pointer gap-2.5 text-xs leading-relaxed text-[var(--color-text-muted)]">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 shrink-0 accent-[var(--color-accent)]"
          />
          <span>
            {m.termsPrefix}{" "}
            <Link
              href="/legal/terms"
              className="font-medium text-[var(--color-accent)] hover:opacity-80"
              target="_blank"
            >
              {m.termsLink}
            </Link>{" "}
            {m.termsAnd}{" "}
            <Link
              href="/legal/privacy"
              className="font-medium text-[var(--color-accent)] hover:opacity-80"
              target="_blank"
            >
              {m.privacyLink}
            </Link>
            .
          </span>
        </label>

        {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

        <button
          type="submit"
          disabled={loading || !acceptedTerms}
          className="w-full rounded-lg bg-[var(--color-text)] px-4 py-2.5 text-sm font-medium text-[var(--color-bg)] transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? m.registerLoading : m.registerSubmit}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
        {m.hasAccount}{" "}
        <Link href="/login" className="font-medium text-[var(--color-accent)] hover:opacity-80">
          {m.signInLink}
        </Link>
      </p>
    </>
  );
}
