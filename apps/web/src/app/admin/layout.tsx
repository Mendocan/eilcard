import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import { AdminLayoutWrapper } from "./admin-layout-wrapper";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const m = t(locale).admin;

  return <AdminLayoutWrapper locale={locale} m={m}>{children}</AdminLayoutWrapper>;
}
