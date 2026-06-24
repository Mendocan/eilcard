import Link from "next/link";
import type { Messages } from "@/lib/i18n/messages";

export type CardViewProduct = {
  name: string;
  description?: string;
  url?: string;
};

export type CardViewOfferingItem = {
  name: string;
  description?: string;
  url?: string;
  kind?: string;
};

export type CardViewOffering = {
  name: string;
  description?: string;
  url?: string;
  kind?: string;
  items?: CardViewOfferingItem[];
};

export type CardViewLink = {
  label: string;
  url: string;
};

export type CardViewContact = {
  email?: string;
  phone?: string;
  website?: string;
};

type Props = {
  labels: Messages["publicCard"];
  name: string;
  shortName?: string;
  tagline?: string;
  summary?: string;
  verified?: boolean;
  products?: CardViewProduct[];
  offerings?: CardViewOffering[];
  linkActions?: CardViewLink[];
  sameAs?: string[];
  contact?: CardViewContact;
  handle: string;
  /** Demo cards hide vCard/JSON registry links */
  demo?: boolean;
  demoBadge?: string;
  footerNote?: string;
};

function profileLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function CardView({
  labels,
  name,
  shortName,
  tagline,
  summary,
  verified,
  products = [],
  offerings = [],
  linkActions = [],
  sameAs = [],
  contact,
  handle,
  demo,
  demoBadge,
  footerNote,
}: Props) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
      <div className="mb-6 text-center">
        {demo && demoBadge && (
          <span className="mb-2 inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-muted)]">
            {demoBadge}
          </span>
        )}
        {!demo && verified && (
          <span className="mb-2 inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
            {labels.verified}
          </span>
        )}
        <h1 className="text-2xl font-bold">{name}</h1>
        {shortName && (
          <p className="text-[var(--color-text-muted)]">{shortName}</p>
        )}
        {tagline && (
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{tagline}</p>
        )}
        {summary && (
          <p className="mt-3 text-left text-sm leading-relaxed text-[var(--color-text-muted)]">
            {summary}
          </p>
        )}
      </div>

      {offerings.length > 0 && (
        <div className="mb-6 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            {labels.offerings}
          </p>
          <ul className="space-y-3">
            {offerings.map((offering) => (
              <li
                key={offering.name}
                className="rounded-lg border border-[var(--color-border)] px-4 py-3 text-sm"
              >
                {offering.url ? (
                  <a
                    href={offering.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[var(--color-accent)] hover:opacity-80"
                  >
                    {offering.name}
                  </a>
                ) : (
                  <p className="font-medium">{offering.name}</p>
                )}
                {offering.description && (
                  <p className="mt-1 text-[var(--color-text-muted)]">
                    {offering.description}
                  </p>
                )}
                {offering.items && offering.items.length > 0 && (
                  <ul className="mt-2 space-y-1 border-l border-[var(--color-border)] pl-3">
                    {offering.items.map((item) => (
                      <li key={item.name} className="text-sm">
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--color-accent)] hover:opacity-80"
                          >
                            {item.name}
                          </a>
                        ) : (
                          <span>{item.name}</span>
                        )}
                        {item.description && (
                          <span className="text-[var(--color-text-muted)]">
                            {" "}
                            — {item.description}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {products.length > 0 && (
        <div className="mb-6 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            {labels.products}
          </p>
          <ul className="space-y-2">
            {products.map((product) => (
              <li
                key={product.name}
                className="rounded-lg border border-[var(--color-border)] px-4 py-3 text-sm"
              >
                {product.url ? (
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[var(--color-accent)] hover:opacity-80"
                  >
                    {product.name}
                  </a>
                ) : (
                  <p className="font-medium">{product.name}</p>
                )}
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

      {linkActions.length > 0 && (
        <div className="mb-6 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            {labels.links}
          </p>
          <ul className="space-y-2">
            {linkActions.map((action) => (
              <li key={`${action.label}-${action.url}`}>
                <a
                  href={action.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] px-4 py-3 text-sm transition hover:bg-[var(--color-bg)]"
                >
                  <span className="font-medium">{action.label}</span>
                  <span className="ml-auto truncate text-xs text-[var(--color-text-muted)]">
                    {profileLabel(action.url)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sameAs.length > 0 && (
        <div className="mb-6 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            {labels.profiles}
          </p>
          <ul className="space-y-2">
            {sameAs.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-[var(--color-border)] px-4 py-3 text-sm font-medium transition hover:bg-[var(--color-bg)]"
                >
                  {profileLabel(url)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {contact && (contact.email || contact.phone || contact.website) && (
        <div className="space-y-3">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] px-4 py-3 text-sm transition hover:bg-[var(--color-bg)]"
            >
              <span className="text-[var(--color-text-muted)]">{labels.email}</span>
              <span className="ml-auto font-medium">{contact.email}</span>
            </a>
          )}
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] px-4 py-3 text-sm transition hover:bg-[var(--color-bg)]"
            >
              <span className="text-[var(--color-text-muted)]">{labels.phone}</span>
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
              <span className="text-[var(--color-text-muted)]">{labels.website}</span>
              <span className="ml-auto font-medium">
                {profileLabel(contact.website)}
              </span>
            </a>
          )}
        </div>
      )}

      {!demo && (
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
      )}

      <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
        {footerNote ?? `${labels.footer} · @${handle}`}
      </p>
    </div>
  );
}
