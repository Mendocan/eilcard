import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-header";
import { GitHubIcon } from "@/components/icons/github-icon";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";

const GITHUB_URL =
  process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/Mendocan/eilcard";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = t(locale);
  return {
    title: m.fieldNote.metaTitle,
    description: m.fieldNote.metaDescription,
  };
}

export default async function FieldNotePage() {
  const locale = await getLocale();
  const m = t(locale);
  const f = m.fieldNote;

  return (
    <div className="min-h-screen">
      <SiteNav locale={locale} m={m.nav} />

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
          {f.eyebrow}
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          {f.title}
        </h1>
        <p className="mt-2 text-lg text-[var(--color-text-muted)]">{f.subtitle}</p>
        <p className="mt-8 leading-relaxed text-[var(--color-text-muted)]">
          {f.intro}
        </p>
        <p className="mt-4 text-sm text-[var(--color-text-muted)]/80">
          {f.disclaimer}
        </p>

        <div className="mt-12 space-y-10">
          {f.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-3 leading-relaxed text-[var(--color-text-muted)]">
                {section.body}
              </p>
              <blockquote className="mt-4 border-l-2 border-[var(--color-accent)] pl-4 text-sm italic text-[var(--color-text-muted)]">
                {section.quote}
              </blockquote>
            </section>
          ))}
        </div>

        <section className="mt-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-6">
          <h2 className="text-lg font-semibold">{f.takeawayTitle}</h2>
          <p className="mt-3 leading-relaxed text-[var(--color-text-muted)]">
            {f.takeaway}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center rounded-lg bg-[var(--color-text)] px-4 py-2.5 text-sm font-medium text-[var(--color-bg)] transition hover:opacity-90"
            >
              {f.ctaPrimary}
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium transition hover:border-[var(--color-border-strong)]"
            >
              <GitHubIcon className="h-4 w-4" />
              {f.ctaSecondary}
            </a>
          </div>
          <Link
            href="/"
            className="mt-6 inline-flex text-sm font-medium text-[var(--color-accent)] transition hover:opacity-80"
          >
            {f.backHome}
          </Link>
        </section>
      </main>

      <SiteFooter m={m.footer} />
    </div>
  );
}
