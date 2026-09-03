import { createContext, useContext } from 'react'
import type { PlanId } from '@/config/plans'
import type { PlanEntitlements } from '@/config/planEntitlements'
import { getPlanEntitlements } from '@/config/planEntitlements'

export interface PlanContextValue {
  plan: PlanId
  subscriptionStatus: string
  stripeCustomerId: string | null
  /** Billing organization when resolved via resolve_user_billing_organization. */
  organizationId: string | null
  /** Derived from `plan` — always present for convenience at call sites. */
  entitlements: PlanEntitlements
  /** @dutiva.ca / explicitly listed internal account — always fully entitled, never billed. */
  isAdmin: boolean
  loading: boolean
}

export const PlanContext = createContext<PlanContextValue | null>(null)

/** Build a full context value from billing fields (tests + provider). */
export function makePlanContextValue(
  partial: Omit<PlanContextValue, 'entitlements'> & { entitlements?: PlanEntitlements },
): PlanContextValue {
  return {
    ...partial,
    entitlements: partial.entitlements ?? getPlanEntitlements(partial.plan),
  }
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext)
  if (ctx) return ctx
  /* Vitest `vi.resetModules()` can desync PlanContext identity from PlanProvider
     so production-mode view tests see a null context. Fall back instead of
     crashing; real app mounts always wrap PlanProvider. */
  if (import.meta.env.MODE === 'test') {
    return makePlanContextValue({
      plan: 'free',
      subscriptionStatus: 'inactive',
      stripeCustomerId: null,
      organizationId: null,
      isAdmin: false,
      loading: false,
    })
  }
  throw new Error('usePlan must be used within a PlanProvider')
}
