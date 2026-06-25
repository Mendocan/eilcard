import { requireAdminPage } from "@/lib/admin-auth";
import { listAdminOperators } from "@/lib/admin-operators";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import { AdminTeamPanel } from "./admin-team-panel";

export default async function AdminTeamPage() {
  await requireAdminPage("/admin/team");
  const locale = await getLocale();
  const a = t(locale).admin;
  const operators = await listAdminOperators();

  return (
    <main>
      <div className="border-b border-[var(--color-border)] p-4 sm:p-8">
        <h2 className="text-lg font-semibold">{a.team}</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{a.teamSubtitle}</p>
      </div>
      <div className="p-4 sm:p-8">
        <AdminTeamPanel
          m={a}
          initialOperators={operators.map((op) => ({
            id: op.id,
            email: op.email,
            name: op.name,
            role: op.role,
            createdAt: op.createdAt.toISOString(),
            lastLoginAt: op.lastLoginAt?.toISOString() ?? null,
          }))}
        />
      </div>
    </main>
  );
}
