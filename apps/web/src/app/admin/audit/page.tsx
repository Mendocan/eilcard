import { requireAdminSession } from "@/lib/admin-auth";
import { listAdminAuditLogs } from "@/lib/admin-queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import { auditActionLabel } from "@/lib/admin-labels";
import { AdminPagination } from "../admin-pagination";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function AdminAuditPage({ searchParams }: Props) {
  await requireAdminSession();
  const locale = await getLocale();
  const a = t(locale).admin;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const data = await listAdminAuditLogs(page);

  return (
    <main>
      <div className="border-b border-[var(--color-border)] p-4 sm:p-8">
        <h2 className="text-lg font-semibold">{a.auditLog}</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{a.auditSubtitle}</p>
      </div>

      <AdminPagination
        action="/admin/audit"
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
                <th className="px-4 py-3 font-medium">{a.auditAction}</th>
                <th className="px-4 py-3 font-medium">{a.auditTarget}</th>
                <th className="px-4 py-3 font-medium">{a.auditDetails}</th>
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
                  <td className="px-4 py-3">{auditActionLabel(row.action, a)}</td>
                  <td className="px-4 py-3">
                    <span className="text-[var(--color-text-muted)]">
                      {row.targetType}:
                    </span>{" "}
                    {row.targetId}
                  </td>
                  <td className="max-w-md truncate px-4 py-3 font-mono text-xs text-[var(--color-text-muted)]">
                    {row.details ? JSON.stringify(row.details) : "—"}
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
