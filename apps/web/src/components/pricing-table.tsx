import { TIER_LIMITS, type PlanTier } from "@/lib/tier-limits";
import type { PricingCopy } from "@/lib/i18n/pricing";

const TIERS: PlanTier[] = ["free", "verified", "pro"];

type Props = {
  copy: PricingCopy;
  checkoutEnabled?: boolean;
};

function tierLabel(tier: PlanTier, copy: PricingCopy): string {
  if (tier === "free") return copy.tierFree;
  if (tier === "verified") return copy.tierVerified;
  return copy.tierPro;
}

function formatNum(n: number): string {
  return n.toLocaleString("en-US");
}

export function PricingTable({ copy, checkoutEnabled = false }: Props) {
  const rows: {
    label: string;
    values: (string | boolean)[];
  }[] = [
    {
      label: copy.rowCards,
      values: TIERS.map((t) => String(TIER_LIMITS[t].maxCards)),
    },
    {
      label: copy.rowOrgCards,
      values: TIERS.map((t) => String(TIER_LIMITS[t].maxOrgCards)),
    },
    {
      label: copy.rowProducts,
      values: TIERS.map((t) => String(TIER_LIMITS[t].maxProducts)),
    },
    {
      label: copy.rowResolve,
      values: TIERS.map((t) => formatNum(TIER_LIMITS[t].resolveLimit)),
    },
    {
      label: copy.rowDns,
      values: [true, true, true],
    },
    {
      label: copy.rowVerifiedBadge,
      values: [false, true, true],
    },
  ];

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <tr>
            <th className="px-4 py-3 font-medium">{copy.colFeature}</th>
            {TIERS.map((tier) => (
              <th key={tier} className="px-4 py-3 font-medium">
                {tierLabel(tier, copy)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.label}
              className="border-b border-[var(--color-border)] last:border-0"
            >
              <td className="px-4 py-3 text-[var(--color-text-muted)]">
                {row.label}
              </td>
              {row.values.map((value, i) => (
                <td key={TIERS[i]} className="px-4 py-3">
                  {typeof value === "boolean" ? (
                    value ? (
                      <span className="text-[var(--color-success)]">
                        {copy.included}
                      </span>
                    ) : (
                      "—"
                    )
                  ) : (
                    value
                  )}
                </td>
              ))}
            </tr>
          ))}
          {!checkoutEnabled ? (
            <tr className="bg-[var(--color-surface)]">
              <td className="px-4 py-3 font-medium">{copy.comingSoon}</td>
              {TIERS.map((tier) => (
                <td key={tier} className="px-4 py-3 text-[var(--color-text-muted)]">
                  {tier === "free" ? copy.included : "—"}
                </td>
              ))}
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
