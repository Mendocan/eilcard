import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-auth";
import { getResolveAnalytics } from "@/lib/admin-queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";

type Props = {
  searchParams: Promise<{ days?: string }>;
};

export default async function AdminAnalyticsPage({ searchParams }: Props) {
  await requireAdminPage("/admin/analytics");
  const locale = await getLocale();
  const a = t(locale).admin;
  const sp = await searchParams;
  const days = sp.days === "30" ? 30 : 14;
  const data = await getResolveAnalytics(days);

  return (
    <main className="p-4 sm:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{a.analytics}</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {a.analyticsSubtitle}
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link
            href="/admin/analytics?days=14"
            className={`rounded-lg px-3 py-1.5 ${
              days === 14
                ? "bg-[var(--color-surface)] font-medium"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {a.last14Days}
          </Link>
          <Link
            href="/admin/analytics?days=30"
            className={`rounded-lg px-3 py-1.5 ${
              days === 30
                ? "bg-[var(--color-surface)] font-medium"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {a.last30Days}
          </Link>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] p-5">
          <p className="text-sm text-[var(--color-text-muted)]">{a.resolvesToday}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {data.totals.today}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] p-5">
          <p className="text-sm text-[var(--color-text-muted)]">
            {days === 30 ? a.last30Days : a.last14Days}
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {data.totals.period}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] p-5">
          <p className="text-sm text-[var(--color-text-muted)]">{a.resolveAllTime}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {data.totals.allTime}
          </p>
        </div>
      </div>

      <section className="mb-8 rounded-2xl border border-[var(--color-border)] p-5">
        <h3 className="mb-4 font-medium">{a.dailyResolves}</h3>
        {data.daily.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">{a.noResolveData}</p>
        ) : (
          <div className="space-y-2">
            {data.daily.map((row) => (
              <div key={row.date} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 text-[var(--color-text-muted)]">
                  {row.date}
                </span>
                <div className="h-6 flex-1 rounded bg-[var(--color-bg)]">
                  <div
                    className="h-full rounded bg-[var(--color-accent)]/70"
                    style={{
                      width: `${Math.max(4, (row.total / data.maxDaily) * 100)}%`,
                    }}
                  />
                </div>
                <span className="w-12 text-right tabular-nums">{row.total}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] p-5">
        <h3 className="mb-4 font-medium">{a.topCards}</h3>
        {data.topCards.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">{a.noResolveData}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                <th className="pb-2 font-medium">{a.handle}</th>
                <th className="pb-2 font-medium">{a.domain}</th>
                <th className="pb-2 text-right font-medium">{a.resolveTotal}</th>
              </tr>
            </thead>
            <tbody>
              {data.topCards.map((card) => (
                <tr key={card.handle} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="py-2 font-mono text-xs">
                    <Link
                      href={`/admin/cards/${card.handle}`}
                      className="text-[var(--color-accent)] hover:underline"
                    >
                      {card.handle}
                    </Link>
                  </td>
                  <td className="py-2 text-[var(--color-text-muted)]">
                    {card.domain ?? "—"}
                  </td>
                  <td className="py-2 text-right tabular-nums">{card.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
