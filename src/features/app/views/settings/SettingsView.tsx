import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, LifeBuoy, Brain, ShieldCheck } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { supportChannel } from '@/config/support'
import { pickL } from '@/i18n/core'
import { useTheme } from '@/lib/themeContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { seoRoute } from '@/seo/routes'
import { formatStampTime, readExportAudit } from '@/lib/exportProtection'
import { common } from '@/i18n/messages/common'
import { settingsMessages as M } from '@/i18n/messages/settings'
import { memoryMessages as MEM } from '@/i18n/messages/memory'
import { exportProtectionMessages as XP } from '@/i18n/messages/exportProtection'
import {
  getSigningReminderDays,
  setSigningReminderDays,
} from '@/features/app/documents/signingReminderSettingsApi'
import {
  aiToggles,
  notificationToggles,
  provinces,
  retentionRows,
  roleRows,
  securityRows,
  segClass,
} from './settingsData'
import type { PrefKey } from './settingsData'
import { readSettingsPrefs, writeSettingsPrefs } from './settingsPrefs'
import { Card, Section, StatusChip, ToggleRow, ToggleSwitch } from './settingsPrimitives'
import { CapacityAlert } from './CapacityAlert'
import { SettingsDemoFixtures } from './SettingsDemoFixtures'
import { SettingsBillingSection } from './SettingsBillingSection'
import { SettingsProductionTeam } from './SettingsProductionTeam'
import { WorkspaceProfileEditor } from './WorkspaceProfileEditor'
import { AppPage } from '@/features/app/shell/AppPage'
import { useMdUp } from '@/lib/useMediaQuery'
import { useAuth } from '@/features/app/auth/authContext'
import { usePlan } from '@/features/app/billing/planContext'
import { hasPlanFeature } from '@/features/app/billing/planAccess'
import { PLAN_FEATURE_GATES_ENABLED, hasActiveSubscription } from '@/config/plans'
import {
  getAdvisorOverageOptIn,
  setAdvisorOverageOptIn,
} from '@/features/app/advisor/overageOptInApi'
import { AdvisorUsagePanel } from '@/features/app/advisor/AdvisorUsagePanel'
import {
  ADVISOR_MONTHLY_INCLUDED,
  ADVISOR_OVERAGE_MONTHLY_REPLY_CAP,
  ADVISOR_OVERAGE_PER_REPLY_CAD,
} from '@/config/advisorUsage'

/**
 * Settings view — port of the prototype's largest static view
 * (`App v2.dc.html` markup 1267–1435, `buildSettingsView()` 3539–3622).
 *
 * Appearance/Language drive ThemeProvider / LangProvider. Preference toggles
 * persist on-device (`settingsPrefs`) with honest copy where delivery isn't
 * live. Production adds profile edit, billing portal, and a real member card;
 * demo keeps Northgate fixtures labelled as samples.
 */

const SUPPORT_EMAIL = supportChannel('support').email

export function SettingsView() {
  const { x, t, lang, setLang } = useI18n()
  const { status: authStatus } = useAuth()
  /* The Help Centre lives on the public marketing surface, so it opens in a new
     tab rather than navigating the workspace away from itself. */
  const helpCentrePath = seoRoute('help').path[lang]
  const { theme, setTheme } = useTheme()
  const { showToast } = useToasts()
  const mdUp = useMdUp()
  const {
    mode: workspaceMode,
    isAdmin,
    organizationId,
    setMode: setWorkspaceMode,
  } = useWorkspaceMode()
  const { plan, subscriptionStatus, isAdmin: isBillingAdmin } = usePlan()

  const memoryInjectionLocked =
    workspaceMode === 'production' &&
    PLAN_FEATURE_GATES_ENABLED &&
    !isBillingAdmin &&
    !(
      hasPlanFeature(plan, 'advisor_cross_record_memory') &&
      hasActiveSubscription(subscriptionStatus)
    )

  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>(readSettingsPrefs)
  /* Device-local export audit trail (src/lib/exportProtection) — read once
     per mount; signed-in exports also land in export_events for staff. */
  const [exportTrail] = useState(() => readExportAudit().slice(0, 8))
  const [reminderDays, setReminderDays] = useState(3)
  const [reminderSaving, setReminderSaving] = useState(false)
  const [overageOptIn, setOverageOptIn] = useState(false)
  const [overageSaving, setOverageSaving] = useState(false)

  useEffect(() => {
    if (authStatus !== 'signed-in') return
    let cancelled = false
    void getAdvisorOverageOptIn()
      .then((on) => {
        if (!cancelled) setOverageOptIn(on)
      })
      .catch(() => {
        /* keep default off */
      })
    return () => {
      cancelled = true
    }
  }, [authStatus])

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
    setPrefs((s) => {
      const next = { ...s, [key]: !s[key] }
      writeSettingsPrefs(next)
      return next
    })
  }

  const saveOverageOptIn = async () => {
    if (overageSaving || authStatus !== 'signed-in') return
    const next = !overageOptIn
    setOverageSaving(true)
    try {
      const saved = await setAdvisorOverageOptIn(next)
      setOverageOptIn(saved)
      showToast(M.settings_overage_saved, 'ok')
    } catch {
      showToast(M.settings_overage_failed, 'info')
    } finally {
      setOverageSaving(false)
    }
  }

  const overageSub = pickL(M.settings_toggle_overage_sub, lang)
    .replaceAll('{included}', String(ADVISOR_MONTHLY_INCLUDED))
    .replaceAll('{price}', String(ADVISOR_OVERAGE_PER_REPLY_CAD))
    .replaceAll('{cap}', String(ADVISOR_OVERAGE_MONTHLY_REPLY_CAP))

  return (
    <AppPage width="narrow" responsivePad innerClassName="flex flex-col gap-[26px]">
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
                  <label htmlFor="signing-reminder-days" className="text-[12px] text-text-muted">
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
          {workspaceMode === 'production' ? (
            <WorkspaceProfileEditor />
          ) : (
            <>
              <div>
                <span className="text-[12px] text-text-muted">{x(M.settings_company)}</span>
                <div className="text-[14px] font-semibold text-text">Northgate Logistics Inc.</div>
              </div>
              <div>
                <span className="text-[12px] text-text-muted">{x(M.settings_provinces_of_op)}</span>
                <div className="mt-[6px] flex flex-wrap gap-[6px]">
                  {provinces.map((prov) => (
                    <span
                      key={prov.en}
                      className="rounded-[100px] bg-inset px-[11px] py-[4px] text-[12.5px] font-semibold text-text-2"
                    >
                      {x(prov)}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[12px] text-text-muted">{x(M.settings_locations)}</span>
                <div className="mt-[2px] text-[13.5px] font-semibold text-text">
                  {x(M.settings_locations_value)}
                </div>
              </div>
            </>
          )}
        </div>
      </Section>

      {workspaceMode === 'production' ? (
        <>
          <SettingsProductionTeam />
          <SettingsBillingSection />
        </>
      ) : (
        <SettingsDemoFixtures />
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
          <div className="border-t border-inset px-[18px] py-[10px] text-[11px] text-text-faint">
            {x(M.settings_notifications_note)}
          </div>
        </Card>
      </Section>

      {/* AI & Advisor */}
      <Section label={x(M.settings_ai)}>
        <Card>
          {aiToggles.map((spec) => {
            if (spec.key === 'aiContext' && memoryInjectionLocked) {
              return (
                <div
                  key={spec.key}
                  className="flex items-center justify-between gap-[14px] border-t border-inset px-[18px] py-[14px]"
                >
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-semibold text-text">{x(spec.label)}</div>
                    <div className="mt-[2px] text-[12px] text-text-muted">
                      {x(M.settings_toggle_ai_context_locked)}
                    </div>
                    <Link
                      to={`${seoRoute('pricing').path[lang]}?upgrade=growth`}
                      className="mt-[6px] inline-block text-[12px] font-semibold text-gold-strong"
                    >
                      {t('landing_price_compare')}
                    </Link>
                  </div>
                  <ToggleSwitch
                    on={prefs.aiContext}
                    label={x(spec.label)}
                    disabled
                    onToggle={() => {
                      /* read-only while gated — preference kept, injection server-gated */
                    }}
                  />
                </div>
              )
            }
            return (
              <ToggleRow
                key={spec.key}
                spec={spec}
                on={prefs[spec.key]}
                onToggle={() => toggleSetting(spec.key)}
              />
            )
          })}
          <div className="border-t border-inset px-[18px] py-[10px] text-[11px] text-text-faint">
            {x(M.settings_ai_prefs_note)}
          </div>
          <Link
            to="/app/settings/memory"
            className="flex items-center justify-between gap-[14px] border-t border-inset px-[18px] py-[13px] no-underline hover:bg-inset"
          >
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-text">
                {x(MEM.memory_settings_open_title)}
              </span>
              <span className="mt-[2px] block text-[12px] leading-[1.5] text-text-muted">
                {x(MEM.memory_settings_open_note)}
              </span>
            </span>
            <Brain
              size={15}
              strokeWidth={1.7}
              aria-hidden="true"
              className="shrink-0 text-text-muted"
            />
          </Link>
          {authStatus === 'signed-in' && organizationId ? <AdvisorUsagePanel /> : null}
          {authStatus === 'signed-in' && (
            <div className="flex items-center justify-between gap-[14px] border-t border-inset px-[18px] py-[14px]">
              <div className="min-w-0">
                <div className="text-[13.5px] font-semibold text-text">
                  {x(M.settings_toggle_overage)}
                </div>
                <div className="mt-[2px] text-[12px] text-text-muted">{overageSub}</div>
              </div>
              <ToggleSwitch
                on={overageOptIn}
                label={x(M.settings_toggle_overage)}
                onToggle={() => void saveOverageOptIn()}
              />
            </div>
          )}
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
          {mdUp ? (
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
          ) : (
            <div className="flex flex-col gap-[10px]">
              {roleRows.map((ro) => (
                <div
                  key={ro.role.en}
                  className="rounded-[11px] border border-inset px-[14px] py-[12px]"
                >
                  <div className="text-[13.5px] font-semibold text-text">{x(ro.role)}</div>
                  <dl className="mt-[8px] grid grid-cols-1 gap-y-[6px] text-[12px]">
                    <div className="flex items-baseline justify-between gap-[12px]">
                      <dt className="text-text-muted">{x(M.settings_col_records)}</dt>
                      <dd className="m-0 text-right text-text-2">{x(ro.a)}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-[12px]">
                      <dt className="text-text-muted">{x(M.settings_col_comp)}</dt>
                      <dd className="m-0 text-right text-text-2">{x(ro.b)}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-[12px]">
                      <dt className="text-text-muted">{x(M.settings_col_cases)}</dt>
                      <dd className="m-0 text-right text-text-2">{x(ro.c)}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-[12px]">
                      <dt className="text-text-muted">{x(M.settings_col_signals)}</dt>
                      <dd className="m-0 text-right text-text-2">{x(ro.d)}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          )}
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
          <div className="border-t border-inset px-[18px] py-[10px] text-[11px] text-text-faint">
            {x(M.settings_security_note)}
          </div>
        </Card>
      </Section>

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
          {isAdmin && (
            <Link
              to="/app/support/admin/exports"
              className="block border-t border-inset px-[18px] py-[12px] text-[12.5px] font-semibold text-accent no-underline hover:bg-inset"
            >
              {x(M.settings_export_admin_link)}
            </Link>
          )}
        </Card>
      </Section>

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
            <ExternalLink
              size={15}
              strokeWidth={1.7}
              aria-hidden="true"
              className="shrink-0 text-text-muted"
            />
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
            <LifeBuoy
              size={15}
              strokeWidth={1.7}
              aria-hidden="true"
              className="shrink-0 text-text-muted"
            />
          </Link>
          <div className="border-t border-inset px-[18px] py-[10px] text-[11px] text-text-faint">
            {x(M.settings_support_email_note)}{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-text-2">
              {SUPPORT_EMAIL}
            </a>
          </div>
        </Card>
      </Section>
    </AppPage>
  )
}
