"use client";

import { useState } from "react";
import type { Messages } from "@/lib/i18n/messages";
import type { AdminRole } from "@/lib/admin-rbac";
import { AdminPasswordForm } from "../admin-password-form";

function teamRoleLabel(m: Messages["admin"], role: AdminRole): string {
  if (role === "admin") return m.teamRoleadmin;
  if (role === "moderator") return m.teamRolemoderator;
  return m.teamRoleeditor;
}

type OperatorRow = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  createdAt: string;
  lastLoginAt: string | null;
};

export function AdminTeamPanel({
  m,
  initialOperators,
}: {
  m: Messages["admin"];
  initialOperators: OperatorRow[];
}) {
  const [operators, setOperators] = useState(initialOperators);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("editor");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  async function onInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteMessage("");
    setInviteUrl("");
    setInviteLoading(true);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        emailSent?: boolean;
        inviteUrl?: string;
        error?: string;
      };
      if (!res.ok) {
        setInviteMessage(data.error ?? m.actionFailed);
        return;
      }
      setInviteEmail("");
      setInviteMessage(
        data.emailSent ? m.teamInviteSent : m.teamInviteCreatedNoEmail
      );
      if (data.inviteUrl) setInviteUrl(data.inviteUrl);
      const listRes = await fetch("/api/admin/team");
      if (listRes.ok) {
        const list = (await listRes.json()) as { operators: OperatorRow[] };
        setOperators(list.operators);
      }
    } catch {
      setInviteMessage(m.actionFailed);
    } finally {
      setInviteLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-6">
        <h3 className="text-base font-semibold">{m.teamOperatorsTitle}</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-[var(--color-border)]">
              <tr>
                <th className="px-2 py-2 font-medium">{m.name}</th>
                <th className="px-2 py-2 font-medium">{m.email}</th>
                <th className="px-2 py-2 font-medium">{m.teamRole}</th>
                <th className="px-2 py-2 font-medium">{m.created}</th>
              </tr>
            </thead>
            <tbody>
              {operators.map((op) => (
                <tr key={op.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-2 py-2">{op.name}</td>
                  <td className="px-2 py-2 font-mono text-xs">{op.email}</td>
                  <td className="px-2 py-2">{teamRoleLabel(m, op.role)}</td>
                  <td className="px-2 py-2 text-[var(--color-text-muted)]">
                    {new Date(op.createdAt).toISOString().slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-6">
        <h3 className="text-base font-semibold">{m.teamInviteTitle}</h3>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{m.teamInviteBody}</p>
        <form onSubmit={onInvite} className="mt-4 grid gap-4 sm:grid-cols-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder={m.email}
            required
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as AdminRole)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
          >
            <option value="editor">{m.teamRoleeditor}</option>
            <option value="moderator">{m.teamRolemoderator}</option>
            <option value="admin">{m.teamRoleadmin}</option>
          </select>
          <button
            type="submit"
            disabled={inviteLoading}
            className="rounded-lg bg-[var(--color-text)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] disabled:opacity-60"
          >
            {inviteLoading ? "…" : m.teamInviteButton}
          </button>
        </form>
        {inviteMessage ? (
          <p className="mt-3 text-sm text-[var(--color-accent)]">{inviteMessage}</p>
        ) : null}
        {inviteUrl ? (
          <p className="mt-2 break-all font-mono text-xs text-[var(--color-text-muted)]">
            {inviteUrl}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-6">
        <h3 className="text-base font-semibold">{m.teamPasswordTitle}</h3>
        <div className="mt-4">
          <AdminPasswordForm m={m} />
        </div>
      </section>
    </div>
  );
}
