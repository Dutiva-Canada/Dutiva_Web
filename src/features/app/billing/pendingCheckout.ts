import { getPlanById, type PlanId } from '@/config/plans'

/**
 * Remembers which paid plan a signed-out visitor clicked so that after
 * magic-link sign-in they land back on /pricing and checkout can start.
 * sessionStorage only — never a cookie, never a claim about membership.
 */
const STORAGE_KEY = 'dutiva-pending-checkout'

function canUseStorage(): boolean {
  return typeof sessionStorage !== 'undefined'
}

export function setPendingCheckout(planId: PlanId): void {
  if (!canUseStorage() || planId === 'free') return
  try {
    sessionStorage.setItem(STORAGE_KEY, planId)
  } catch {
    /* Private mode / quota — the visitor can still pick a plan on /pricing. */
  }
}

export function peekPendingCheckout(): PlanId | null {
  if (!canUseStorage()) return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const plan = getPlanById(raw)
    return plan && plan.id !== 'free' ? plan.id : null
  } catch {
    return null
  }
}

/** Read-and-clear so a refresh cannot start a second checkout. */
export function takePendingCheckout(): PlanId | null {
  const planId = peekPendingCheckout()
  if (!canUseStorage()) return planId
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  return planId
}
