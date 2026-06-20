"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Messages } from "@/lib/i18n/messages";
import { mapDashboardApiError } from "@/lib/i18n/map-dashboard-api-error";
import { PublicDataNotice } from "@/components/public-data-notice";

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]";

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

type Props = {
  m: Messages["dashboard"];
  maxOrgCards: number;
  maxProducts: number;
  atCardLimit: boolean;
};

function slugId(name: string, index: number) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `product-${index + 1}`;
}

export function NewCardForm({ m, maxOrgCards, maxProducts, atCardLimit }: Props) {
  const router = useRouter();
  const orgAllowed = maxOrgCards > 0;
  const [type, setType] = useState<"organization" | "person">(
    orgAllowed ? "organization" : "person"
  );
  const [handle, setHandle] = useState("");
  const [nameOfficial, setNameOfficial] = useState("");
  const [nameShort, setNameShort] = useState("");
  const [nameFull, setNameFull] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [domain, setDomain] = useState("");
  const [tagline, setTagline] = useState("");
  const [summary, setSummary] = useState("");
  const [sameAsText, setSameAsText] = useState("");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const same_as = sameAsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const description = {
      ...(tagline && { tagline }),
      ...(summary && { summary }),
    };

    const body: Record<string, unknown> = {
      type,
      handle: handle.toLowerCase(),
      contact: {
        ...(email && { email }),
        ...(phone && { phone }),
        ...(website && { website }),
      },
      ...(Object.keys(description).length > 0 ? { description } : {}),
      ...(same_as.length > 0 ? { same_as } : {}),
      ...(domain && { domain }),
    };

    if (type === "organization") {
      body.name = {
        official: nameOfficial,
        ...(nameShort && { short: nameShort }),
      };
      const productList = products
        .filter((p) => p.name.trim())
        .map((p, index) => ({
          id: p.id.trim() || slugId(p.name, index),
          name: p.name.trim(),
          ...(p.description.trim() && { description: p.description.trim() }),
          ...(p.url.trim() && { url: p.url.trim() }),
        }));
      if (productList.length > 0) {
        body.products = productList;
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
      if (linkActions.length > 0) {
        body.actions = linkActions;
      }
    }

    const res = await fetch("/api/v1/cards", {
      method: "POST",
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
      setError(mapDashboardApiError(data, m, m.createFailed));
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (atCardLimit) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-6">
        <p className="font-medium">{m.atLimit}</p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{m.upgradeHint}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">{m.newCardTitle}</h1>

      <PublicDataNotice
        title={m.publicDataNoticeTitle}
        body={m.publicDataNoticeBody}
      />

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium">{m.cardType}</label>
          <div className="flex gap-3">
            {(["organization", "person"] as const).map((t) => {
              const disabled = t === "organization" && !orgAllowed;
              return (
                <button
                  key={t}
                  type="button"
                  disabled={disabled}
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    type === t
                      ? "border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)] dark:bg-blue-900/20"
                      : "border-[var(--color-border)] hover:bg-[var(--color-surface)]"
                  }`}
                >
                  {t === "organization" ? m.organization : m.person}
                </button>
              );
            })}
          </div>
          {!orgAllowed && (
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              {m.orgNotAllowed}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="handle" className="mb-1 block text-sm font-medium">
            {m.handleLabel}
          </label>
          <div className="flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
            <span className="pl-3 text-sm text-[var(--color-text-muted)]">@</span>
            <input
              id="handle"
              type="text"
              required
              pattern="^[a-z0-9][a-z0-9\-]*[a-z0-9]$"
              minLength={2}
              maxLength={50}
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder={m.handlePlaceholder}
              className="w-full bg-transparent px-2 py-2 text-sm outline-none"
            />
          </div>
        </div>

        {type === "organization" ? (
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

          {type === "organization" && (
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

          {type === "person" && (
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
              placeholder="https://github.com/..."
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

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
        >
          {loading ? m.creating : m.createCard}
        </button>
      </form>
    </div>
  );
}
