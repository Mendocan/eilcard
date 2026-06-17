"use client";

import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/types";

type Props = {
  locale: Locale;
  className?: string;
};

export function LocaleSwitcher({ locale, className = "" }: Props) {
  const router = useRouter();

  async function setLocale(next: Locale) {
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    router.refresh();
  }

  return (
    <div
      className={`flex rounded-lg border border-[var(--color-border)] p-0.5 text-xs font-medium ${className}`}
    >
      {(["en", "tr"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          className={`rounded-md px-2.5 py-1 uppercase transition ${
            locale === l
              ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
