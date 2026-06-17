"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Messages } from "@/lib/i18n/messages";

type Props = {
  m: Messages["dashboard"];
  maxOrgCards: number;
  atCardLimit: boolean;
};

export function NewCardForm({ m, maxOrgCards, atCardLimit }: Props) {
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const body: Record<string, unknown> = {
      type,
      handle: handle.toLowerCase(),
      contact: {
        ...(email && { email }),
        ...(phone && { phone }),
        ...(website && { website }),
      },
      ...(tagline && { description: { tagline } }),
      ...(domain && { domain }),
    };

    if (type === "organization") {
      body.name = {
        official: nameOfficial,
        ...(nameShort && { short: nameShort }),
      };
    } else {
      body.name = { full: nameFull };
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
        reason?: string;
      };
      if (data.reason === "org_limit") {
        setError(m.orgNotAllowed);
      } else if (data.reason === "card_limit") {
        setError(m.limitReached);
      } else {
        setError(data.error ?? m.createFailed);
      }
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

      <form onSubmit={handleSubmit} className="space-y-5">
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
              placeholder="sinyalle"
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
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{m.shortName}</label>
              <input
                type="text"
                value={nameShort}
                onChange={(e) => setNameShort(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
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
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
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
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </div>

        <fieldset className="space-y-3 rounded-lg border border-[var(--color-border)] p-4">
          <legend className="px-2 text-sm font-medium">{m.contact}</legend>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
          />
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </fieldset>

        <div>
          <label className="mb-1 block text-sm font-medium">{m.domainOptional}</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
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
