"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Messages } from "@/lib/i18n/messages";
import { mapDashboardApiError } from "@/lib/i18n/map-dashboard-api-error";
import { PublicDataNotice } from "@/components/public-data-notice";
import type { CardEdition, OfferingKind } from "@digitalcard/schema";
import { isBusinessEdition, countOfferingNodes } from "@/lib/offering-validation";
import type { Offering } from "@digitalcard/schema";

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]";

type ProductRow = {
  id: string;
  name: string;
  description: string;
  url: string;
};

type LinkRow = {
  label: string;
  url: string;
};

type OfferingItemRow = {
  id: string;
  name: string;
  description: string;
  url: string;
  kind: OfferingKind;
};

type OfferingRow = {
  id: string;
  name: string;
  description: string;
  url: string;
  kind: OfferingKind;
  items: OfferingItemRow[];
};

type InitialOrg = {
  type: "organization";
  nameOfficial: string;
  nameShort: string;
  tagline: string;
  summary: string;
  email: string;
  phone: string;
  website: string;
  domain: string;
  products: ProductRow[];
  offerings: OfferingRow[];
  contentLocale: "en" | "tr" | "";
  sameAsText: string;
};

type InitialPerson = {
  type: "person";
  nameFull: string;
  tagline: string;
  summary: string;
  email: string;
  phone: string;
  website: string;
  domain: string;
  sameAsText: string;
  links: LinkRow[];
  preservedActions: Array<{
    type: string;
    label: string;
    value?: string;
    url?: string;
  }>;
};

type Props = {
  handle: string;
  initial: InitialOrg | InitialPerson;
  edition: CardEdition;
  allowedEditions: CardEdition[];
  maxProducts: number;
  maxOfferings: number;
  m: Messages["dashboard"];
};

function editionLabel(edition: CardEdition, m: Messages["dashboard"]) {
  if (edition === "business") return m.editionBusiness;
  if (edition === "registry_plus") return m.editionRegistryPlus;
  return m.editionCore;
}

function serializeOfferings(rows: OfferingRow[]): Offering[] {
  return rows
    .filter((row) => row.name.trim())
    .map((row, index) => ({
      id: row.id.trim() || slugId(row.name, index),
      name: row.name.trim(),
      kind: row.kind,
      ...(row.description.trim() && { description: row.description.trim() }),
      ...(row.url.trim() && { url: row.url.trim() }),
      ...(row.items.some((item) => item.name.trim())
        ? {
            items: row.items
              .filter((item) => item.name.trim())
              .map((item, itemIndex) => ({
                id: item.id.trim() || slugId(item.name, itemIndex),
                name: item.name.trim(),
                kind: item.kind,
                ...(item.description.trim() && {
                  description: item.description.trim(),
                }),
                ...(item.url.trim() && { url: item.url.trim() }),
              })),
          }
        : {}),
    }));
}

function slugId(name: string, index: number) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `product-${index + 1}`;
}

export function EditCardForm({
  handle,
  initial,
  edition: initialEdition,
  allowedEditions,
  maxProducts,
  maxOfferings,
  m,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const [nameOfficial, setNameOfficial] = useState(
    initial.type === "organization" ? initial.nameOfficial : ""
  );
  const [nameShort, setNameShort] = useState(
    initial.type === "organization" ? initial.nameShort : ""
  );
  const [nameFull, setNameFull] = useState(
    initial.type === "person" ? initial.nameFull : ""
  );
  const [tagline, setTagline] = useState(initial.tagline);
  const [summary, setSummary] = useState(initial.summary);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [website, setWebsite] = useState(initial.website);
  const [domain, setDomain] = useState(initial.domain);
  const [sameAsText, setSameAsText] = useState(initial.sameAsText);
  const [products, setProducts] = useState<ProductRow[]>(
    initial.type === "organization" ? initial.products : []
  );
  const [offerings, setOfferings] = useState<OfferingRow[]>(
    initial.type === "organization" ? initial.offerings : []
  );
  const [cardEdition, setCardEdition] = useState<CardEdition>(initialEdition);
  const [contentLocale, setContentLocale] = useState<"en" | "tr" | "">(
    initial.type === "organization" ? initial.contentLocale : ""
  );
  const [links, setLinks] = useState<LinkRow[]>(
    initial.type === "person" ? initial.links : []
  );

  function updateLink(index: number, field: keyof LinkRow, value: string) {
    setLinks((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function addLink() {
    if (links.length >= 10) return;
    setLinks((rows) => [...rows, { label: "", url: "" }]);
  }

  function removeLink(index: number) {
    setLinks((rows) => rows.filter((_, i) => i !== index));
  }

  function updateProduct(index: number, field: keyof ProductRow, value: string) {
    setProducts((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function addProduct() {
    if (products.length >= maxProducts) return;
    setProducts((rows) => [
      ...rows,
      { id: `product-${rows.length + 1}`, name: "", description: "", url: "" },
    ]);
  }

  function removeProduct(index: number) {
    setProducts((rows) => rows.filter((_, i) => i !== index));
  }

  function updateOffering(
    index: number,
    field: keyof OfferingRow,
    value: string | OfferingKind
  ) {
    setOfferings((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function updateOfferingItem(
    offeringIndex: number,
    itemIndex: number,
    field: keyof OfferingItemRow,
    value: string | OfferingKind
  ) {
    setOfferings((rows) =>
      rows.map((row, i) =>
        i === offeringIndex
          ? {
              ...row,
              items: row.items.map((item, j) =>
                j === itemIndex ? { ...item, [field]: value } : item
              ),
            }
          : row
      )
    );
  }

  function addOffering() {
    const serialized = serializeOfferings(offerings);
    if (countOfferingNodes(serialized) >= maxOfferings) return;
    setOfferings((rows) => [
      ...rows,
      {
        id: `line-${rows.length + 1}`,
        name: "",
        description: "",
        url: "",
        kind: "line",
        items: [],
      },
    ]);
  }

  function removeOffering(index: number) {
    setOfferings((rows) => rows.filter((_, i) => i !== index));
  }

  function addOfferingItem(offeringIndex: number) {
    const serialized = serializeOfferings(offerings);
    if (countOfferingNodes(serialized) >= maxOfferings) return;
    setOfferings((rows) =>
      rows.map((row, i) =>
        i === offeringIndex
          ? {
              ...row,
              items: [
                ...row.items,
                {
                  id: `item-${row.items.length + 1}`,
                  name: "",
                  description: "",
                  url: "",
                  kind: "product",
                },
              ],
            }
          : row
      )
    );
  }

  function removeOfferingItem(offeringIndex: number, itemIndex: number) {
    setOfferings((rows) =>
      rows.map((row, i) =>
        i === offeringIndex
          ? { ...row, items: row.items.filter((_, j) => j !== itemIndex) }
          : row
      )
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    setLoading(true);

    const same_as = sameAsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const contact = {
      ...(email && { email }),
      ...(phone && { phone }),
      ...(website && { website }),
    };

    const description = {
      ...(tagline && { tagline }),
      ...(summary && { summary }),
    };

    const body: Record<string, unknown> = {
      contact,
      ...(Object.keys(description).length > 0 ? { description } : {}),
      ...(same_as.length > 0 ? { same_as } : { same_as: [] }),
      ...(domain ? { domain } : {}),
    };

    if (initial.type === "organization") {
      body.name = {
        official: nameOfficial,
        ...(nameShort && { short: nameShort }),
      };
      body.edition = cardEdition;
      body.products = products
        .filter((p) => p.name.trim())
        .map((p, index) => ({
          id: p.id.trim() || slugId(p.name, index),
          name: p.name.trim(),
          ...(p.description.trim() && { description: p.description.trim() }),
          ...(p.url.trim() && { url: p.url.trim() }),
        }));
      if (isBusinessEdition(cardEdition)) {
        if (contentLocale) {
          body.content_locale = contentLocale;
        }
        body.offerings = serializeOfferings(offerings);
      }
    } else {
      body.name = { full: nameFull };
      const linkActions = links
        .filter((l) => l.label.trim() && l.url.trim())
        .map((l) => ({
          type: "link" as const,
          label: l.label.trim(),
          url: l.url.trim(),
        }));
      body.actions = [...initial.preservedActions, ...linkActions];
    }

    const res = await fetch(`/api/v1/cards/${handle}/update`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const data = (await res.json()) as {
        error?: string;
        code?: string;
        reason?: string;
      };
      setError(mapDashboardApiError(data, m, m.saveFailed));
      return;
    }

    setStatus(m.saveSuccess);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-[var(--color-text-muted)]">{m.editCardSubtitle}</p>

      <PublicDataNotice
        title={m.publicDataNoticeTitle}
        body={m.publicDataNoticeBody}
      />

      {initial.type === "organization" ? (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium">{m.officialName}</label>
            <input
              type="text"
              required
              value={nameOfficial}
              onChange={(e) => setNameOfficial(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{m.shortName}</label>
            <input
              type="text"
              value={nameShort}
              onChange={(e) => setNameShort(e.target.value)}
              className={inputClass}
            />
          </div>

          {allowedEditions.length > 1 && (
            <div>
              <label className="mb-1 block text-sm font-medium">{m.edition}</label>
              <select
                value={cardEdition}
                onChange={(e) => setCardEdition(e.target.value as CardEdition)}
                className={inputClass}
              >
                {allowedEditions.map((value) => (
                  <option key={value} value={value}>
                    {editionLabel(value, m)}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                {m.editionHint}
              </p>
            </div>
          )}
        </>
      ) : (
        <div>
          <label className="mb-1 block text-sm font-medium">{m.fullName}</label>
          <input
            type="text"
            required
            value={nameFull}
            onChange={(e) => setNameFull(e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">{m.tagline}</label>
        <input
          type="text"
          maxLength={160}
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          className={inputClass}
        />
      </div>

      <fieldset className="space-y-4 rounded-lg border border-[var(--color-border)] p-4">
        <legend className="px-2 text-sm font-semibold">{m.agentDiscoveryTitle}</legend>
        <p className="text-xs text-[var(--color-text-muted)]">{m.agentDiscoveryIntro}</p>

        <div>
          <label className="mb-1 block text-sm font-medium">{m.summary}</label>
          <textarea
            rows={4}
            maxLength={2000}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">{m.summaryHint}</p>
        </div>

        {initial.type === "organization" && (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">{m.products}</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">{m.productsHint}</p>
            </div>
            {products.map((product, index) => (
              <div
                key={`${product.id}-${index}`}
                className="space-y-2 rounded-lg border border-[var(--color-border)]/60 p-3"
              >
                <input
                  type="text"
                  placeholder={m.productName}
                  value={product.name}
                  onChange={(e) => updateProduct(index, "name", e.target.value)}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder={m.productDescription}
                  value={product.description}
                  onChange={(e) => updateProduct(index, "description", e.target.value)}
                  className={inputClass}
                />
                <input
                  type="url"
                  placeholder={m.productUrl}
                  value={product.url}
                  onChange={(e) => updateProduct(index, "url", e.target.value)}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removeProduct(index)}
                  className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
                >
                  {m.removeProduct}
                </button>
              </div>
            ))}
            {products.length < maxProducts && (
              <button
                type="button"
                onClick={addProduct}
                className="text-sm font-medium text-[var(--color-accent)] hover:opacity-80"
              >
                {m.addProduct}
              </button>
            )}
          </div>
        )}

        {initial.type === "organization" && isBusinessEdition(cardEdition) && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">{m.contentLocale}</label>
              <select
                value={contentLocale}
                onChange={(e) =>
                  setContentLocale(e.target.value as "en" | "tr" | "")
                }
                className={inputClass}
              >
                <option value="">—</option>
                <option value="en">English</option>
                <option value="tr">Türkçe</option>
              </select>
              <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                {m.contentLocaleHint}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">{m.offerings}</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {m.offeringsHint}
              </p>
            </div>
            {offerings.map((offering, offeringIndex) => (
              <div
                key={`${offering.id}-${offeringIndex}`}
                className="space-y-2 rounded-lg border border-[var(--color-border)]/60 p-3"
              >
                <select
                  value={offering.kind}
                  onChange={(e) =>
                    updateOffering(
                      offeringIndex,
                      "kind",
                      e.target.value as OfferingKind
                    )
                  }
                  className={inputClass}
                >
                  <option value="line">{m.offeringKindLine}</option>
                  <option value="product">{m.offeringKindProduct}</option>
                  <option value="service">{m.offeringKindService}</option>
                </select>
                <input
                  type="text"
                  placeholder={m.offeringName}
                  value={offering.name}
                  onChange={(e) =>
                    updateOffering(offeringIndex, "name", e.target.value)
                  }
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder={m.offeringDescription}
                  value={offering.description}
                  onChange={(e) =>
                    updateOffering(offeringIndex, "description", e.target.value)
                  }
                  className={inputClass}
                />
                <input
                  type="url"
                  placeholder={m.offeringUrl}
                  value={offering.url}
                  onChange={(e) =>
                    updateOffering(offeringIndex, "url", e.target.value)
                  }
                  className={inputClass}
                />
                {offering.items.map((item, itemIndex) => (
                  <div
                    key={`${item.id}-${itemIndex}`}
                    className="ml-3 space-y-2 border-l border-[var(--color-border)] pl-3"
                  >
                    <input
                      type="text"
                      placeholder={m.offeringItemName}
                      value={item.name}
                      onChange={(e) =>
                        updateOfferingItem(
                          offeringIndex,
                          itemIndex,
                          "name",
                          e.target.value
                        )
                      }
                      className={inputClass}
                    />
                    <input
                      type="text"
                      placeholder={m.offeringDescription}
                      value={item.description}
                      onChange={(e) =>
                        updateOfferingItem(
                          offeringIndex,
                          itemIndex,
                          "description",
                          e.target.value
                        )
                      }
                      className={inputClass}
                    />
                    <input
                      type="url"
                      placeholder={m.offeringUrl}
                      value={item.url}
                      onChange={(e) =>
                        updateOfferingItem(
                          offeringIndex,
                          itemIndex,
                          "url",
                          e.target.value
                        )
                      }
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => removeOfferingItem(offeringIndex, itemIndex)}
                      className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
                    >
                      {m.removeOfferingItem}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOfferingItem(offeringIndex)}
                  className="text-xs font-medium text-[var(--color-accent)] hover:opacity-80"
                >
                  {m.addOfferingItem}
                </button>
                <button
                  type="button"
                  onClick={() => removeOffering(offeringIndex)}
                  className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
                >
                  {m.removeOffering}
                </button>
              </div>
            ))}
            {countOfferingNodes(serializeOfferings(offerings)) < maxOfferings && (
              <button
                type="button"
                onClick={addOffering}
                className="text-sm font-medium text-[var(--color-accent)] hover:opacity-80"
              >
                {m.addOffering}
              </button>
            )}
          </div>
        )}

        {initial.type === "person" && (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">{m.personLinks}</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">{m.personLinksHint}</p>
            </div>
            {links.map((link, index) => (
              <div
                key={index}
                className="space-y-2 rounded-lg border border-[var(--color-border)]/60 p-3"
              >
                <input
                  type="text"
                  placeholder={m.linkLabel}
                  value={link.label}
                  onChange={(e) => updateLink(index, "label", e.target.value)}
                  className={inputClass}
                />
                <input
                  type="url"
                  placeholder={m.linkUrl}
                  value={link.url}
                  onChange={(e) => updateLink(index, "url", e.target.value)}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removeLink(index)}
                  className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
                >
                  {m.removeLink}
                </button>
              </div>
            ))}
            {links.length < 10 && (
              <button
                type="button"
                onClick={addLink}
                className="text-sm font-medium text-[var(--color-accent)] hover:opacity-80"
              >
                {m.addLink}
              </button>
            )}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">{m.sameAs}</label>
          <textarea
            rows={3}
            value={sameAsText}
            onChange={(e) => setSameAsText(e.target.value)}
            className={inputClass}
            placeholder="https://instagram.com/..."
          />
          <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">{m.sameAsHint}</p>
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-lg border border-[var(--color-border)] p-4">
        <legend className="px-2 text-sm font-medium">{m.contact}</legend>
        <input
          type="email"
          placeholder={m.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <input
          type="tel"
          placeholder={m.phone}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
        />
        <input
          type="url"
          placeholder={m.website}
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className={inputClass}
        />
      </fieldset>

      <div>
        <label className="mb-1 block text-sm font-medium">{m.domainOptional}</label>
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
      {status && (
        <p className="text-sm text-[var(--color-success)]">{status}</p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--color-text)] px-4 py-2.5 text-sm font-medium text-[var(--color-bg)] transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? m.saving : m.saveCard}
        </button>
        <Link
          href={`/dashboard/${handle}`}
          className="rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium transition hover:bg-[var(--color-bg)]"
        >
          {m.backToCard}
        </Link>
      </div>
    </form>
  );
}
