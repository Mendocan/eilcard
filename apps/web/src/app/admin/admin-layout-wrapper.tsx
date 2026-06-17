"use client";

import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/types";
import type { Messages } from "@/lib/i18n/messages";
import { AdminShell } from "./admin-shell";

type Props = {
  locale: Locale;
  m: Messages["admin"];
  children: React.ReactNode;
};

export function AdminLayoutWrapper({ locale, m, children }: Props) {
  const pathname = usePathname();
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }
  return (
    <AdminShell locale={locale} m={m}>
      {children}
    </AdminShell>
  );
}
