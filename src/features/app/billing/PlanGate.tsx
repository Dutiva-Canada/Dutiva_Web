import { Link } from 'react-router-dom'
import { ArrowRight, Lock } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { seoRoute } from '@/seo/routes'
import {
  PLAN_FEATURE_GATES_ENABLED,
  getPlanById,
  hasPlanAccess,
  hasActiveSubscription,
  planDescKey,
} from '@/config/plans'
import type { PlanId } from '@/config/plans'
import type { PlanFeature } from '@/config/planEntitlements'
import { hasPlanFeature, requiredPlanForFeature } from '@/config/planEntitlements'
import { useContext } from 'react'
import { PlanContext } from './planContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'

function meetsRequirement(plan: PlanId, subscriptionStatus: string, required: PlanId): boolean {
  if (!hasPlanAccess(plan, required)) return false
  /* Free-tier requirements do not need an active Stripe subscription. */
  if (required === 'free') return true
  return hasActiveSubscription(subscriptionStatus)
}

function meetsFeature(plan: PlanId, subscriptionStatus: string, feature: PlanFeature): boolean {
  if (!hasPlanFeature(plan, feature)) return false
  const required = requiredPlanForFeature(feature)
  if (required === 'free') return true
  return hasActiveSubscription(subscriptionStatus)
}

export type PlanGateProps = {
  readonly children: React.ReactNode
} & (
  | { readonly required: PlanId; readonly feature?: never }
  | { readonly feature: PlanFeature; readonly required?: never }
  | { readonly required: PlanId; readonly feature: PlanFeature }
)

/**
 * Reusable plan gate for paid views. Renders `children` once the signed-in
 * account meets `required` and/or `feature`; an internal Dutiva account
 * (adminAccess.ts) always passes, matching PlanProvider's bypass.
 *
 * Demo mode bypasses the gate entirely — the demo experience (Northgate
 * Logistics fixtures) is the marketing surface, and every visitor should
 * see the full product. Plan gates only enforce in production mode.
 *
 * Product feature gates stay off while `PLAN_FEATURE_GATES_ENABLED` is false
 * — paying currently buys support, not extra modules. Flip that flag only
 * when per-plan limits are enforced and advertised.
 */
export function PlanGate(props: PlanGateProps) {
  const { children, required, feature } = props
  /* Optional context: view tests and marketing shells may omit PlanProvider.
     Gates-off / demo always pass children without requiring a provider. */
  const planCtx = useContext(PlanContext)
  const { mode } = useWorkspaceMode()

  if (mode === 'demo') return <>{children}</>
  /* Gates off: product is fully open — do not blank the UI while plan loads. */
  if (!PLAN_FEATURE_GATES_ENABLED) return <>{children}</>
  if (!planCtx || planCtx.loading) return null
  if (planCtx.isAdmin) return <>{children}</>

  const { plan, subscriptionStatus } = planCtx

  const requiredPlan: PlanId =
    feature !== undefined ? requiredPlanForFeature(feature) : (required as PlanId)

  const allowed =
    feature !== undefined
      ? meetsFeature(plan, subscriptionStatus, feature) &&
        (required === undefined || meetsRequirement(plan, subscriptionStatus, required))
      : meetsRequirement(plan, subscriptionStatus, requiredPlan)

  if (allowed) return <>{children}</>
  return <UpgradeNudge required={requiredPlan} />
}

/**
 * Thin alias — Growth-module call sites prefer `feature=` over a raw PlanId.
 */
export function FeatureGate({
  feature,
  children,
}: {
  readonly feature: PlanFeature
  readonly children: React.ReactNode
}) {
  return <PlanGate feature={feature}>{children}</PlanGate>
}

export function UpgradeNudge({ required }: { readonly required: PlanId }) {
  const { t, lang } = useI18n()
  const requiredPlan = getPlanById(required)

  return (
    <div className="premium-card-soft flex flex-col items-start gap-3 p-6">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-subtle text-gold-strong">
        <Lock size={18} />
      </span>
      {requiredPlan ? (
        <>
          <p className="text-sm font-semibold text-text">{t(requiredPlan.nameKey)}</p>
          <p className="text-sm leading-[1.55] text-text-2">{t(planDescKey(requiredPlan))}</p>
        </>
      ) : null}
      <Link
        to={`${seoRoute('pricing').path[lang]}?upgrade=${required}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-strong transition-opacity hover:opacity-80"
      >
        {t('landing_price_compare')}
        <ArrowRight size={14} />
      </Link>
    </div>
  )
}
