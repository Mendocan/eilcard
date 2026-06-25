import { Suspense } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import { AdminAcceptInviteForm } from "./admin-accept-invite-form";

export default async function AdminAcceptInvitePage() {
  const locale = await getLocale();
  const m = t(locale);

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute right-4 top-4">
        <LocaleSwitcher locale={locale} />
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-8">
        <div className="mb-6">
          <BrandLogo size={40} className="mb-4" />
          <h1 className="text-xl font-semibold">{m.admin.teamAcceptTitle}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {m.admin.teamAcceptSubtitle}
          </p>
        </div>
        <Suspense fallback={<p className="text-sm">…</p>}>
          <AdminAcceptInviteForm m={m.admin} />
        </Suspense>
      </div>
    </main>
  );
}
