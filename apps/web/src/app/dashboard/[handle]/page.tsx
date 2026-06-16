import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { cards, resolveEvents } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { VerifyPanel } from "./verify-panel";

interface Props {
  params: Promise<{ handle: string }>;
}

export default async function CardDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { handle } = await params;

  const [card] = await db
    .select()
    .from(cards)
    .where(and(eq(cards.handle, handle), eq(cards.userId, session.user.id)))
    .limit(1);

  if (!card) notFound();

  const [stats] = await db
    .select({ total: sql<number>`coalesce(sum(${resolveEvents.count}), 0)` })
    .from(resolveEvents)
    .where(eq(resolveEvents.cardId, card.id));

  const body = card.body as Record<string, unknown>;
  const name =
    card.type === "organization"
      ? (body.name as { official: string })?.official
      : (body.name as { full: string })?.full;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const humanUrl = `${appUrl}/kart/${card.handle}`;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard"
        className="mb-4 inline-block text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        ← Kartlarım
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{name ?? card.handle}</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            @{card.handle}
          </p>
        </div>
        {card.verified && (
          <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
            Doğrulanmış
          </span>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            QR Kod
          </h2>
          <div className="flex justify-center rounded-lg bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/v1/cards/${card.handle}/qr`}
              alt="QR kod"
              width={180}
              height={180}
            />
          </div>
        </section>

        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            İstatistik
          </h2>
          <p className="text-3xl font-bold">{Number(stats?.total ?? 0)}</p>
          <p className="text-sm text-[var(--color-text-muted)]">
            toplam resolve
          </p>
        </section>

        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:col-span-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Paylaşılabilir Link
          </h2>
          <div className="flex flex-wrap gap-2">
            <a
              href={humanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all rounded-lg bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-primary)] hover:underline"
            >
              {humanUrl}
            </a>
          </div>
          <div className="mt-3 flex gap-2">
            <Link
              href={`/api/v1/cards/${card.handle}`}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium transition hover:bg-[var(--color-bg)]"
            >
              JSON
            </Link>
            <Link
              href={`/api/v1/cards/${card.handle}/vcard`}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium transition hover:bg-[var(--color-bg)]"
            >
              vCard
            </Link>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:col-span-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Domain Doğrulama
          </h2>
          <VerifyPanel
            handle={card.handle}
            domain={card.domain}
            verified={card.verified}
          />
        </section>
      </div>
    </div>
  );
}
