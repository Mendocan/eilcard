import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/dashboard">
            <BrandLogo showWordmark />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--color-text-muted)]">
              {session.user.email}
            </span>
            <form action="/api/auth/sign-out" method="POST">
              <button
                type="submit"
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                Çıkış
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
