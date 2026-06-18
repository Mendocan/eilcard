"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/types";
import type { Messages } from "@/lib/i18n/messages";
import { GitHubIcon } from "@/components/icons/github-icon";

const GITHUB_URL =
  process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/Mendocan/eilcard";

type Props = {
  locale: Locale;
  m: Messages["nav"];
};

export function SiteNav({ locale, m }: Props) {
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
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
      <Link href="/" className="text-sm font-semibold tracking-tight">
        EIL <span className="text-[var(--color-text-muted)]">Card</span>
      </Link>

      <div className="flex items-center gap-1 sm:gap-2">
        <div className="mr-1 flex rounded-lg border border-[var(--color-border)] p-0.5 text-xs font-medium">
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

        <Link
          href="/docs"
          className="hidden rounded-lg px-3 py-2 text-sm text-[var(--color-text-muted)] transition hover:text-[var(--color-text)] md:inline"
        >
          {m.docs}
        </Link>

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={m.github}
          className="rounded-lg p-2 text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
        >
          <GitHubIcon className="h-5 w-5" />
        </a>

        <Link
          href="/login"
          className="hidden rounded-lg px-3 py-2 text-sm text-[var(--color-text-muted)] transition hover:text-[var(--color-text)] sm:inline"
        >
          {m.signIn}
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-[var(--color-text)] px-3.5 py-2 text-sm font-medium text-[var(--color-bg)] transition hover:opacity-90"
        >
          {m.getStarted}
        </Link>
      </div>
    </nav>
  );
}
