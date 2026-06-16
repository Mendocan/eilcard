import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = t(locale);
  return {
    title: m.about.metaTitle,
    description: m.about.metaDescription,
  };
}

export default async function AboutPage() {
  const locale = await getLocale();
  const m = t(locale);

  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} m={m.nav} />

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
          {m.about.eyebrow}
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          {m.about.title}
        </h1>
        <p className="mt-2 text-lg text-[var(--color-text-muted)]">
          {m.about.expansion}
        </p>
        <p className="mt-8 leading-relaxed text-[var(--color-text-muted)]">
          {m.about.intro}
        </p>

        <section className="mt-12">
          <h2 className="text-lg font-semibold">{m.about.notTitle}</h2>
          <ul className="mt-4 space-y-2 text-[var(--color-text-muted)]">
            {m.about.notItems.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[var(--color-text-muted)]">—</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">{m.about.isTitle}</h2>
          <ul className="mt-4 space-y-2 text-[var(--color-text-muted)]">
            {m.about.isItems.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[var(--color-accent)]">+</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="text-lg font-semibold">{m.about.contactTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {m.about.contactBody}
          </p>
          <a
            href={`${process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/Mendocan/eilcard"}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex text-sm font-medium text-[var(--color-accent)] transition hover:opacity-80"
          >
            GitHub Issues →
          </a>
          <Link
            href="/"
            className="mt-6 inline-flex text-sm font-medium text-[var(--color-accent)] transition hover:opacity-80"
          >
            {m.about.backHome}
          </Link>
        </section>
      </main>

      <SiteFooter m={m.footer} />
    </div>
  );
}
