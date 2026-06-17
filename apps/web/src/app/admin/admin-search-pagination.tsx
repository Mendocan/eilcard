import Link from "next/link";
import type { Messages } from "@/lib/i18n/messages";

type Props = {
  action: string;
  q: string;
  page: number;
  totalPages: number;
  total: number;
  m: Messages["admin"];
};

export function AdminSearchPagination({
  action,
  q,
  page,
  totalPages,
  total,
  m,
}: Props) {
  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  function href(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${action}?${qs}` : action;
  }

  return (
    <div className="flex flex-col gap-4 border-b border-[var(--color-border)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <form method="get" action={action} className="flex flex-1 gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={m.searchPlaceholder}
          className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--color-text)] px-4 py-2 text-sm font-medium text-[var(--color-bg)]"
        >
          {m.search}
        </button>
      </form>
      <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
        <span>
          {m.totalCount.replace("{n}", String(total))}
        </span>
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
