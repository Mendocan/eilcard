"use client";

import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/types";
import type { Messages } from "@/lib/i18n/messages";
import type { AdminRole } from "@/lib/admin-rbac";
import { AdminShell } from "./admin-shell";

type Props = {
  locale: Locale;
  m: Messages["admin"];
  role: AdminRole | null;
  children: React.ReactNode;
};

export function AdminLayoutWrapper({ locale, m, role, children }: Props) {
  const pathname = usePathname();
  if (pathname === "/admin/login" || pathname === "/admin/accept-invite") {
    return <>{children}</>;
  }
  return (
    <AdminShell locale={locale} m={m} role={role}>
      {children}
    </AdminShell>
  );
}
