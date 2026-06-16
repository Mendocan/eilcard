"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CardType = "organization" | "person";

export default function NewCardPage() {
  const router = useRouter();
  const [type, setType] = useState<CardType>("organization");
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
      const data = await res.json();
      setError(data.error ?? "Kart oluşturulamadı.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Yeni Kart</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium">Kart Tipi</label>
          <div className="flex gap-3">
            {(["organization", "person"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                  type === t
                    ? "border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)] dark:bg-blue-900/20"
                    : "border-[var(--color-border)] hover:bg-[var(--color-surface)]"
                }`}
              >
                {t === "organization" ? "Kurum" : "Kişi"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="handle" className="mb-1 block text-sm font-medium">
            Handle
          </label>
          <div className="flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
            <span className="pl-3 text-sm text-[var(--color-text-muted)]">
              @
            </span>
            <input
              id="handle"
              type="text"
              required
              pattern="^[a-z0-9][a-z0-9-]*[a-z0-9]$"
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
              <label className="mb-1 block text-sm font-medium">
                Resmi Ad *
              </label>
              <input
                type="text"
                required
                value={nameOfficial}
                onChange={(e) => setNameOfficial(e.target.value)}
                placeholder="Sinyal 24 İletişim Teknolojileri A.Ş."
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Kısa Ad</label>
              <input
                type="text"
                value={nameShort}
                onChange={(e) => setNameShort(e.target.value)}
                placeholder="Sinyalle"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium">
              Ad Soyad *
            </label>
            <input
              type="text"
              required
              value={nameFull}
              onChange={(e) => setNameFull(e.target.value)}
              placeholder="Ahmet Yılmaz"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">Tagline</label>
          <input
            type="text"
            maxLength={160}
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Bulut tabanlı çağrı merkezi platformu"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </div>

        <fieldset className="space-y-3 rounded-lg border border-[var(--color-border)] p-4">
          <legend className="px-2 text-sm font-medium">İletişim</legend>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="info@sinyalle.com"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+90 324 000 0000"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
          />
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://sinyalle.com"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </fieldset>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Domain (opsiyonel)
          </label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="sinyalle.com"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </div>

        {error && (
          <p className="text-sm text-[var(--color-error)]">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
        >
          {loading ? "Oluşturuluyor..." : "Kart Oluştur"}
        </button>
      </form>
    </div>
  );
}
