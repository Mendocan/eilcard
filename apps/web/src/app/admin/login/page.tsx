import { redirect } from "next/navigation";
import { getAdminSession, isAdminConfigured } from "@/lib/admin-auth";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import { AdminLoginForm } from "./admin-login-form";

export default async function AdminLoginPage() {
  if (await getAdminSession()) {
    redirect("/admin");
  }

  const locale = await getLocale();
  const m = t(locale);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-8">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-accent)]">
            EIL
          </p>
          <h1 className="mt-1 text-xl font-semibold">{m.admin.loginTitle}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {m.admin.loginSubtitle}
          </p>
        </div>
        <AdminLoginForm m={m.admin} configured={isAdminConfigured()} />
      </div>
    </main>
  );
}
