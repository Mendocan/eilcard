import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import { ResetPasswordForm } from "./reset-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: `${t(locale).auth.resetPasswordTitle} — EIL Card`,
  };
}

export default async function ResetPasswordPage() {
  const locale = await getLocale();
  const m = t(locale).auth;

  return (
    <AuthShell locale={locale}>
      <Suspense>
        <ResetPasswordForm m={m} />
      </Suspense>
    </AuthShell>
  );
}
