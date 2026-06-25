"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Messages } from "@/lib/i18n/messages";
import type { AdminRole } from "@/lib/admin-rbac";
import { BrandLogo } from "@/components/brand-logo";

export function AdminAcceptInviteForm({ m }: { m: Messages["admin"] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    if (!token) {
      setError(m.teamInviteInvalid);
      setValidating(false);
      return;
    }
    fetch(`/api/admin/invite?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("invalid");
        const data = (await res.json()) as { email: string; role: AdminRole };
        setEmail(data.email);
        setRole(data.role);
      })
      .catch(() => setError(m.teamInviteInvalid))
      .finally(() => setValidating(false));
  }, [token, m.teamInviteInvalid]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });
      if (!res.ok) {
        setError(m.teamInviteInvalid);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError(m.actionFailed);
    } finally {
      setLoading(false);
    }
  }

  if (validating) {
    return <p className="text-sm text-[var(--color-text-muted)]">…</p>;
  }

  if (error && !email) {
    return (
      <p className="rounded-lg border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]">
        {error}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-lg border border-[var(--color-border)] px-4 py-3 text-sm">
        <p>
          <span className="text-[var(--color-text-muted)]">{m.email}: </span>
          {email}
        </p>
        {role ? (
          <p className="mt-1">
            <span className="text-[var(--color-text-muted)]">{m.teamRole}: </span>
            {m[`teamRole${role}` as keyof Messages["admin"]] as string}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="invite-name" className="mb-1.5 block text-sm font-medium">
          {m.name}
        </label>
        <input
          id="invite-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm"
        />
      </div>
      <div>
        <label htmlFor="invite-password" className="mb-1.5 block text-sm font-medium">
          {m.password}
        </label>
        <input
          id="invite-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm"
        />
      </div>
      {error ? (
        <p className="text-sm text-[var(--color-error)]">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[var(--color-text)] py-2.5 text-sm font-medium text-[var(--color-bg)] disabled:opacity-60"
      >
        {loading ? "…" : m.teamAcceptInvite}
      </button>
    </form>
  );
}
