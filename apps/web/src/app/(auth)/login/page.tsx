import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: `${t(locale).auth.loginTitle} — EIL Card`,
  };
}

export default async function LoginPage() {
  const locale = await getLocale();
  const m = t(locale).auth;

  return (
    <AuthShell locale={locale}>
      <LoginForm m={m} />
    </AuthShell>
  );
}
