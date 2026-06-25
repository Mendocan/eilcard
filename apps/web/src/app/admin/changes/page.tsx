import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-auth";
import { listCardChangeLogs } from "@/lib/admin-queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import { AdminPagination } from "../admin-pagination";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function AdminChangesPage({ searchParams }: Props) {
  await requireAdminPage("/admin/changes");
  const locale = await getLocale();
  const a = t(locale).admin;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const data = await listCardChangeLogs(page);

  return (
    <main>
      <div className="border-b border-[var(--color-border)] p-4 sm:p-8">
        <h2 className="text-lg font-semibold">{a.changeLog}</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{a.changeLogSubtitle}</p>
      </div>

      <AdminPagination
        action="/admin/changes"
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
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <tr>
                <th className="px-4 py-3 font-medium">{a.created}</th>
                <th className="px-4 py-3 font-medium">{a.handle}</th>
                <th className="px-4 py-3 font-medium">{a.email}</th>
                <th className="px-4 py-3 font-medium">{a.changedFields}</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--color-border)] last:border-0"
                >
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    {row.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/cards/${row.handle}`}
                      className="font-medium text-[var(--color-accent)] hover:opacity-80"
                    >
                      @{row.handle}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    {row.userEmail}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {row.changedFields.join(", ")}
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
