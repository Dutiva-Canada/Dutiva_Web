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

/** Narrow client surface for pack grants (Vitest cannot resolve npm:/jsr:). */
export type AdvisorPackDbClient = {
  rpc(
    fn: string,
    params: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>
}

export type AdvisorPackGrantResult =
  | { ok: true; userGranted: boolean; orgGranted: boolean; orgId: string | null }
  | { ok: false; reason: string }

function packVerdictOk(data: unknown): boolean {
  const verdict = data as { granted?: boolean; reason?: string } | null
  return verdict?.granted === true || verdict?.reason === 'duplicate'
}

/**
 * Credits the purchaser's personal pack ledger, then — when a billing org
 * resolves — the org pool (`grant_ai_advisor_org_pack`, idempotent on
 * checkout id). Missing org is not an error: the user pack still lands and
 * a later backfill/org create can adopt usage.
 */
export async function grantAdvisorPackEntitlements(
  client: AdvisorPackDbClient,
  grant: AdvisorPackGrant,
  resolveOrganizationId: (userId: string) => PromiseLike<string | null>,
): Promise<AdvisorPackGrantResult> {
  const { data, error } = await client.rpc('grant_ai_advisor_pack', {
    p_user_id: grant.userId,
    p_pack_size: grant.packSize,
    p_stripe_checkout_id: grant.checkoutSessionId,
  })
  if (error) {
    return { ok: false, reason: error.message }
  }
  if (!packVerdictOk(data)) {
    return { ok: false, reason: 'Could not credit Advisor pack.' }
  }

  const orgId = await resolveOrganizationId(grant.userId)
  if (!orgId) {
    return { ok: true, userGranted: true, orgGranted: false, orgId: null }
  }

  const { data: orgData, error: orgError } = await client.rpc('grant_ai_advisor_org_pack', {
    p_organization_id: orgId,
    p_pack_size: grant.packSize,
    p_stripe_checkout_id: grant.checkoutSessionId,
    p_purchaser_user_id: grant.userId,
  })
  if (orgError) {
    return { ok: false, reason: orgError.message }
  }
  if (!packVerdictOk(orgData)) {
    return { ok: false, reason: 'Could not credit Advisor org pack.' }
  }

  return { ok: true, userGranted: true, orgGranted: true, orgId }
}
