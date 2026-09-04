import { useEffect, useState } from 'react'
import { useI18n } from '@/i18n/context'
import { pickL } from '@/i18n/core'
import { settingsMessages as M } from '@/i18n/messages/settings'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { usePlan } from '@/features/app/billing/planContext'
import { fetchAdvisorUsageSummary, type AdvisorUsageSummary } from './advisorUsageSummaryApi'

function formatDay(iso: string, lang: 'en' | 'fr'): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function planLabel(plan: string, lang: 'en' | 'fr'): string {
  const key = plan.trim().toLowerCase()
  const map: Record<string, { en: string; fr: string }> = {
    free: { en: 'Free', fr: 'Gratuit' },
    starter: { en: 'Starter', fr: 'Débutant' },
    growth: { en: 'Growth', fr: 'Croissance' },
    pro: { en: 'Professional', fr: 'Professionnel' },
  }
  const row = map[key]
  if (!row) return plan
  return lang === 'fr' ? row.fr : row.en
}

/**
 * Compact org Advisor usage from `advisor_usage_summary`. For @dutiva.ca staff,
 * replies aren't capped — the org meter is budget visibility only (see
 * `.cursor/rules/dutiva-internal-accounts.mdc`).
 */
export function AdvisorUsagePanel({ compact = false }: { readonly compact?: boolean }) {
  const { x, lang } = useI18n()
  const { organizationId } = useWorkspaceMode()
  const { isAdmin: isStaff } = usePlan()
  const [summary, setSummary] = useState<AdvisorUsageSummary | null>(null)

  useEffect(() => {
    if (!organizationId) {
      setSummary(null)
      return
    }
    let cancelled = false
    void fetchAdvisorUsageSummary(organizationId).then((row) => {
      if (!cancelled) setSummary(row)
    })
    return () => {
      cancelled = true
    }
  }, [organizationId])

  if (!organizationId || !summary) return null

  const shellClass = compact
    ? 'mb-4 overflow-hidden rounded-xl border border-border bg-surface px-[14px] py-[10px] text-left'
    : 'border-t border-inset px-[18px] py-[14px]'
  const titleClass = compact
    ? 'text-[12px] font-bold tracking-[0.04em] text-text-muted uppercase'
    : 'text-[13.5px] font-semibold text-text'

  if (isStaff) {
    const meterLine = pickL(M.settings_advisor_usage_staff_meter, lang)
      .replaceAll('{used}', String(summary.monthlyUsed))
      .replaceAll('{limit}', String(summary.monthlyLimit))
      .replaceAll('{plan}', planLabel(summary.plan, lang))

    return (
      <div className={shellClass} role="status" aria-label={x(M.settings_advisor_usage_title)}>
        <div className={titleClass}>{x(M.settings_advisor_usage_title)}</div>
        <p className="m-0 mt-[8px] text-[12.5px] leading-[1.45] text-text-2">
          {x(M.settings_advisor_usage_staff)}
        </p>
        <p className="m-0 mt-[6px] text-[12px] leading-[1.45] text-text-muted">{meterLine}</p>
      </div>
    )
  }

  const yesNo = summary.overageEnabled
    ? x(M.settings_advisor_usage_yes)
    : x(M.settings_advisor_usage_no)

  const monthlyLine = pickL(M.settings_advisor_usage_monthly, lang)
    .replaceAll('{remaining}', String(summary.monthlyRemaining))
    .replaceAll('{limit}', String(summary.monthlyLimit))

  let rolloverLine = pickL(M.settings_advisor_usage_rollover_none, lang).replaceAll(
    '{balance}',
    String(summary.rolloverBalance),
  )
  if (summary.rolloverBalance > 0 && summary.nearestRolloverExpiry) {
    rolloverLine = pickL(M.settings_advisor_usage_rollover, lang)
      .replaceAll('{balance}', String(summary.rolloverBalance))
      .replaceAll('{date}', formatDay(summary.nearestRolloverExpiry, lang))
  }

  const packLine = pickL(M.settings_advisor_usage_pack, lang).replaceAll(
    '{balance}',
    String(summary.packBalance),
  )
  const overageLine = pickL(M.settings_advisor_usage_overage, lang).replaceAll('{yesNo}', yesNo)
  const resetLine = pickL(M.settings_advisor_usage_reset, lang).replaceAll(
    '{date}',
    formatDay(summary.nextResetAt, lang),
  )

  return (
    <div className={shellClass} role="status" aria-label={x(M.settings_advisor_usage_title)}>
      <div className={titleClass}>{x(M.settings_advisor_usage_title)}</div>
      <ul className="mt-[8px] m-0 list-none space-y-[4px] p-0 text-[12.5px] leading-[1.45] text-text-2">
        <li>{monthlyLine}</li>
        <li>{rolloverLine}</li>
        <li>{packLine}</li>
        <li>{overageLine}</li>
        <li>{resetLine}</li>
      </ul>
      <p className="m-0 mt-[8px] text-[11.5px] leading-[1.45] text-text-muted">
        {x(M.settings_advisor_usage_order)}
      </p>
    </div>
  )
}
