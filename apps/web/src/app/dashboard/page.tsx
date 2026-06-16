import { getSession } from "@/lib/session";
import { getCardsByUserId } from "@/lib/card-service";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const userCards = await getCardsByUserId(session.user.id);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kartlarım</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Dijital kartlarınızı yönetin.
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)]"
        >
          + Yeni Kart
        </Link>
      </div>

      {userCards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] p-12 text-center">
          <p className="mb-2 text-lg font-medium">Henüz kartınız yok</p>
          <p className="mb-4 text-sm text-[var(--color-text-muted)]">
            İlk dijital kartınızı oluşturarak başlayın.
          </p>
          <Link
            href="/dashboard/new"
            className="inline-block rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)]"
          >
            Kart Oluştur
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {userCards.map((card) => {
            const body = card.body as Record<string, unknown>;
            const name =
              card.type === "organization"
                ? (body.name as { official: string })?.official
                : (body.name as { full: string })?.full;

            return (
              <Link
                key={card.id}
                href={`/dashboard/${card.handle}`}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition hover:border-[var(--color-primary)]"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {card.type === "organization" ? "Kurum" : "Kişi"}
                  </span>
                  {card.verified && (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      Doğrulanmış
                    </span>
                  )}
                </div>
                <p className="text-lg font-semibold">{name ?? card.handle}</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  @{card.handle}
                  {card.domain ? ` · ${card.domain}` : ""}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
