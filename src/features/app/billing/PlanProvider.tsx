import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '@/features/app/auth/authContext'
import { supabase } from '@/lib/supabaseClient'
import { bypassesPaywall } from '@/lib/billing/adminAccess'
import { normalizePlanId } from '@/config/plans'
import { PlanContext } from './planContext'
import type { PlanContextValue } from './planContext'

const DEFAULT_STATE: Omit<PlanContextValue, 'isAdmin'> = {
  plan: 'free',
  subscriptionStatus: 'inactive',
  stripeCustomerId: null,
  loading: true,
}

/**
 * Resolves the signed-in account's plan for billing UI (currently just the
 * /pricing page — see CONVENTIONS.md "prep work only" scope; this does not
 * gate /app, which stays behind RequireAdminSession regardless of plan).
 *
 * An internal Dutiva account (adminAccess.ts) always resolves to the top
 * plan with billing bypassed, matching the production dutiva-website repo's
 * PlanContext — this is the "automatically bypass the paywall" behavior.
 * Everyone else reads `public.profiles` (populated by the Stripe checkout
 * and webhook functions in supabase/functions/), defaulting to the free
 * plan until a row exists.
 */
export function PlanProvider({ children }: { children: ReactNode }) {
  const { status, session } = useAuth()
  const [state, setState] = useState<Omit<PlanContextValue, 'isAdmin'>>(DEFAULT_STATE)
  const email = session?.user.email
  const isAdmin = bypassesPaywall(email)

  useEffect(() => {
    let cancelled = false

    if (status === 'loading') {
      setState((prev) => ({ ...prev, loading: true }))
      return
    }

    if (isAdmin) {
      setState({
        plan: 'pro',
        subscriptionStatus: 'active',
        stripeCustomerId: null,
        loading: false,
      })
      return
    }

    if (!supabase || status !== 'signed-in' || !session) {
      setState({
        plan: 'free',
        subscriptionStatus: 'inactive',
        stripeCustomerId: null,
        loading: false,
      })
      return
    }

    const client = supabase
    const userId = session.user.id

    async function loadPlan() {
      try {
        const { data, error } = await client
          .from('profiles')
          .select('plan, subscription_status, stripe_customer_id')
          .eq('id', userId)
          .maybeSingle()
        if (cancelled) return
        if (error) {
          console.error('plan: profile read failed —', error)
          setState({
            plan: 'free',
            subscriptionStatus: 'inactive',
            stripeCustomerId: null,
            loading: false,
          })
          return
        }
        setState({
          plan: normalizePlanId(data?.plan),
          subscriptionStatus: data?.subscription_status ?? 'inactive',
          stripeCustomerId: data?.stripe_customer_id ?? null,
          loading: false,
        })
      } catch (error) {
        if (cancelled) return
        console.error('plan: profile read rejected —', error)
        setState({
          plan: 'free',
          subscriptionStatus: 'inactive',
          stripeCustomerId: null,
          loading: false,
        })
      }
    }

    void loadPlan()

    return () => {
      cancelled = true
    }
  }, [status, session, isAdmin])

  const value = useMemo(() => ({ ...state, isAdmin }), [state, isAdmin])

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}
