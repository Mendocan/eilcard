import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminLayoutWrapper } from "./admin-layout-wrapper";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const m = t(locale).admin;
  const session = await getAdminSession();

  return (
    <AdminLayoutWrapper locale={locale} m={m} role={session?.role ?? null}>
      {children}
    </AdminLayoutWrapper>
  );
}
