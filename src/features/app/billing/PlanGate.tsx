import { Link } from 'react-router-dom'
import { ArrowRight, Lock } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { PLAN_FEATURE_GATES_ENABLED, getPlanById, hasPaidPlanAccess } from '@/config/plans'
import type { PlanId } from '@/config/plans'
import { usePlan } from './planContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'

/**
 * Reusable plan gate for paid views. Renders `children` once the signed-in
 * account meets `required`; an internal Dutiva account (adminAccess.ts)
 * always passes, matching PlanProvider's bypass.
 *
 * Demo mode bypasses the gate entirely — the demo experience (Northgate
 * Logistics fixtures) is the marketing surface, and every visitor should
 * see the full product. Plan gates only enforce in production mode, where
 * the signed-in admin's real plan from `profiles` determines access.
 *
 * Product feature gates stay off while `PLAN_FEATURE_GATES_ENABLED` is false
 * — paying currently buys support, not extra modules. Flip that flag only
 * when per-plan limits are enforced and advertised. Demo mode always
 * bypasses: the marketing surface shows the full product.
 */
export function PlanGate({
  required,
  children,
}: {
  readonly required: PlanId
  readonly children: React.ReactNode
}) {
  const { plan, subscriptionStatus, isAdmin, loading } = usePlan()
  const { mode } = useWorkspaceMode()

  if (loading) return null
  if (mode === 'demo') return <>{children}</>
  if (!PLAN_FEATURE_GATES_ENABLED) return <>{children}</>
  if (isAdmin || hasPaidPlanAccess(plan, required, subscriptionStatus)) return <>{children}</>
  return <UpgradeNudge required={required} />
}

function UpgradeNudge({ required }: { readonly required: PlanId }) {
  const { t } = useI18n()
  const requiredPlan = getPlanById(required)

  return (
    <div className="premium-card-soft flex flex-col items-start gap-3 p-6">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-subtle text-gold-strong">
        <Lock size={18} />
      </span>
      {requiredPlan ? (
        <p className="text-sm leading-[1.55] text-text-2">{t(requiredPlan.descKey)}</p>
      ) : null}
      <Link
        to={`/pricing?upgrade=${required}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-strong transition-opacity hover:opacity-80"
      >
        {t('landing_price_compare')}
        <ArrowRight size={14} />
      </Link>
    </div>
  )
}
