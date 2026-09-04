import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { pickL } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { seoRoute } from '@/seo/routes'
import { settingsMessages as M } from '@/i18n/messages/settings'
import { auditEvents, team } from './settingsData'
import type { ChipTone } from './settingsData'
import { Card, Section, StatusChip } from './settingsPrimitives'

/** Northgate team, integrations, billing, and audit log — demo workspace only. */
export function SettingsDemoFixtures() {
  const { x, lang } = useI18n()
  const { showToast } = useToasts()
  const [integrationError, setIntegrationError] = useState(true)
  const pricingPath = seoRoute('pricing').path[lang]

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

  const retryIntegration = () => {
    setIntegrationError(false)
    showToast(M.settings_toast_reconnected, 'ok')
  }

  return (
    <>
      <Section label={x(M.settings_team)}>
        <Card>
          {team.map((m) => (
            <div
              key={m.initials}
              className="flex items-center gap-[12px] border-t border-inset px-[18px] py-[13px] first:border-t-0"
            >
              <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-accent-soft text-[12px] font-bold text-accent">
                {m.initials}
              </div>
              <div>
                <div className="text-[13.5px] font-semibold text-text">{pickL(m.name, lang)}</div>
                <div className="text-[12px] text-text-muted">{x(m.role)}</div>
              </div>
            </div>
          ))}
          <div className="border-t border-inset px-[18px] py-[10px] text-[11px] text-text-faint">
            {x(M.settings_team_demo_note)}
          </div>
        </Card>
      </Section>

      <Section label={x(M.settings_integrations)}>
        <Card>
          {integrations.map((ig) => (
            <div
              key={ig.t.en}
              className="flex items-center justify-between gap-[14px] border-t border-inset px-[18px] py-[12px] first:border-t-0"
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
            <Link
              to={pricingPath}
              className="rounded-[8px] border border-border bg-surface px-[12px] py-[6px] font-sans text-[12px] font-bold text-text no-underline"
            >
              {x(M.settings_billing_see_plans)}
            </Link>
          </div>
          <div className="border-t border-inset px-[18px] py-[10px] text-[11px] text-text-faint">
            {x(M.settings_integrations_demo_note)}
          </div>
        </Card>
      </Section>

      <Section label={x(M.settings_audit)}>
        <Card>
          {auditEvents.map((ev) => (
            <div
              key={ev.text.en}
              className="flex items-start gap-[12px] border-t border-inset px-[18px] py-[11px] first:border-t-0"
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
    </>
  )
}
