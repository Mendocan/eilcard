import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import { RegisterForm } from "./register-form";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: `${t(locale).auth.registerTitle} — EIL Card`,
  };
}

export default async function RegisterPage() {
  const locale = await getLocale();
  const m = t(locale).auth;

  return (
    <AuthShell locale={locale}>
      <RegisterForm m={m} />
    </AuthShell>
  );
}
