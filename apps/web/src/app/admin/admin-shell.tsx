"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Messages } from "@/lib/i18n/messages";
import type { Locale } from "@/lib/i18n/types";
import { BrandLogo } from "@/components/brand-logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { AdminSignOutButton } from "./admin-sign-out";

const NAV = [
  { href: "/admin", labelKey: "overview" as const, exact: true },
  { href: "/admin/cards", labelKey: "cards" as const, exact: false },
  { href: "/admin/verification", labelKey: "verification" as const, exact: false },
  { href: "/admin/changes", labelKey: "changeLog" as const, exact: false },
  { href: "/admin/analytics", labelKey: "analytics" as const, exact: false },
  { href: "/admin/users", labelKey: "users" as const, exact: false },
  { href: "/admin/audit", labelKey: "auditLog" as const, exact: false },
  { href: "/admin/settings", labelKey: "settings" as const, exact: false },
];

type Props = {
  locale: Locale;
  m: Messages["admin"];
  children: React.ReactNode;
};

export function AdminShell({ locale, m, children }: Props) {
  const currentPath = usePathname();

  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-[var(--color-border)] lg:w-56 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center justify-between px-4 lg:h-auto lg:flex-col lg:items-stretch lg:gap-6 lg:p-6">
          <div className="flex items-center gap-3">
            <BrandLogo size={36} />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-accent)]">
                EIL
              </p>
              <h1 className="text-lg font-semibold">{m.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <LocaleSwitcher locale={locale} />
            <AdminSignOutButton label={m.signOut} />
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-4 pb-4 lg:flex-col lg:px-6 lg:pb-6">
          {NAV.map((item) => {
            const active = item.exact
              ? currentPath === item.href
              : currentPath.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-[var(--color-surface)] text-[var(--color-text)]"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]/60 hover:text-[var(--color-text)]"
                }`}
              >
                {m[item.labelKey]}
              </Link>
            );
          })}
        </nav>

        <div className="hidden border-t border-[var(--color-border)] p-6 lg:block">
          <div className="mb-4">
            <LocaleSwitcher locale={locale} className="w-full justify-center" />
          </div>
          <AdminSignOutButton label={m.signOut} />
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
