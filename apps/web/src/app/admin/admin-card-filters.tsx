import Link from "next/link";
import type { Messages } from "@/lib/i18n/messages";

type Props = {
  q: string;
  status: string;
  type: string;
  page: number;
  totalPages: number;
  total: number;
  m: Messages["admin"];
};

export function AdminCardFilters({
  q,
  status,
  type,
  page,
  totalPages,
  total,
  m,
}: Props) {
  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status && status !== "all") params.set("status", status);
    if (type && type !== "all") params.set("type", type);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/cards?${qs}` : "/admin/cards";
  }

  return (
    <div className="space-y-4 border-b border-[var(--color-border)] p-4">
      <form method="get" action="/admin/cards" className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <label className="flex flex-1 flex-col gap-1 text-xs text-[var(--color-text-muted)]">
          {m.search}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={m.searchPlaceholder}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)]">
          {m.filterStatus}
          <select
            name="status"
            defaultValue={status}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
          >
            <option value="all">{m.filterAll}</option>
            <option value="verified">{m.verifiedBadge}</option>
            <option value="pending">{m.pendingBadge}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)]">
          {m.filterType}
          <select
            name="type"
            defaultValue={type}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
          >
            <option value="all">{m.filterAll}</option>
            <option value="organization">{m.typeOrganization}</option>
            <option value="person">{m.typePerson}</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-[var(--color-text)] px-4 py-2 text-sm font-medium text-[var(--color-bg)]"
        >
          {m.applyFilters}
        </button>
      </form>
      <div className="flex items-center justify-between text-sm text-[var(--color-text-muted)]">
        <span>{m.totalCount.replace("{n}", String(total))}</span>
        <div className="flex items-center gap-3">
          {prev ? (
            <Link href={pageHref(prev)} className="hover:text-[var(--color-text)]">
              ←
            </Link>
          ) : (
            <span className="opacity-30">←</span>
          )}
          <span>
            {page} / {totalPages}
          </span>
          {next ? (
            <Link href={pageHref(next)} className="hover:text-[var(--color-text)]">
              →
            </Link>
          ) : (
            <span className="opacity-30">→</span>
          )}
        </div>
      </div>
    </div>
  );
}
