import { notFound } from "next/navigation";
import { getCardByHandle, buildCardJson } from "@/lib/card-service";
import type { Metadata } from "next";
import Link from "next/link";

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const row = await getCardByHandle(handle);
  if (!row) return { title: "Kart bulunamadı" };

  const body = row.body as Record<string, unknown>;
  const name =
    row.type === "organization"
      ? (body.name as { official: string })?.official
      : (body.name as { full: string })?.full;

  const description =
    (body.description as { tagline?: string })?.tagline ?? undefined;

  return {
    title: `${name} — Dijital Kart`,
    description,
  };
}

export default async function CardPage({ params }: Props) {
  const { handle } = await params;
  const row = await getCardByHandle(handle);
  if (!row) notFound();

  const card = buildCardJson(row);
  const body = row.body as Record<string, unknown>;
  const contact = card.contact;

  const name =
    card.type === "organization"
      ? (card as { name: { official: string } }).name.official
      : (card as { name: { full: string } }).name.full;

  const shortName =
    card.type === "organization"
      ? (body.name as { short?: string })?.short
      : undefined;

  const tagline =
    (body.description as { tagline?: string })?.tagline ?? undefined;
  const summary =
    (body.description as { summary?: string })?.summary ?? undefined;
  const products =
    card.type === "organization"
      ? ((body.products as Array<{ name: string; description?: string; url?: string }>) ??
        [])
      : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": card.type === "organization" ? "Organization" : "Person",
    name,
    ...(contact.email && { email: `mailto:${contact.email}` }),
    ...(contact.phone && { telephone: contact.phone }),
    ...(contact.website && { url: contact.website }),
    ...(tagline && { description: tagline }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
          <div className="mb-6 text-center">
            {card.verified && (
              <span className="mb-2 inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                Doğrulanmış
              </span>
            )}
            <h1 className="text-2xl font-bold">{name}</h1>
            {shortName && (
              <p className="text-[var(--color-text-muted)]">{shortName}</p>
            )}
            {tagline && (
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {tagline}
              </p>
            )}
            {summary && (
              <p className="mt-3 text-left text-sm leading-relaxed text-[var(--color-text-muted)]">
                {summary}
              </p>
            )}
          </div>

          {products.length > 0 && (
            <div className="mb-6 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                Ürünler
              </p>
              <ul className="space-y-2">
                {products.map((product) => (
                  <li
                    key={product.name}
                    className="rounded-lg border border-[var(--color-border)] px-4 py-3 text-sm"
                  >
                    <p className="font-medium">{product.name}</p>
                    {product.description && (
                      <p className="mt-1 text-[var(--color-text-muted)]">
                        {product.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] px-4 py-3 text-sm transition hover:bg-[var(--color-bg)]"
              >
                <span className="text-[var(--color-text-muted)]">E-posta</span>
                <span className="ml-auto font-medium">{contact.email}</span>
              </a>
            )}
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] px-4 py-3 text-sm transition hover:bg-[var(--color-bg)]"
              >
                <span className="text-[var(--color-text-muted)]">Telefon</span>
                <span className="ml-auto font-medium">{contact.phone}</span>
              </a>
            )}
            {contact.website && (
              <a
                href={contact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] px-4 py-3 text-sm transition hover:bg-[var(--color-bg)]"
              >
                <span className="text-[var(--color-text-muted)]">Website</span>
                <span className="ml-auto font-medium">
                  {new URL(contact.website).hostname}
                </span>
              </a>
            )}
          </div>

          <div className="mt-6 flex gap-2">
            <Link
              href={`/api/v1/cards/${handle}/vcard`}
              className="flex-1 rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-center text-sm font-medium transition hover:bg-[var(--color-bg)]"
            >
              vCard
            </Link>
            <Link
              href={`/api/v1/cards/${handle}`}
              className="flex-1 rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-center text-sm font-medium transition hover:bg-[var(--color-bg)]"
            >
              JSON
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
            Dijital Kart · @{handle}
          </p>
        </div>
      </main>
    </>
  );
}
