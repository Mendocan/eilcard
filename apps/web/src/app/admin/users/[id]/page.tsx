import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { cardTypeLabel } from "@/lib/admin-labels";
import { getAdminUserDetail } from "@/lib/admin-queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminUserDetailPage({ params }: Props) {
  await requireAdminSession();
  const { id } = await params;
  const locale = await getLocale();
  const a = t(locale).admin;
  const user = await getAdminUserDetail(id);

  if (!user) notFound();

  return (
    <main className="p-4 sm:p-8">
      <Link
        href="/admin/users"
        className="text-sm text-[var(--color-accent)] hover:underline"
      >
        {a.backToUsers}
      </Link>

      <div className="mt-6">
        <h2 className="text-2xl font-semibold">{user.name}</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{user.email}</p>
      </div>

      <section className="mt-8 rounded-2xl border border-[var(--color-border)] p-5">
        <h3 className="mb-4 font-medium">{a.userMeta}</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--color-text-muted)]">{a.emailVerified}</dt>
            <dd>{user.emailVerified ? a.yes : a.no}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--color-text-muted)]">{a.created}</dt>
            <dd>{user.createdAt.toISOString().slice(0, 10)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--color-text-muted)]">{a.activeSessions}</dt>
            <dd>{user.sessionCount}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--color-text-muted)]">{a.cards}</dt>
            <dd>{user.cards.length}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6">
        <h3 className="mb-4 font-medium">{a.userCards}</h3>
        {user.cards.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">{a.noUserCards}</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                <tr>
                  <th className="px-4 py-3 font-medium">{a.handle}</th>
                  <th className="px-4 py-3 font-medium">{a.domain}</th>
                  <th className="px-4 py-3 font-medium">{a.type}</th>
                  <th className="px-4 py-3 font-medium">{a.status}</th>
                  <th className="px-4 py-3 font-medium">{a.created}</th>
                </tr>
              </thead>
              <tbody>
                {user.cards.map((card) => (
                  <tr
                    key={card.handle}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link
                        href={`/admin/cards/${card.handle}`}
                        className="text-[var(--color-accent)] hover:underline"
                      >
                        {card.handle}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">
                      {card.domain ?? "—"}
                    </td>
                    <td className="px-4 py-3">{cardTypeLabel(card.type, a)}</td>
                    <td className="px-4 py-3">
                      {card.verified ? (
                        <span className="text-[var(--color-success)]">
                          {a.verifiedBadge}
                        </span>
                      ) : (
                        <span className="text-[var(--color-text-muted)]">
                          {a.pendingBadge}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">
                      {card.createdAt.toISOString().slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
