"use client";

import { useRouter } from "next/navigation";
import type { Messages } from "@/lib/i18n/messages";

export function AdminSignOutButton({ label }: { label: string }) {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
    >
      {label}
    </button>
  );
}
