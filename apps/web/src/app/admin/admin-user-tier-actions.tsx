"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Messages } from "@/lib/i18n/messages";
import type { PlanTier } from "@/lib/tier-limits";

type Props = {
  userId: string;
  currentTier: PlanTier;
  enterpriseAddon: boolean;
  m: Messages["admin"];
};

const TIERS: PlanTier[] = ["free", "verified", "pro"];

export function AdminUserTierActions({
  userId,
  currentTier,
  enterpriseAddon,
  m,
}: Props) {
  const router = useRouter();
  const [tier, setTier] = useState<PlanTier>(currentTier);
  const [addon, setAddon] = useState(enterpriseAddon);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function savePlan() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const payload: { tier?: PlanTier; enterpriseAddon?: boolean } = {};
      if (tier !== currentTier) payload.tier = tier;
      if (addon !== enterpriseAddon) payload.enterpriseAddon = addon;
      if (Object.keys(payload).length === 0) return;

      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("failed");
      setMessage(m.planUpdated);
      router.refresh();
    } catch {
      setError(m.actionFailed);
    } finally {
      setBusy(false);
    }
  }

  const unchanged = tier === currentTier && addon === enterpriseAddon;

  return (
    <div className="space-y-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--color-text-muted)]">{m.changePlan}</span>
        <div className="flex flex-wrap gap-2">
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as PlanTier)}
            disabled={busy}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t === "free" ? m.tierFree : t === "verified" ? m.tierVerified : m.tierPro}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy || unchanged}
            onClick={savePlan}
            className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm transition hover:border-[var(--color-border-strong)] disabled:opacity-50"
          >
            {m.changePlan}
          </button>
        </div>
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={addon}
          onChange={(e) => setAddon(e.target.checked)}
          disabled={busy}
          className="rounded border-[var(--color-border)]"
        />
        <span className="text-[var(--color-text-muted)]">{m.enterpriseAddon}</span>
      </label>

      {message && <p className="text-sm text-[var(--color-success)]">{message}</p>}
      {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
    </div>
  );
}
