import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { listVerificationQueue } from "@/lib/admin-queries";
import { verificationQueueStateLabel } from "@/lib/admin-labels";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import { buildTxtRecord } from "@/lib/dns-verify";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function AdminVerificationPage({ searchParams }: Props) {
  await requireAdminSession();
  const locale = await getLocale();
  const a = t(locale).admin;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const data = await listVerificationQueue(page);

  const prev = page > 1 ? page - 1 : null;
  const next = page < data.totalPages ? page + 1 : null;

  return (
    <main>
      <div className="border-b border-[var(--color-border)] p-4 sm:p-8">
        <h2 className="text-lg font-semibold">{a.verification}</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {a.verificationSubtitle}
        </p>
      </div>

      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
        <span>{a.totalCount.replace("{n}", String(data.total))}</span>
        <div className="flex gap-3">
          {prev ? (
            <Link href={`/admin/verification?page=${prev}`}>←</Link>
          ) : (
            <span className="opacity-30">←</span>
          )}
          <span>
            {page} / {data.totalPages}
          </span>
          {next ? (
            <Link href={`/admin/verification?page=${next}`}>→</Link>
          ) : (
            <span className="opacity-30">→</span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        {data.rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
            {a.noPendingVerifications}
          </p>
        ) : (
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <tr>
                <th className="px-4 py-3 font-medium">{a.handle}</th>
                <th className="px-4 py-3 font-medium">{a.domain}</th>
                <th className="px-4 py-3 font-medium">{a.owner}</th>
                <th className="px-4 py-3 font-medium">{a.queueStatus}</th>
                <th className="px-4 py-3 font-medium">{a.method}</th>
                <th className="px-4 py-3 font-medium">{a.txtRecord}</th>
                <th className="px-4 py-3 font-medium">{a.created}</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr
                  key={row.cardId}
                  className="border-b border-[var(--color-border)] last:border-0"
                >
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link
                      href={`/admin/cards/${row.handle}`}
                      className="text-[var(--color-accent)] hover:underline"
                    >
                      {row.handle}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{row.domain ?? "—"}</td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    {row.userEmail}
                  </td>
                  <td className="px-4 py-3">
                    {verificationQueueStateLabel(row.queueState, a)}
                  </td>
                  <td className="px-4 py-3">
                    {row.method ? row.method.toUpperCase() : "—"}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 font-mono text-xs">
                    {row.method === "dns" && row.token
                      ? buildTxtRecord(row.token)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    {row.cardCreatedAt.toISOString().slice(0, 10)}
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
