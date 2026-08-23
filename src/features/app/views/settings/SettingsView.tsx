import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, LifeBuoy, ShieldCheck } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { supportChannel } from '@/config/support'
import { pickL } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { useTheme } from '@/lib/themeContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { formatStampTime, readExportAudit } from '@/lib/exportProtection'
import { common } from '@/i18n/messages/common'
import { settingsMessages as M } from '@/i18n/messages/settings'
import { exportProtectionMessages as XP } from '@/i18n/messages/exportProtection'
import {
  getSigningReminderDays,
  setSigningReminderDays,
} from '@/features/app/documents/signingReminderSettingsApi'
import {
  aiToggles,
  auditEvents,
  initialPrefs,
  notificationToggles,
  provinces,
  retentionRows,
  roleRows,
  securityRows,
  segClass,
  team,
} from './settingsData'
import type { ChipTone, PrefKey } from './settingsData'
import { Card, Section, StatusChip, ToggleRow } from './settingsPrimitives'
import { CapacityAlert } from './CapacityAlert'

/**
 * Settings view — port of the prototype's largest static view
 * (`App v2.dc.html` markup 1267–1435, `buildSettingsView()` 3539–3622).
 *
 * Appearance/Language segments drive the real ThemeProvider / LangProvider;
 * preference toggles flip local state (prototype `settingsPrefs`); the
 * Calendar-sync integration starts in its error state and Retry clears it
 * with a toast, exactly like `retryIntegration()`. Content tables live in
 * settingsData.ts; shared building blocks in settingsPrimitives.tsx.
 */

const SUPPORT_EMAIL = supportChannel('support').email

export function SettingsView() {
  const { x, lang, setLang } = useI18n()
  /* The Help Centre lives on the public marketing surface, so it opens in a new
     tab rather than navigating the workspace away from itself. */
  const helpCentrePath = lang === 'fr' ? '/fr/aide' : '/help'
  const { theme, setTheme } = useTheme()
  const { showToast } = useToasts()
  const { mode: workspaceMode, isAdmin, identity, organizationId, setMode: setWorkspaceMode } =
    useWorkspaceMode()

  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>(initialPrefs)
  const [integrationError, setIntegrationError] = useState(true)
  /* Device-local export audit trail (src/lib/exportProtection) — read once
     per mount; the workspace-wide copy lives in export_events server-side. */
  const [exportTrail] = useState(() => readExportAudit().slice(0, 8))
  const [reminderDays, setReminderDays] = useState(3)
  const [reminderSaving, setReminderSaving] = useState(false)

  useEffect(() => {
    if (workspaceMode !== 'production' || !organizationId || !isAdmin) return
    let cancelled = false
    void getSigningReminderDays(organizationId)
      .then((days) => {
        if (!cancelled) setReminderDays(days)
      })
      .catch(() => {
        /* keep default */
      })
    return () => {
      cancelled = true
    }
  }, [workspaceMode, organizationId, isAdmin])

  const saveReminderDays = async (raw: number) => {
    if (!organizationId || reminderSaving) return
    setReminderSaving(true)
    try {
      const saved = await setSigningReminderDays(organizationId, raw)
      setReminderDays(saved)
      showToast(M.settings_signing_reminder_saved, 'ok')
    } catch {
      showToast(M.settings_signing_reminder_failed, 'info')
    } finally {
      setReminderSaving(false)
    }
  }

  const toggleSetting = (key: PrefKey) => {
    setPrefs((s) => ({ ...s, [key]: !s[key] }))
  }

  const retryIntegration = () => {
    setIntegrationError(false)
    showToast(M.settings_toast_reconnected, 'ok')
  }

  /* Production shows the real profile's single operating region; demo keeps
     the Northgate fixture chips. */
  const provinceChips: string[] =
    workspaceMode === 'production'
      ? [identity.province ?? 'Ontario']
      : provinces.map((prov) => x(prov))

  const integrations: { t: Bi; status: Bi; tone: ChipTone; error: boolean }[] = [
    { t: M.settings_int_esign, status: M.settings_int_connected_f, tone: 'success', error: false },
    {
      t: M.settings_int_payroll,
      status: M.settings_int_connected_m,
      tone: 'success',
      error: false,
    },
    {
      t: M.settings_int_calendar,
      status: integrationError ? M.settings_int_error : M.settings_int_connected_f,
      tone: integrationError ? 'risk' : 'success',
      error: integrationError,
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto px-[32px] pt-[28px] pb-[60px]">
      <div className="mx-auto flex max-w-[700px] flex-col gap-[26px]">
        {/* Appearance + Language */}
        <div className="flex flex-wrap gap-[16px]">
          <div className="min-w-[220px] flex-1">
            <div className="mb-[10px] text-[13px] font-bold text-text-3">
              {x(M.settings_appearance)}
            </div>
            <div
              role="tablist"
              aria-label={x(M.settings_appearance)}
              className="flex gap-[6px] rounded-[12px] border border-border bg-surface px-[16px] py-[14px]"
            >
              <button
                type="button"
                role="tab"
                aria-selected={theme !== 'dark'}
                onClick={() => setTheme('light')}
                className={segClass(theme !== 'dark')}
              >
                {x(M.settings_theme_light)}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={theme === 'dark'}
                onClick={() => setTheme('dark')}
                className={segClass(theme === 'dark')}
              >
                {x(M.settings_theme_dark)}
              </button>
            </div>
          </div>
          <div className="min-w-[220px] flex-1">
            <div className="mb-[10px] text-[13px] font-bold text-text-3">
              {x(M.settings_language)}
            </div>
            <div
              role="tablist"
              aria-label={x(M.settings_language)}
              className="flex gap-[6px] rounded-[12px] border border-border bg-surface px-[16px] py-[14px]"
            >
              <button
                type="button"
                role="tab"
                aria-selected={lang === 'en'}
                onClick={() => setLang('en')}
                className={segClass(lang === 'en')}
              >
                English
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={lang === 'fr'}
                onClick={() => setLang('fr')}
                className={segClass(lang === 'fr')}
              >
                Français
              </button>
            </div>
          </div>
        </div>

        {/* Data & privacy — Law 25 note */}
        <Section label={x(M.settings_privacy)}>
          <div className="flex items-start gap-[10px] rounded-[12px] border border-(--accent-soft-border) bg-accent-soft px-[16px] py-[14px]">
            <ShieldCheck
              size={18}
              strokeWidth={1.7}
              className="mt-px shrink-0 text-accent"
              aria-hidden="true"
            />
            <span className="text-[13px] leading-[1.55] text-text-2">
              {x(M.settings_privacy_note)}
            </span>
          </div>
        </Section>

        {/* Workspace */}
        <Section label={x(M.settings_workspace)}>
          <div className="flex flex-col gap-[12px] rounded-[12px] border border-border bg-surface px-[20px] py-[18px]">
            {isAdmin && (
              <div>
                <span className="text-[12px] text-text-muted">{x(M.settings_workspace_mode)}</span>
                <div
                  role="tablist"
                  aria-label={x(M.settings_workspace_mode)}
                  className="mt-[6px] flex w-fit gap-[6px] rounded-[12px] border border-border bg-inset px-[6px] py-[5px]"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={workspaceMode === 'demo'}
                    onClick={() => void setWorkspaceMode('demo')}
                    className={segClass(workspaceMode === 'demo')}
                  >
                    {x(M.settings_workspace_mode_demo)}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={workspaceMode === 'production'}
                    onClick={() => void setWorkspaceMode('production')}
                    className={segClass(workspaceMode === 'production')}
                  >
                    {x(M.settings_workspace_mode_production)}
                  </button>
                </div>
                <p className="mt-[8px] text-[11.5px] leading-normal text-text-faint">
                  {x(M.settings_workspace_mode_note)}
                </p>
                <CapacityAlert />
                {workspaceMode === 'production' && organizationId && (
                  <div className="mt-[14px]">
                    <label
                      htmlFor="signing-reminder-days"
                      className="text-[12px] text-text-muted"
                    >
                      {x(M.settings_signing_reminder_days)}
                    </label>
                    <input
                      id="signing-reminder-days"
                      type="number"
                      min={1}
                      max={14}
                      value={reminderDays}
                      disabled={reminderSaving}
                      onChange={(e) => setReminderDays(Number(e.target.value) || 1)}
                      onBlur={() => void saveReminderDays(reminderDays)}
                      className="mt-[6px] w-[88px] rounded-[8px] border border-border bg-bg px-[10px] py-[7px] text-[13.5px] text-text"
                    />
                    <p className="mt-[6px] text-[11.5px] leading-normal text-text-faint">
                      {x(M.settings_signing_reminder_days_note)}
                    </p>
                  </div>
                )}
              </div>
            )}
            <div>
              <span className="text-[12px] text-text-muted">{x(M.settings_company)}</span>
              <div className="text-[14px] font-semibold text-text">
                {workspaceMode === 'production' ? identity.companyName : 'Northgate Logistics Inc.'}
              </div>
            </div>
            <div>
              <span className="text-[12px] text-text-muted">{x(M.settings_provinces_of_op)}</span>
              <div className="mt-[6px] flex flex-wrap gap-[6px]">
                {provinceChips.map((prov) => (
                  <span
                    key={prov}
                    className="rounded-[100px] bg-inset px-[11px] py-[4px] text-[12.5px] font-semibold text-text-2"
                  >
                    {prov}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-[12px] text-text-muted">{x(M.settings_locations)}</span>
              <div className="mt-[2px] text-[13.5px] font-semibold text-text">
                {workspaceMode === 'production'
                  ? (identity.city ?? 'Ottawa')
                  : x(M.settings_locations_value)}
              </div>
            </div>
          </div>
        </Section>

        {/* Users & team — fixture people; production has no team records yet. */}
        {workspaceMode !== 'production' && (
          <Section label={x(M.settings_team)}>
            <Card>
              {team.map((m) => (
                <div
                  key={m.initials}
                  className="flex items-center gap-[12px] border-t border-inset px-[18px] py-[13px]"
                >
                  <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-accent-soft text-[12px] font-bold text-accent">
                    {m.initials}
                  </div>
                  <div>
                    <div className="text-[13.5px] font-semibold text-text">
                      {pickL(m.name, lang)}
                    </div>
                    <div className="text-[12px] text-text-muted">{x(m.role)}</div>
                  </div>
                </div>
              ))}
            </Card>
          </Section>
        )}

        {/* Notifications */}
        <Section label={x(M.settings_notifications)}>
          <Card>
            {notificationToggles.map((spec) => (
              <ToggleRow
                key={spec.key}
                spec={spec}
                on={prefs[spec.key]}
                onToggle={() => toggleSetting(spec.key)}
              />
            ))}
          </Card>
        </Section>

        {/* AI & Advisor */}
        <Section label={x(M.settings_ai)}>
          <Card>
            {aiToggles.map((spec) => (
              <ToggleRow
                key={spec.key}
                spec={spec}
                on={prefs[spec.key]}
                onToggle={() => toggleSetting(spec.key)}
              />
            ))}
            <div className="border-t border-inset px-[18px] py-[14px]">
              <div className="mb-[6px] text-[12px] font-bold tracking-[0.04em] text-text-muted uppercase">
                {x(M.settings_disclaimer_label)}
              </div>
              <div className="text-[12.5px] leading-[1.55] text-text-2">
                {x(common.disclaimer_full)}
              </div>
              <div className="mt-[6px] text-[11.5px] text-text-faint">
                {x(M.settings_disclaimer_note)}
              </div>
            </div>
          </Card>
        </Section>

        {/* Roles & permissions */}
        <Section label={x(M.settings_roles)}>
          <Card>
            <div className="overflow-x-auto">
              <div className="min-w-[540px]">
                <div className="grid grid-cols-[1.4fr_1fr_1fr_1.1fr_1fr] gap-[8px] bg-inset px-[18px] py-[10px] text-[10.5px] font-bold tracking-[0.03em] text-text-muted uppercase">
                  <div>{x(M.settings_col_role)}</div>
                  <div>{x(M.settings_col_records)}</div>
                  <div>{x(M.settings_col_comp)}</div>
                  <div>{x(M.settings_col_cases)}</div>
                  <div>{x(M.settings_col_signals)}</div>
                </div>
                {roleRows.map((ro) => (
                  <div
                    key={ro.role.en}
                    className="grid grid-cols-[1.4fr_1fr_1fr_1.1fr_1fr] items-center gap-[8px] border-t border-inset px-[18px] py-[11px] text-[12.5px]"
                  >
                    <div className="font-semibold text-text">{x(ro.role)}</div>
                    <div className="text-text-2">{x(ro.a)}</div>
                    <div className="text-text-2">{x(ro.b)}</div>
                    <div className="text-text-2">{x(ro.c)}</div>
                    <div className="text-text-2">{x(ro.d)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-inset px-[18px] py-[10px] text-[11px] text-text-faint">
              {x(M.settings_roles_note)}
            </div>
          </Card>
        </Section>

        {/* Data retention */}
        <Section label={x(M.settings_retention)}>
          <Card>
            {retentionRows.map((rt) => (
              <div
                key={rt.t.en}
                className="flex items-center justify-between gap-[14px] border-t border-inset px-[18px] py-[12px]"
              >
                <div className="text-[13px] font-semibold text-text">{x(rt.t)}</div>
                <div className="text-right text-[12.5px] text-text-2">{x(rt.v)}</div>
              </div>
            ))}
            <div className="border-t border-inset px-[18px] py-[10px] text-[11px] text-text-faint">
              {x(M.settings_retention_note)}
            </div>
          </Card>
        </Section>

        {/* Security */}
        <Section label={x(M.settings_security)}>
          <Card>
            {securityRows.map((sec) => (
              <div
                key={sec.t.en}
                className="flex items-center justify-between gap-[14px] border-t border-inset px-[18px] py-[12px]"
              >
                <div className="text-[13px] font-semibold text-text">{x(sec.t)}</div>
                <div className="text-right text-[12.5px] text-text-2">{x(sec.v)}</div>
              </div>
            ))}
          </Card>
        </Section>

        {/* Integrations & billing — fixture connections/plan; production has
            no real integrations wired yet. */}
        {workspaceMode !== 'production' && (
          <Section label={x(M.settings_integrations)}>
            <Card>
              {integrations.map((ig) => (
                <div
                  key={ig.t.en}
                  className="flex items-center justify-between gap-[14px] border-t border-inset px-[18px] py-[12px]"
                >
                  <div className="text-[13px] font-semibold text-text">{x(ig.t)}</div>
                  <div className="flex items-center gap-[8px]">
                    <StatusChip tone={ig.tone}>{x(ig.status)}</StatusChip>
                    {ig.error && (
                      <button
                        type="button"
                        onClick={retryIntegration}
                        className="cursor-pointer rounded-[8px] border-none bg-accent-soft px-[12px] py-[6px] font-sans text-[12px] font-bold text-accent"
                      >
                        {x(M.settings_int_retry)}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between gap-[14px] border-t border-inset px-[18px] py-[12px]">
                <div className="text-[13px] font-semibold text-text">{x(M.settings_billing)}</div>
                <button
                  type="button"
                  onClick={() => showToast(M.settings_toast_billing, 'ok')}
                  className="cursor-pointer rounded-[8px] border border-border bg-surface px-[12px] py-[6px] font-sans text-[12px] font-bold text-text"
                >
                  {x(M.settings_billing_btn)}
                </button>
              </div>
            </Card>
          </Section>
        )}

        {/* Export activity — the real device-local export trail, both modes
            (unlike the fixture audit log below: these are actual events). */}
        <Section label={x(XP.exportprot_audit_section)}>
          <Card>
            {exportTrail.length === 0 && (
              <div className="px-[18px] py-[13px] text-[12.5px] text-text-muted">
                {x(XP.exportprot_audit_empty)}
              </div>
            )}
            {exportTrail.map((entry) => (
              <div
                key={`${entry.exportId}-${entry.at}`}
                className="flex items-start gap-[12px] border-t border-inset px-[18px] py-[11px] first:border-t-0"
              >
                <StatusChip tone="info">{x(M.settings_audit_kind_export)}</StatusChip>
                <div className="min-w-0 flex-1 text-[12.5px] leading-normal text-text-2">
                  {entry.title} · {entry.kind.toUpperCase()} · {x(XP.exportprot_audit_row_by)}{' '}
                  {entry.actorLabel}
                </div>
                <span className="shrink-0 text-[11.5px] text-text-faint">
                  {formatStampTime(new Date(entry.at))}
                </span>
              </div>
            ))}
            <div className="border-t border-inset px-[18px] py-[10px] text-[11px] text-text-faint">
              {x(XP.exportprot_audit_device_note)}
            </div>
          </Card>
        </Section>

        {/* Audit log — fixture events; production starts with an empty log. */}
        {workspaceMode !== 'production' && (
          <Section label={x(M.settings_audit)}>
            <Card>
              {auditEvents.map((ev) => (
                <div
                  key={ev.text.en}
                  className="flex items-start gap-[12px] border-t border-inset px-[18px] py-[11px]"
                >
                  <StatusChip tone={ev.tone}>{x(ev.kind)}</StatusChip>
                  <div className="min-w-0 flex-1 text-[12.5px] leading-normal text-text-2">
                    {x(ev.text)}
                  </div>
                  <span className="shrink-0 text-[11.5px] text-text-faint">{x(ev.when)}</span>
                </div>
              ))}
              <div className="border-t border-inset px-[18px] py-[10px] text-[11px] text-text-faint">
                {x(M.settings_audit_note)}
              </div>
            </Card>
          </Section>
        )}

        {/* Help & support — the account surface had no support entry point at
            all, so the only in-app route to a ticket was the sidebar profile
            menu. Addresses come from src/config/support.ts, never inline. */}
        <Section label={x(M.settings_support)}>
          <Card>
            <a
              href={helpCentrePath}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-[14px] border-t border-inset px-[18px] py-[13px] no-underline first:border-t-0 hover:bg-inset"
            >
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-text">
                  {x(M.settings_support_help_centre)}
                </span>
                <span className="mt-[2px] block text-[12px] leading-[1.5] text-text-muted">
                  {x(M.settings_support_help_centre_note)}
                </span>
              </span>
              <ExternalLink size={15} strokeWidth={1.7} aria-hidden="true" className="shrink-0 text-text-muted" />
            </a>
            <Link
              to="/app/support"
              className="flex items-center justify-between gap-[14px] border-t border-inset px-[18px] py-[13px] no-underline hover:bg-inset"
            >
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-text">
                  {x(M.settings_support_request)}
                </span>
                <span className="mt-[2px] block text-[12px] leading-[1.5] text-text-muted">
                  {x(M.settings_support_request_note)}
                </span>
              </span>
              <LifeBuoy size={15} strokeWidth={1.7} aria-hidden="true" className="shrink-0 text-text-muted" />
            </Link>
            <div className="border-t border-inset px-[18px] py-[10px] text-[11px] text-text-faint">
              {x(M.settings_support_email_note)}{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-text-2">
                {SUPPORT_EMAIL}
              </a>
            </div>
          </Card>
        </Section>
      </div>
    </div>
  )
}
