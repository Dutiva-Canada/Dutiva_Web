import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { usePlan } from '@/features/app/billing/planContext'
import { openBillingPortal } from '@/features/app/billing/openBillingPortal'
import { getPlanById } from '@/config/plans'
import { seoRoute } from '@/seo/routes'
import { settingsMessages as M } from '@/i18n/messages/settings'
import { Card, Section } from './settingsPrimitives'

/** Production billing: current plan + Stripe portal / pricing deep-links. */
export function SettingsBillingSection() {
  const { x, t, lang } = useI18n()
  const { showToast } = useToasts()
  const { plan, subscriptionStatus, stripeCustomerId, isAdmin: isBillingAdmin } = usePlan()
  const [portalLoading, setPortalLoading] = useState(false)
  const def = getPlanById(plan)
  const planName = def ? t(def.nameKey) : plan
  const priceLabel =
    def && def.monthlyPrice > 0
      ? x(M.settings_billing_plan_paid)
          .replace('{name}', planName)
          .replace('{price}', String(def.monthlyPrice))
      : x(M.settings_billing_plan_free).replace('{name}', planName)
  const statusLabel = x(M.settings_billing_status).replace('{status}', subscriptionStatus || '—')
  const canOpenPortal = Boolean(stripeCustomerId) || isBillingAdmin

  const manage = async () => {
    if (portalLoading) return
    setPortalLoading(true)
    try {
      const result = await openBillingPortal()
      if (result.ok) return
      showToast(
        result.reason === 'unavailable'
          ? M.settings_billing_unavailable
          : M.settings_billing_portal_failed,
        'info',
      )
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <Section label={x(M.settings_billing_section)}>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-[14px] px-[18px] py-[14px]">
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold text-text">{priceLabel}</div>
            <div className="mt-[2px] text-[12px] text-text-muted">{statusLabel}</div>
          </div>
          <div className="flex flex-wrap items-center gap-[8px]">
            {canOpenPortal && (
              <button
                type="button"
                disabled={portalLoading}
                onClick={() => void manage()}
                className="cursor-pointer rounded-[8px] border border-border bg-surface px-[12px] py-[6px] font-sans text-[12px] font-bold text-text disabled:cursor-not-allowed disabled:opacity-60"
              >
                {x(M.settings_billing_btn)}
              </button>
            )}
            <Link
              to={seoRoute('pricing').path[lang]}
              className="rounded-[8px] border border-border bg-surface px-[12px] py-[6px] font-sans text-[12px] font-bold text-text no-underline"
            >
              {x(M.settings_billing_see_plans)}
            </Link>
          </div>
        </div>
        <div className="border-t border-inset px-[18px] py-[10px] text-[11px] text-text-faint">
          {x(isBillingAdmin ? M.settings_billing_staff_note : M.settings_billing_note)}
        </div>
      </Card>
    </Section>
  )
}
