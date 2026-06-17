import type { Metadata } from "next";
import Link from "next/link";
import { PlaygroundPanel } from "@/components/playground-panel";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = t(locale);
  return {
    title: m.playground.metaTitle,
    description: m.playground.metaDescription,
  };
}

export default async function PlaygroundPage() {
  const locale = await getLocale();
  const m = t(locale);
  const p = m.playground;

  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} m={m.nav} />

      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
          {p.eyebrow}
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          {p.title}
        </h1>
        <p className="mt-6 max-w-3xl leading-relaxed text-[var(--color-text-muted)]">
          {p.intro}
        </p>

        <div className="mt-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-6 sm:p-8">
          <PlaygroundPanel m={p} />
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-sm font-medium">
          <Link
            href="/docs/agents"
            className="text-[var(--color-accent)] transition hover:opacity-80"
          >
            {p.linkAgents}
          </Link>
          <Link
            href="/docs"
            className="text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
          >
            {p.linkDocs}
          </Link>
          <Link
            href="/"
            className="text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
          >
            {p.backHome}
          </Link>
        </div>
      </main>

      <SiteFooter m={m.footer} />
    </div>
  );
}
