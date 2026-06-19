"use client";

import Link from "next/link";
import type { Messages } from "@/lib/i18n/messages";
import type { UserPlanInfo } from "@/lib/user-plan";

type Props = {
  plan: UserPlanInfo;
  polarCheckoutEnabled: boolean;
  checkoutSuccess: boolean;
  m: Messages["dashboard"];
};

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}

export function DashboardBillingPanel({
  plan,
  polarCheckoutEnabled,
  checkoutSuccess,
  m,
}: Props) {
  const expiringSoon =
    plan.expiresAt &&
    !plan.planExpired &&
    plan.subscribedTier !== "free" &&
    daysUntil(plan.expiresAt) <= 14 &&
    daysUntil(plan.expiresAt) >= 0;

  const showUpgrade = plan.tier === "free" || plan.planExpired;

  return (
    <section className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h2 className="text-sm font-semibold">{m.billingTitle}</h2>

      {checkoutSuccess && (
        <p className="mt-2 text-sm text-[var(--color-success)]">{m.checkoutSuccess}</p>
      )}

      {plan.planExpired && (
        <p className="mt-2 text-sm text-[var(--color-error)]">{m.billingExpiredBanner}</p>
      )}

      {expiringSoon && plan.expiresAt && (
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          {m.billingExpiringBanner.replace(
            "{date}",
            plan.expiresAt.toISOString().slice(0, 10)
          )}
        </p>
      )}

      {plan.expiresAt && plan.subscribedTier !== "free" && !plan.planExpired && (
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          {m.billingExpires.replace(
            "{date}",
            plan.expiresAt.toISOString().slice(0, 10)
          )}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {showUpgrade && polarCheckoutEnabled && (
          <>
            <Link
              href="/api/billing/checkout?tier=verified"
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium transition hover:border-[var(--color-accent)]"
            >
              {m.billingUpgradeVerified}
            </Link>
            <Link
              href="/api/billing/checkout?tier=pro"
              className="rounded-lg bg-[var(--color-text)] px-3 py-1.5 text-xs font-medium text-[var(--color-bg)] transition hover:opacity-90"
            >
              {m.billingUpgradePro}
            </Link>
          </>
        )}
        {showUpgrade && !polarCheckoutEnabled && (
          <Link
            href="/pricing"
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium transition hover:border-[var(--color-accent)]"
          >
            {m.billingViewPricing}
          </Link>
        )}
        {polarCheckoutEnabled && plan.subscribedTier !== "free" && (
          <Link
            href="/portal"
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
          >
            {m.billingManage}
          </Link>
        )}
      </div>
    </section>
  );
}
