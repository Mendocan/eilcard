"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Messages } from "@/lib/i18n/messages";
import { cardTypeLabel } from "@/lib/admin-labels";

type CardRow = {
  handle: string;
  domain: string | null;
  type: string;
  verified: boolean;
  userEmail: string;
  createdAt: Date;
};

type Props = {
  rows: CardRow[];
  m: Messages["admin"];
};

export function AdminCardsTable({ rows, m }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function patchVerified(handle: string, verified: boolean) {
    setBusy(handle);
    setError(null);
    try {
      const res = await fetch(`/api/admin/cards/${encodeURIComponent(handle)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified }),
      });
      if (!res.ok) throw new Error("failed");
      router.refresh();
    } catch {
      setError(m.actionFailed);
    } finally {
      setBusy(null);
    }
  }

  async function removeCard(handle: string) {
    if (!window.confirm(m.deleteConfirm.replace("{handle}", handle))) return;
    setBusy(handle);
    setError(null);
    try {
      const res = await fetch(`/api/admin/cards/${encodeURIComponent(handle)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("failed");
      router.refresh();
    } catch {
      setError(m.actionFailed);
    } finally {
      setBusy(null);
    }
  }

  if (rows.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
        {m.noResults}
      </p>
    );
  }

  return (
    <div>
      {error && (
        <p className="border-b border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-error)]">
          {error}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
            <tr>
              <th className="px-4 py-3 font-medium">{m.handle}</th>
              <th className="px-4 py-3 font-medium">{m.domain}</th>
              <th className="px-4 py-3 font-medium">{m.owner}</th>
              <th className="px-4 py-3 font-medium">{m.type}</th>
              <th className="px-4 py-3 font-medium">{m.status}</th>
              <th className="px-4 py-3 font-medium">{m.created}</th>
              <th className="px-4 py-3 font-medium">{m.actions}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr
                key={c.handle}
                className="border-b border-[var(--color-border)] last:border-0"
              >
                <td className="px-4 py-3 font-mono text-xs">
                  <Link
                    href={`/admin/cards/${c.handle}`}
                    className="hover:text-[var(--color-accent)]"
                  >
                    {c.handle}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[var(--color-text-muted)]">
                  {c.domain ?? "—"}
                </td>
                <td className="px-4 py-3 text-[var(--color-text-muted)]">
                  {c.userEmail}
                </td>
                <td className="px-4 py-3">{cardTypeLabel(c.type, m)}</td>
                <td className="px-4 py-3">
                  {c.verified ? (
                    <span className="text-[var(--color-success)]">{m.verifiedBadge}</span>
                  ) : (
                    <span className="text-[var(--color-text-muted)]">{m.pendingBadge}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[var(--color-text-muted)]">
                  {c.createdAt.toISOString().slice(0, 10)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`/kart/${c.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--color-accent)] hover:underline"
                    >
                      {m.view}
                    </a>
                    <button
                      type="button"
                      disabled={busy === c.handle}
                      onClick={() => patchVerified(c.handle, !c.verified)}
                      className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-50"
                    >
                      {c.verified ? m.revokeVerify : m.markVerified}
                    </button>
                    <button
                      type="button"
                      disabled={busy === c.handle}
                      onClick={() => removeCard(c.handle)}
                      className="text-xs text-[var(--color-error)] hover:underline disabled:opacity-50"
                    >
                      {m.delete}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
