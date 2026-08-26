import { stringId } from './billing-event.ts'

export type AdvisorPackSize = 50 | 200

export type AdvisorPackGrant = {
  userId: string
  packSize: AdvisorPackSize
  checkoutSessionId: string
}

/**
 * Pack Checkout must never go through `getCheckoutProfilePatch` — that helper
 * defaults unrecognized `metadata.plan` to `'free'` and would overwrite a
 * paid subscription. Branch on `kind=advisor_pack` first.
 */
export function advisorPackGrantFromSession(
  session: Record<string, unknown>,
): AdvisorPackGrant | null {
  const metadata = (session.metadata ?? {}) as Record<string, unknown>
  if (String(metadata.kind ?? '') !== 'advisor_pack') return null

  const pack = Number(metadata.pack)
  const packSize: AdvisorPackSize | null = pack === 50 || pack === 200 ? pack : null
  const userId = stringId(metadata.user_id) ?? stringId(session.client_reference_id)
  const checkoutSessionId = stringId(session.id)
  if (!userId || !checkoutSessionId || packSize === null) return null
  return { userId, packSize, checkoutSessionId }
}
