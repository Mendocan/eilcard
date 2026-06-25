"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Messages } from "@/lib/i18n/messages";

export function AdminLoginForm({
  m,
  configured,
  needsBootstrap,
}: {
  m: Messages["admin"];
  configured: boolean;
  needsBootstrap: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError(m.invalidCredentials);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError(m.invalidCredentials);
    } finally {
      setLoading(false);
    }
  }

  if (needsBootstrap) {
    return (
      <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        {m.bootstrapRequired}
      </p>
    );
  }

  if (!configured) {
    return (
      <p className="rounded-lg border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]">
        {m.notConfigured}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="admin-email"
          className="mb-1.5 block text-sm font-medium"
        >
          {m.email}
        </label>
        <input
          id="admin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm outline-none ring-[var(--color-accent)] focus:ring-2"
        />
      </div>
      <div>
        <label
          htmlFor="admin-password"
          className="mb-1.5 block text-sm font-medium"
        >
          {m.password}
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm outline-none ring-[var(--color-accent)] focus:ring-2"
        />
      </div>
      {error ? (
        <p className="text-sm text-[var(--color-error)]">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[var(--color-text)] py-2.5 text-sm font-medium text-[var(--color-bg)] transition hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "…" : m.signIn}
      </button>
    </form>
  );
}
