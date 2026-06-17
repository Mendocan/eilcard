import type { Metadata } from "next";
import Link from "next/link";
import { CodeSnippet } from "@/components/code-snippet";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getDocsSnippets } from "@/lib/docs-snippets";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";

const NPM_SDK_URL = "https://www.npmjs.com/package/@digitalcard/sdk";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://eilcard.com";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = t(locale);
  return {
    title: m.docs.metaTitle,
    description: m.docs.metaDescription,
  };
}

export default async function DocsPage() {
  const locale = await getLocale();
  const m = t(locale);
  const d = m.docs;
  const snippets = getDocsSnippets(BASE_URL);

  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} m={m.nav} />

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
          {d.eyebrow}
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          {d.title}
        </h1>
        <p className="mt-6 leading-relaxed text-[var(--color-text-muted)]">
          {d.intro}
        </p>

        <section className="mt-12">
          <h2 className="text-lg font-semibold">{d.sdkTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {d.sdkBody}
          </p>
          <div className="mt-4 space-y-4">
            <CodeSnippet
              code={snippets.install}
              copyLabel={d.copy}
              copiedLabel={d.copied}
            />
            <CodeSnippet
              code={snippets.resolve}
              copyLabel={d.copy}
              copiedLabel={d.copied}
            />
          </div>
          <a
            href={NPM_SDK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex text-sm font-medium text-[var(--color-accent)] transition hover:opacity-80"
          >
            {d.npmLink} →
          </a>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold">{d.apiTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {d.apiBody}
          </p>
          <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--color-border)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                  <th className="px-4 py-3 font-medium">{d.methodCol}</th>
                  <th className="px-4 py-3 font-medium">{d.pathCol}</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">
                    {d.descCol}
                  </th>
                </tr>
              </thead>
              <tbody className="text-[var(--color-text-muted)]">
                {d.endpoints.map((row) => (
                  <tr
                    key={row.path}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-accent)]">
                      {row.method}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{row.path}</td>
                    <td className="hidden px-4 py-3 sm:table-cell">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-4">
            <CodeSnippet
              code={snippets.curlResolve}
              copyLabel={d.copy}
              copiedLabel={d.copied}
            />
            <CodeSnippet
              code={snippets.curlHandle}
              copyLabel={d.copy}
              copiedLabel={d.copied}
            />
          </div>
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">{d.apiNote}</p>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold">{d.discoveryTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {d.discoveryBody}
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-[var(--color-text-muted)]">
            {d.discoverySteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <div className="mt-4 space-y-4">
            <CodeSnippet
              code={snippets.wellKnown}
              copyLabel={d.copy}
              copiedLabel={d.copied}
            />
          </div>
          <p className="mt-4 font-mono text-xs text-[var(--color-text-muted)]">
            {snippets.dnsTxt}
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">{d.dnsNote}</p>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold">{d.responseTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {d.responseBody}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-[var(--color-text-muted)]">
            {d.responseFields.map((field) => (
              <li key={field} className="flex gap-2">
                <span className="text-[var(--color-accent)]">+</span>
                {field}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-6">
          <h2 className="text-lg font-semibold">{d.ctaTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {d.ctaBody}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center rounded-lg bg-[var(--color-text)] px-4 py-2.5 text-sm font-medium text-[var(--color-bg)] transition hover:opacity-90"
            >
              {d.ctaPrimary}
            </Link>
            <Link
              href="/insights/ai-agent-field-note"
              className="inline-flex items-center rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium transition hover:border-[var(--color-border-strong)]"
            >
              {d.ctaSecondary}
            </Link>
          </div>
          <Link
            href="/"
            className="mt-6 inline-flex text-sm font-medium text-[var(--color-accent)] transition hover:opacity-80"
          >
            {d.backHome}
          </Link>
        </section>
      </main>

      <SiteFooter m={m.footer} />
    </div>
  );
}
