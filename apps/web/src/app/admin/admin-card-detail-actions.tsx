"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Messages } from "@/lib/i18n/messages";

type Props = {
  handle: string;
  verified: boolean;
  hasPendingDns: boolean;
  m: Messages["admin"];
};

export function AdminCardDetailActions({
  handle,
  verified,
  hasPendingDns,
  m,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function patchVerified(next: boolean) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/cards/${encodeURIComponent(handle)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: next }),
      });
      if (!res.ok) throw new Error("failed");
      setMessage(next ? m.verifySuccess : m.revokeSuccess);
      router.refresh();
    } catch {
      setError(m.actionFailed);
    } finally {
      setBusy(false);
    }
  }

  async function removeCard() {
    if (!window.confirm(m.deleteConfirm.replace("{handle}", handle))) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/cards/${encodeURIComponent(handle)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("failed");
      router.push("/admin/cards");
      router.refresh();
    } catch {
      setError(m.actionFailed);
      setBusy(false);
    }
  }

  async function checkDns() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/cards/${encodeURIComponent(handle)}/verify-dns`,
        { method: "POST" }
      );
      const data = (await res.json()) as { status?: string; message?: string };
      if (!res.ok) throw new Error(data.message ?? "failed");
      setMessage(
        data.status === "verified" ? m.dnsVerifySuccess : m.dnsStillPending
      );
      router.refresh();
    } catch {
      setError(m.actionFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => patchVerified(!verified)}
          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm transition hover:border-[var(--color-border-strong)] disabled:opacity-50"
        >
          {verified ? m.revokeVerify : m.markVerified}
        </button>
        {hasPendingDns && (
          <button
            type="button"
            disabled={busy}
            onClick={checkDns}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm transition hover:border-[var(--color-border-strong)] disabled:opacity-50"
          >
            {m.recheckDns}
          </button>
        )}
        <a
          href={`/kart/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm transition hover:border-[var(--color-border-strong)]"
        >
          {m.viewPublic}
        </a>
        <Link
          href={`/api/v1/cards/${handle}`}
          target="_blank"
          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm transition hover:border-[var(--color-border-strong)]"
        >
          {m.viewJson}
        </Link>
        <button
          type="button"
          disabled={busy}
          onClick={removeCard}
          className="rounded-lg border border-[var(--color-error)] px-3 py-1.5 text-sm text-[var(--color-error)] transition hover:opacity-80 disabled:opacity-50"
        >
          {m.delete}
        </button>
      </div>
      {message && <p className="text-sm text-[var(--color-success)]">{message}</p>}
      {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
    </div>
  );
}
