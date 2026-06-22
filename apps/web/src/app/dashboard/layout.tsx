import { getSession } from "@/lib/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import { getUserPlan } from "@/lib/user-plan";
import { isPlatformOperatorUser } from "@/lib/platform-operator";
import { planDisplayLabel } from "@/lib/plan-labels";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { PlatformOperatorBanner } from "@/components/platform-operator-banner";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
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
  const a = t(locale).auth;
  const plan = await getUserPlan(session.user.id);
  const isOperator = await isPlatformOperatorUser(session.user.id);

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/dashboard">
            <BrandLogo showWordmark />
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            {isOperator && (
              <span className="hidden rounded-lg border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-accent)] sm:inline">
                Platform
              </span>
            )}
            <span className="hidden rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-muted)] sm:inline">
              {d.planLabel}: {planDisplayLabel(plan, d)}
            </span>
            <LocaleSwitcher locale={locale} />
            <span className="hidden text-sm text-[var(--color-text-muted)] md:inline">
              {session.user.email}
            </span>
            <DashboardSignOutButton label={d.signOut} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        {isOperator && <PlatformOperatorBanner message={d.platformOperatorBanner} />}
        {!session.user.emailVerified && (
          <EmailVerificationBanner
            email={session.user.email}
            title={a.verifyEmailBannerTitle}
            body={a.verifyEmailBannerBody.replace("{email}", session.user.email)}
            resendLabel={a.verifyEmailResend}
            resendingLabel={a.verifyEmailResending}
            sentLabel={a.verifyEmailSent}
            failedLabel={a.verifyEmailFailed}
          />
        )}
        {children}
      </main>
    </div>
  );
}
