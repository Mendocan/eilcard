import Link from "next/link";
import type { Messages } from "@/lib/i18n/messages";

type Props = {
  action: string;
  page: number;
  totalPages: number;
  total: number;
  m: Messages["admin"];
  extraParams?: Record<string, string>;
};

export function AdminPagination({
  action,
  page,
  totalPages,
  total,
  m,
  extraParams,
}: Props) {
  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  function href(p: number) {
    const params = new URLSearchParams(extraParams);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${action}?${qs}` : action;
  }

  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
      <span>{m.totalCount.replace("{n}", String(total))}</span>
      <div className="flex items-center gap-3">
        {prev ? (
          <Link href={href(prev)} className="hover:text-[var(--color-text)]">
            ←
          </Link>
        ) : (
          <span className="opacity-30">←</span>
        )}
        <span>
          {page} / {totalPages}
        </span>
        {next ? (
          <Link href={href(next)} className="hover:text-[var(--color-text)]">
            →
          </Link>
        ) : (
          <span className="opacity-30">→</span>
        )}
      </div>
    </div>
  );
}
