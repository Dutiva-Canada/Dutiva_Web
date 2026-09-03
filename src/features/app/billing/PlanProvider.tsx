import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '@/features/app/auth/authContext'
import { supabase } from '@/lib/supabaseClient'
import { bypassesPaywall } from '@/lib/billing/adminAccess'
import { normalizePlanId } from '@/config/plans'
import type { PlanId } from '@/config/plans'
import { PlanContext, makePlanContextValue } from './planContext'
import type { PlanContextValue } from './planContext'

type BillingState = {
  plan: PlanId
  subscriptionStatus: string
  stripeCustomerId: string | null
  organizationId: string | null
  loading: boolean
}

const DEFAULT_STATE: BillingState = {
  plan: 'free',
  subscriptionStatus: 'inactive',
  stripeCustomerId: null,
  organizationId: null,
  loading: true,
}

/**
 * Resolves the signed-in account's plan for billing UI and (when
 * PLAN_FEATURE_GATES_ENABLED) feature gates.
 *
 * An internal Dutiva account (adminAccess.ts) always resolves to the top
 * plan with billing bypassed. Everyone else: profile first, then
 * `resolve_user_billing_organization` + organizations billing columns when
 * an org exists — org billing wins over profile. Falls back to profile when
 * the RPC/org read fails or returns nothing.
 *
 * PlanProvider sits outside WorkspaceModeProvider (see AppProviders), so it
 * cannot read organizationId from workspace mode — the RPC is the source.
 */
export function PlanProvider({ children }: { children: ReactNode }) {
  const { status, session } = useAuth()
  const [state, setState] = useState<BillingState>(DEFAULT_STATE)
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
        organizationId: null,
        loading: false,
      })
      return
    }

    if (!supabase || status !== 'signed-in' || !session) {
      setState({
        plan: 'free',
        subscriptionStatus: 'inactive',
        stripeCustomerId: null,
        organizationId: null,
        loading: false,
      })
      return
    }

    const client = supabase
    const userId = session.user.id

    async function loadPlan() {
      try {
        const { data: profile, error: profileError } = await client
          .from('profiles')
          .select('plan, subscription_status, stripe_customer_id')
          .eq('id', userId)
          .maybeSingle()

        if (cancelled) return

        if (profileError) {
          console.error('plan: profile read failed —', profileError)
          setState({
            plan: 'free',
            subscriptionStatus: 'inactive',
            stripeCustomerId: null,
            organizationId: null,
            loading: false,
          })
          return
        }

        const profileBilling: BillingState = {
          plan: normalizePlanId(profile?.plan),
          subscriptionStatus: profile?.subscription_status ?? 'inactive',
          stripeCustomerId: profile?.stripe_customer_id ?? null,
          organizationId: null,
          loading: false,
        }

        let orgId: string | null = null
        try {
          const { data: resolvedOrgId, error: rpcError } = await client.rpc(
            'resolve_user_billing_organization',
            { p_user_id: userId },
          )
          if (rpcError) {
            console.error('plan: resolve_user_billing_organization failed —', rpcError)
          } else if (typeof resolvedOrgId === 'string' && resolvedOrgId.length > 0) {
            orgId = resolvedOrgId
          }
        } catch (error) {
          console.error('plan: resolve_user_billing_organization rejected —', error)
        }

        if (cancelled) return

        if (!orgId) {
          setState(profileBilling)
          return
        }

        const { data: org, error: orgError } = await client
          .from('organizations')
          .select('plan, subscription_status, stripe_customer_id')
          .eq('id', orgId)
          .maybeSingle()

        if (cancelled) return

        if (orgError) {
          console.error('plan: organization billing read failed —', orgError)
          setState(profileBilling)
          return
        }

        if (!org) {
          setState({ ...profileBilling, organizationId: orgId })
          return
        }

        setState({
          plan: normalizePlanId(org.plan),
          subscriptionStatus: org.subscription_status ?? 'inactive',
          stripeCustomerId: org.stripe_customer_id ?? null,
          organizationId: orgId,
          loading: false,
        })
      } catch (error) {
        if (cancelled) return
        console.error('plan: billing read rejected —', error)
        setState({
          plan: 'free',
          subscriptionStatus: 'inactive',
          stripeCustomerId: null,
          organizationId: null,
          loading: false,
        })
      }
    }

    void loadPlan()

    return () => {
      cancelled = true
    }
  }, [status, session, isAdmin])

  const value = useMemo<PlanContextValue>(
    () =>
      makePlanContextValue({
        ...state,
        isAdmin,
      }),
    [state, isAdmin],
  )

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}
