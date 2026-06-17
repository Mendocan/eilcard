import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAdminOverview } from "@/lib/admin-queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";

export default async function AdminOverviewPage() {
  await requireAdminSession();
  const locale = await getLocale();
  const a = t(locale).admin;
  const stats = await getAdminOverview();

  const statCards = [
    { label: a.users, value: stats.users, href: "/admin/users" },
    { label: a.cards, value: stats.cards, href: "/admin/cards" },
    { label: a.verified, value: stats.verified, href: "/admin/cards?status=verified" },
    {
      label: a.pendingVerifications,
      value: stats.pendingVerifications,
      href: "/admin/verification",
    },
    { label: a.resolvesToday, value: stats.resolvesToday, href: "/admin/analytics" },
  ];

  return (
    <main className="p-4 sm:p-8">
      <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
        {a.overview}
      </h2>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((s) => {
          const inner = (
            <>
              <p className="text-sm text-[var(--color-text-muted)]">{s.label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{s.value}</p>
            </>
          );
          if (!s.href) {
            return (
              <div
                key={s.label}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-5"
              >
                {inner}
              </div>
            );
          }
          return (
            <Link
              key={s.label}
              href={s.href}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-5 transition hover:border-[var(--color-border-strong)]"
            >
              {inner}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium">{a.recentCards}</h3>
            <Link
              href="/admin/cards"
              className="text-sm text-[var(--color-accent)] hover:underline"
            >
              {a.viewAll}
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                <tr>
                  <th className="px-4 py-3 font-medium">{a.handle}</th>
                  <th className="px-4 py-3 font-medium">{a.domain}</th>
                  <th className="px-4 py-3 font-medium">{a.status}</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentCards.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-[var(--color-text-muted)]"
                    >
                      —
                    </td>
                  </tr>
                ) : (
                  stats.recentCards.map((c) => (
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
                      <td className="px-4 py-3">
                        {c.verified ? (
                          <span className="text-[var(--color-success)]">{a.yes}</span>
                        ) : (
                          <span className="text-[var(--color-text-muted)]">{a.no}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium">{a.recentUsers}</h3>
            <Link
              href="/admin/users"
              className="text-sm text-[var(--color-accent)] hover:underline"
            >
              {a.viewAll}
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                <tr>
                  <th className="px-4 py-3 font-medium">{a.email}</th>
                  <th className="px-4 py-3 font-medium">{a.created}</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-6 text-center text-[var(--color-text-muted)]"
                    >
                      —
                    </td>
                  </tr>
                ) : (
                  stats.recentUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-[var(--color-border)] last:border-0"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="hover:text-[var(--color-accent)]"
                        >
                          {u.email}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">
                        {u.createdAt.toISOString().slice(0, 10)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
