"use client";

import { useState } from "react";
import type { Messages } from "@/lib/i18n/messages";

export function AdminPasswordForm({ m }: { m: Messages["admin"] }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        setError(m.teamPasswordInvalid);
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setMessage(m.teamPasswordUpdated);
    } catch {
      setError(m.actionFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-3">
      <input
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        placeholder={m.teamCurrentPassword}
        required
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
      />
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder={m.teamNewPassword}
        required
        minLength={8}
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
      />
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      {message ? <p className="text-sm text-green-400">{message}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {loading ? "…" : m.teamPasswordButton}
      </button>
    </form>
  );
}
