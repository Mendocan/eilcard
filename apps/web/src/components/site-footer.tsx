import Link from "next/link";
import type { Messages } from "@/lib/i18n/messages";
import { GitHubIcon } from "@/components/icons/github-icon";

const GITHUB_URL =
  process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/Mendocan/eilcard";

type Props = {
  m: Messages["footer"];
};

export function SiteFooter({ m }: Props) {
  return (
    <footer className="border-t border-[var(--color-border)]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-sm text-[var(--color-text-muted)] sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <span>{m.product}</span>
          <span className="hidden text-[var(--color-border)] sm:inline">·</span>
          <Link
            href="/about"
            className="transition hover:text-[var(--color-text)]"
          >
            {m.about}
          </Link>
          <span className="hidden text-[var(--color-border)] sm:inline">·</span>
          <Link
            href="/docs"
            className="transition hover:text-[var(--color-text)]"
          >
            {m.docs}
          </Link>
          <span className="hidden text-[var(--color-border)] sm:inline">·</span>
          <Link
            href="/insights/ai-agent-field-note"
            className="transition hover:text-[var(--color-text)]"
          >
            {m.insights}
          </Link>
          <span className="hidden text-[var(--color-border)] sm:inline">·</span>
          <Link
            href="/insights/eil-whitepaper"
            className="transition hover:text-[var(--color-text)]"
          >
            {m.whitepaper}
          </Link>
          <span className="hidden text-[var(--color-border)] sm:inline">·</span>
          <Link
            href="/playground"
            className="transition hover:text-[var(--color-text)]"
          >
            {m.playground}
          </Link>
          <span className="hidden text-[var(--color-border)] sm:inline">·</span>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition hover:text-[var(--color-text)]"
          >
            <GitHubIcon className="h-4 w-4" />
            {m.github}
          </a>
        </div>
        <p className="text-center text-xs">{m.tagline}</p>
        <p className="text-center text-xs">{m.copyright}</p>
      </div>
    </footer>
  );
}
