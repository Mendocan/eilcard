import { requireAdminSession } from "@/lib/admin-auth";
import { getAdminStats } from "@/lib/admin-stats";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import { AdminSignOutButton } from "./admin-sign-out";

export default async function AdminDashboardPage() {
  await requireAdminSession();
  const locale = await getLocale();
  const m = t(locale);
  const a = m.admin;
  const stats = await getAdminStats();

  const statCards = [
    { label: a.users, value: stats.users },
    { label: a.cards, value: stats.cards },
    { label: a.verified, value: stats.verified },
    { label: a.resolvesToday, value: stats.resolvesToday },
  ];

  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--color-border)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-accent)]">
              EIL
            </p>
            <h1 className="text-lg font-semibold">{a.title}</h1>
          </div>
          <AdminSignOutButton label={a.signOut} />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          {a.overview}
        </h2>
        <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-5"
            >
              <p className="text-sm text-[var(--color-text-muted)]">{s.label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          <section>
            <h3 className="mb-4 font-medium">{a.recentCards}</h3>
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
                        <td className="px-4 py-3 font-mono text-xs">{c.handle}</td>
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
            <h3 className="mb-4 font-medium">{a.recentUsers}</h3>
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
                        key={u.email}
                        className="border-b border-[var(--color-border)] last:border-0"
                      >
                        <td className="px-4 py-3">{u.email}</td>
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
      </div>
    </main>
  );
}
