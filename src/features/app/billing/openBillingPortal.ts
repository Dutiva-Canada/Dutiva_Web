import { supabase } from '@/lib/supabaseClient'

/**
 * Opens the Stripe customer portal for the signed-in billing owner.
 * Returns an error code the UI can map to existing pricing/settings copy.
 */
export type OpenBillingPortalResult =
  | { ok: true }
  | { ok: false; reason: 'unavailable' | 'failed' }

export async function openBillingPortal(): Promise<OpenBillingPortalResult> {
  if (!supabase) return { ok: false, reason: 'unavailable' }
  try {
    const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(
      'create-portal-session',
      { body: {} },
    )
    if (error) return { ok: false, reason: 'failed' }
    if (data?.url) {
      window.location.href = data.url
      return { ok: true }
    }
    return { ok: false, reason: 'failed' }
  } catch {
    return { ok: false, reason: 'failed' }
  }
}
