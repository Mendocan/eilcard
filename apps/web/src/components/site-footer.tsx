import Link from "next/link";
import type { Messages } from "@/lib/i18n/messages";
import {
  DEFAULT_HELLO_EMAIL,
  DEFAULT_SUPPORT_EMAIL,
} from "@/lib/platform-config";
import { GitHubIcon } from "@/components/icons/github-icon";

const GITHUB_URL =
  process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/Mendocan/eilcard";

type Props = {
  m: Messages["footer"];
  helloEmail?: string;
  supportEmail?: string;
};

function Dot() {
  return <span className="hidden text-[var(--color-border)] sm:inline">·</span>;
}

function MailLink({ email }: { email: string }) {
  return (
    <a
      href={`mailto:${email}`}
      className="text-[var(--color-text)] transition hover:text-[var(--color-accent)]"
    >
      {email}
    </a>
  );
}

export function SiteFooter({
  m,
  helloEmail = DEFAULT_HELLO_EMAIL,
  supportEmail = DEFAULT_SUPPORT_EMAIL,
}: Props) {
  const navLink = "transition hover:text-[var(--color-text)]";

  return (
    <footer className="border-t border-[var(--color-border)]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-sm text-[var(--color-text-muted)] sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <span>{m.product}</span>
          <Dot />
          <Link href="/about" className={navLink}>
            {m.about}
          </Link>
          <Dot />
          <Link href="/docs" className={navLink}>
            {m.docs}
          </Link>
          <Dot />
          <Link href="/pricing" className={navLink}>
            {m.pricing}
          </Link>
          <Dot />
          <Link href="/insights/ai-agent-field-note" className={navLink}>
            {m.insights}
          </Link>
          <Dot />
          <Link href="/insights/eil-whitepaper" className={navLink}>
            {m.whitepaper}
          </Link>
          <Dot />
          <Link href="/playground" className={navLink}>
            {m.playground}
          </Link>
          <Dot />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 ${navLink}`}
          >
            <GitHubIcon className="h-4 w-4" />
            {m.github}
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
          <Link href="/legal/terms" className={navLink}>
            {m.terms}
          </Link>
          <Dot />
          <Link href="/legal/privacy" className={navLink}>
            {m.privacy}
          </Link>
          <Dot />
          <Link href="/legal/refund" className={navLink}>
            {m.refunds}
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-xs">
          <span>{m.tagline}</span>
          <Dot />
          <span>
            {m.contact}: <MailLink email={helloEmail} />
            <span className="mx-1.5 text-[var(--color-border)]">·</span>
            {m.contactSupport}: <MailLink email={supportEmail} />
          </span>
        </div>
        <p className="text-center text-xs">{m.copyright}</p>
      </div>
    </footer>
  );
}
