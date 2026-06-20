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

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const locale = await getLocale();
  const m = t(locale).auth;
  const sp = await searchParams;

  return (
    <AuthShell locale={locale}>
      <LoginForm m={m} nextPath={sp.next} />
    </AuthShell>
  );
}
