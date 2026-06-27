import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-auth";
import { countAdminOperators } from "@/lib/admin-operators";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import {
  getPlatformConfig,
  getRecommendedContactAddresses,
} from "@/lib/platform-config";
import { getPlatformOperatorStatus } from "@/lib/platform-operator";

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        ok
          ? "bg-green-500/10 text-green-400"
          : "bg-amber-500/10 text-amber-400"
      }`}
    >
      {label}
    </span>
  );
}

function SettingsCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-6">
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="mt-4 space-y-4 text-sm text-[var(--color-text-muted)]">
        {children}
      </div>
    </section>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="font-mono text-xs text-[var(--color-text)] sm:text-right">
        {value}
      </span>
    </div>
  );
}

export default async function AdminSettingsPage() {
  await requireAdminPage("/admin/settings");
  const locale = await getLocale();
  const a = t(locale).admin;
  const config = getPlatformConfig();
  const domain = new URL(config.appUrl).hostname;
  const recommended = getRecommendedContactAddresses(domain);
  const operator = await getPlatformOperatorStatus();
  const operatorCount = await countAdminOperators();

  const operatorReady = operator.userFound && operator.isDesignated;
  const operatorStatusLabel = !operator.userFound
    ? a.settingsOperatorPending
    : operator.isDesignated
      ? a.settingsOperatorReady
      : a.settingsOperatorMismatch;

  return (
    <main>
      <div className="border-b border-[var(--color-border)] p-4 sm:p-8">
        <h2 className="text-lg font-semibold">{a.settings}</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {a.settingsSubtitle}
        </p>
      </div>

      <div className="space-y-6 p-4 sm:p-8">
        <SettingsCard title={a.settingsOperatorTitle}>
          <p>{a.settingsOperatorBody}</p>
          <div className="space-y-2 rounded-xl border border-[var(--color-border)] p-4">
            <ConfigRow
              label={a.settingsOperatorEmail}
              value={operator.expectedEmail}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>{a.settingsOperatorStatus}</span>
              <StatusBadge ok={operatorReady} label={operatorStatusLabel} />
            </div>
            {operator.userFound && (
              <>
                <ConfigRow label={a.name} value={operator.userName ?? "—"} />
                <ConfigRow
                  label={a.settingsOperatorCards}
                  value={String(operator.cardCount)}
                />
              </>
            )}
          </div>
          {operator.userId && (
            <Link
              href={`/admin/users/${operator.userId}`}
              className="inline-flex text-sm font-medium text-[var(--color-accent)] hover:opacity-80"
            >
              {a.view} →
            </Link>
          )}
          <p className="rounded-lg border border-dashed border-[var(--color-border)] px-4 py-3 text-xs">
            {a.settingsOperatorSetupHint}
          </p>
        </SettingsCard>

        <SettingsCard title={a.settingsContactTitle}>
          <p>{a.settingsContactBody}</p>
          <div className="space-y-2 rounded-xl border border-[var(--color-border)] p-4">
            <ConfigRow
              label={a.settingsHelloEmail}
              value={config.helloEmail ?? a.settingsNotConfigured}
            />
            <ConfigRow
              label={a.settingsSupportEmail}
              value={config.supportEmail ?? a.settingsNotConfigured}
            />
            <ConfigRow
              label={a.settingsBillingEmail}
              value={config.billingEmail ?? a.settingsNotConfigured}
            />
            <ConfigRow
              label={a.settingsResend}
              value={
                config.resendConfigured
                  ? a.settingsConfigured
                  : a.settingsNotConfigured
              }
            />
          </div>
          <p className="text-xs">{a.settingsContactEnvHint}</p>
          <div className="rounded-xl border border-dashed border-[var(--color-border)] p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              {a.settingsRecommendedAddresses}
            </p>
            <ul className="space-y-1 font-mono text-xs">
              <li>{recommended.support}</li>
              <li>{recommended.billing}</li>
              <li>{recommended.hello}</li>
            </ul>
          </div>
        </SettingsCard>

        <SettingsCard title={a.settingsSecurityTitle}>
          <p>{a.settingsSecurityBody}</p>
          <div className="flex items-center justify-between gap-4">
            <span>{a.settingsAdminOperators}</span>
            <StatusBadge
              ok={operatorCount > 0}
              label={
                operatorCount > 0
                  ? a.settingsOperatorCount.replace("{n}", String(operatorCount))
                  : a.settingsNotConfigured
              }
            />
          </div>
          <p className="text-xs">{a.settingsSecurityOperatorsHint}</p>
        </SettingsCard>

        <SettingsCard title={a.settingsTeamTitle}>
          <p>{a.settingsTeamBody}</p>
          <ul className="list-inside list-disc space-y-2">
            <li>{a.settingsTeamRoleEditor}</li>
            <li>{a.settingsTeamRoleModerator}</li>
            <li>{a.settingsTeamRoleAdmin}</li>
          </ul>
          <Link
            href="/admin/team"
            className="inline-flex text-sm font-medium text-[var(--color-accent)] hover:opacity-80"
          >
            {a.team} →
          </Link>
        </SettingsCard>

        <SettingsCard title={a.settingsPlatformTitle}>
          <ConfigRow label={a.settingsAppUrl} value={config.appUrl} />
          <p className="text-xs">{a.settingsPlatformHint}</p>
        </SettingsCard>
      </div>
    </main>
  );
}
