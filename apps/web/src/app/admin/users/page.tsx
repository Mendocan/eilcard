import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { listAdminUsers } from "@/lib/admin-queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import { AdminSearchPagination } from "../admin-search-pagination";

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function AdminUsersPage({ searchParams }: Props) {
  await requireAdminSession();
  const locale = await getLocale();
  const a = t(locale).admin;
  const sp = await searchParams;
  const q = sp.q ?? "";
  const page = Math.max(1, Number(sp.page) || 1);
  const data = await listAdminUsers(q, page);

  return (
    <main>
      <div className="border-b border-[var(--color-border)] p-4 sm:p-8">
        <h2 className="text-lg font-semibold">{a.users}</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{a.usersSubtitle}</p>
      </div>

      <AdminSearchPagination
        action="/admin/users"
        q={q}
        page={data.page}
        totalPages={data.totalPages}
        total={data.total}
        m={a}
      />

      <div className="overflow-x-auto">
        {data.rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
            {a.noResults}
          </p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <tr>
                <th className="px-4 py-3 font-medium">{a.name}</th>
                <th className="px-4 py-3 font-medium">{a.email}</th>
                <th className="px-4 py-3 font-medium">{a.cards}</th>
                <th className="px-4 py-3 font-medium">{a.emailVerified}</th>
                <th className="px-4 py-3 font-medium">{a.created}</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-[var(--color-border)] last:border-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="hover:text-[var(--color-accent)]"
                    >
                      {u.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="hover:text-[var(--color-accent)]"
                      >
                        {u.email}
                      </Link>
                      {u.isPlatformOperator && (
                        <span className="rounded-full bg-[var(--color-accent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-accent)]">
                          {a.platformOperatorBadge}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.cardCount > 0 ? (
                      <Link
                        href={`/admin/cards?q=${encodeURIComponent(u.email)}`}
                        className="text-[var(--color-accent)] hover:underline"
                      >
                        {u.cardCount}
                      </Link>
                    ) : (
                      "0"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.emailVerified ? (
                      <span className="text-[var(--color-success)]">{a.yes}</span>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">{a.no}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    {u.createdAt.toISOString().slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
