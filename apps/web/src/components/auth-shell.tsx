import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import type { Locale } from "@/lib/i18n/types";

type Props = {
  locale: Locale;
  children: React.ReactNode;
};

export function AuthShell({ locale, children }: Props) {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-sm items-center justify-between px-4 pt-8 sm:px-0">
        <Link href="/" className="flex items-center">
          <BrandLogo showWordmark />
        </Link>
        <LocaleSwitcher locale={locale} />
      </header>
      <main className="flex items-center justify-center px-4 pb-16 pt-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
