import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import { getSession } from "@/lib/session";

export default async function VerifyEmailPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/verify-email");

  if (session.user.emailVerified) {
    redirect("/dashboard");
  }

  const locale = await getLocale();
  const a = t(locale).auth;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4 px-4 py-3">
          <Link href="/">
            <BrandLogo showWordmark />
          </Link>
          <LocaleSwitcher locale={locale} />
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">{a.verifyEmailTitle}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {a.verifyEmailSubtitle}
        </p>

        <div className="mt-8">
          <EmailVerificationBanner
            email={session.user.email}
            title={a.verifyEmailBannerTitle}
            body={a.verifyEmailBannerBody.replace("{email}", session.user.email)}
            resendLabel={a.verifyEmailResend}
            resendingLabel={a.verifyEmailResending}
            sentLabel={a.verifyEmailSent}
            failedLabel={a.verifyEmailFailed}
          />
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          <Link
            href="/dashboard"
            className="font-medium text-[var(--color-accent)] hover:opacity-80"
          >
            {a.verifyEmailContinue}
          </Link>
        </p>
      </main>
    </div>
  );
}
