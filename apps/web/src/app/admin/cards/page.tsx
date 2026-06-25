import { requireAdminPage } from "@/lib/admin-auth";
import { listAdminCards } from "@/lib/admin-queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import { AdminCardsTable } from "../admin-cards-table";
import { AdminCardFilters } from "../admin-card-filters";

type Props = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    status?: string;
    type?: string;
  }>;
};

export default async function AdminCardsPage({ searchParams }: Props) {
  await requireAdminPage("/admin/cards");
  const locale = await getLocale();
  const a = t(locale).admin;
  const sp = await searchParams;
  const q = sp.q ?? "";
  const page = Math.max(1, Number(sp.page) || 1);
  const status = sp.status ?? "all";
  const type = sp.type ?? "all";
  const data = await listAdminCards({
    q,
    page,
    status: status as "all" | "verified" | "pending",
    type: type as "all" | "organization" | "person",
  });

  return (
    <main>
      <div className="border-b border-[var(--color-border)] p-4 sm:p-8">
        <h2 className="text-lg font-semibold">{a.cards}</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{a.cardsSubtitle}</p>
      </div>

      <AdminCardFilters
        q={q}
        status={status}
        type={type}
        page={data.page}
        totalPages={data.totalPages}
        total={data.total}
        m={a}
      />

      <div className="overflow-hidden">
        <AdminCardsTable rows={data.rows} m={a} />
      </div>
    </main>
  );
}
