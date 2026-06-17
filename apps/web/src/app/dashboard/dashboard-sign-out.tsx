"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function DashboardSignOutButton({ label }: { label: string }) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
    >
      {label}
    </button>
  );
}
