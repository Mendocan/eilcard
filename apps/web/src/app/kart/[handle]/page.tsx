import { notFound } from "next/navigation";
import { getCardByHandle, buildPublicCardJson } from "@/lib/card-service";
import { getCardContentLocale } from "@/lib/card-content-locale";
import { CardView } from "@/components/card-view";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const row = await getCardByHandle(handle);
  if (!row) {
    const locale = await getLocale();
    return { title: t(locale).publicCard.notFound };
  }

  const body = row.body as Record<string, unknown>;
  const pageLocale = getCardContentLocale(body);
  const p = t(pageLocale).publicCard;
  const name =
    row.type === "organization"
      ? (body.name as { official: string })?.official
      : (body.name as { full: string })?.full;

  const description =
    (body.description as { tagline?: string; summary?: string })?.summary ??
    (body.description as { tagline?: string })?.tagline ??
    undefined;

  return {
    title: `${name} — ${p.footer}`,
    description,
  };
}

export default async function CardPage({ params }: Props) {
  const { handle } = await params;
  const row = await getCardByHandle(handle);
  if (!row) notFound();

  const card = await buildPublicCardJson(row);
  const body = row.body as Record<string, unknown>;
  const pageLocale = getCardContentLocale(body);
  const p = t(pageLocale).publicCard;
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
      ? ((body.products as Array<{
          name: string;
          description?: string;
          url?: string;
        }>) ?? [])
      : [];
  const sameAs = (body.same_as as string[] | undefined) ?? [];
  const actions =
    (body.actions as Array<{
      type: string;
      label: string;
      value?: string;
      url?: string;
    }>) ?? [];
  const linkActions = actions
    .filter((a) => a.type === "link" && a.url)
    .map((a) => ({ label: a.label, url: a.url! }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": card.type === "organization" ? "Organization" : "Person",
    name,
    ...(contact.email && { email: `mailto:${contact.email}` }),
    ...(contact.phone && { telephone: contact.phone }),
    ...(contact.website && { url: contact.website }),
    ...(summary ?? tagline ? { description: summary ?? tagline } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <CardView
          labels={p}
          name={name}
          shortName={shortName}
          tagline={tagline}
          summary={summary}
          verified={card.verified}
          products={products}
          linkActions={linkActions}
          sameAs={sameAs}
          contact={contact}
          handle={handle}
        />
      </main>
    </>
  );
}
