import { getSession } from "@/lib/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import { getUserPlan } from "@/lib/user-plan";
import { planTierLabel } from "@/lib/plan-labels";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { DashboardSignOutButton } from "./dashboard-sign-out";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const locale = await getLocale();
  const d = t(locale).dashboard;
  const plan = await getUserPlan(session.user.id);

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/dashboard">
            <BrandLogo showWordmark />
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-muted)] sm:inline">
              {d.planLabel}: {planTierLabel(plan.tier, d)}
            </span>
            <LocaleSwitcher locale={locale} />
            <span className="hidden text-sm text-[var(--color-text-muted)] md:inline">
              {session.user.email}
            </span>
            <DashboardSignOutButton label={d.signOut} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
