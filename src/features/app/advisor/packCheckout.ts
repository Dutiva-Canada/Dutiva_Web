import { supabase } from '@/lib/supabaseClient'
import { isAdvisorPackSize } from '@/config/advisorUsage'
import type { AdvisorPackSize } from '@/config/advisorUsage'

export type AdvisorPackCheckoutResult =
  { kind: 'url'; url: string } | { kind: 'bypass'; message: string }

/**
 * Starts Stripe Checkout for a prepaid Advisor reply pack. The caller must
 * already be signed in — the Advisor workspace is behind auth.
 */
export async function startAdvisorPackCheckout(
  pack: AdvisorPackSize,
): Promise<AdvisorPackCheckoutResult> {
  if (!supabase) {
    throw new Error('Payments are not configured in this environment.')
  }
  if (!isAdvisorPackSize(pack)) {
    throw new Error('Invalid Advisor reply pack.')
  }
  const { data, error } = await supabase.functions.invoke<{
    url?: string
    bypass?: boolean
    message?: string
    error?: string
  }>('create-advisor-pack-checkout', { body: { pack } })
  if (error) throw error
  if (data?.bypass) {
    return { kind: 'bypass', message: data.message ?? '' }
  }
  if (data?.url) {
    return { kind: 'url', url: data.url }
  }
  throw new Error(data?.error ?? 'Pack checkout missing url')
}
