import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import { getPublicSupportEmail } from "@/lib/platform-config";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = t(locale);
  return {
    title: m.meta.title,
    description: m.meta.description,
  };
}

export default async function HomePage() {
  const locale = await getLocale();
  const m = t(locale);
  return (
    <LandingPage
      locale={locale}
      m={m}
      supportEmail={getPublicSupportEmail()}
    />
  );
}
