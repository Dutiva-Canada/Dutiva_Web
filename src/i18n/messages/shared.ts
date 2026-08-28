import { common } from './common'
import { landing } from './landing/index'
import { supportMessages } from './support'
import { helpCenterMessages } from './helpCenter'

/**
 * Genuinely read from both surfaces — split into its own module so
 * `workspace.ts` and `marketing.ts` can each merge it in without importing
 * the other surface's modules. See `index.ts` for the full placement rules
 * this was derived from.
 *
 * - `common` — the standing legal disclaimer and shared chrome, used by the
 *   marketing legal pages, the workspace, and `src/components/Disclaimer.tsx`.
 * - `landing` — **the one that makes a naive split crash.** Plan copy in
 *   `src/config/plans.ts` points at `landing_*` keys, and the workspace's
 *   `PlanGate` resolves `requiredPlan.descKey` through `t()`
 *   (`src/features/app/billing/PlanGate.tsx`). Dropping `landing` from the
 *   workspace catalogue breaks a workspace component, not a marketing page.
 * - `support` — the support feature is deliberately dual-surface: the same
 *   modules back the signed-out `/contact` intake and the in-app request form.
 * - `helpCenter` — same shape; the Help Centre is a marketing surface whose
 *   widgets live under `src/features/support/`.
 */
export const sharedMessages = {
  ...common,
  ...landing,
  ...supportMessages,
  ...helpCenterMessages,
} as const

export type SharedMessageKey = keyof typeof sharedMessages
