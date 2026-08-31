/**
 * Pure logic for the law-change weekly digest (TODO.md D1), kept apart from
 * lawUpdateRelevance.ts (which answers "is this row customer-relevant at
 * all") because this module answers a different question: "which relevant,
 * reviewed rows has this recipient not already been told about." Same
 * discipline as scheduledCalls.ts and triage.ts — no I/O, callers pass `now`.
 */

import type { SupportedJurisdiction } from './lawUpdateRelevance.ts'

/**
 * Which jurisdiction(s) a recipient should hear about, decided
 * 2026-08-06: `organizations.default_jurisdiction` wins over
 * `profiles.province` when both are set. Not wired to a real recipient yet —
 * the pilot digest (send-law-updates) sends every supported jurisdiction to
 * one internal address — but the rule is decided, so it's built and tested
 * ahead of the recipient model actually expanding past internal-only
 * (docs/LAW_CHANGE_NOTIFICATIONS.md §4a/§4c).
 *
 * A profile's `province` is a two-letter code that may not be one of the
 * three Dutiva supports (e.g. 'BC'); `parseSupportedJurisdiction` narrows
 * that the same fail-closed way `toSupportedJurisdiction` narrows a monitor
 * jurisdiction name — unsupported means "not ours to talk about", not
 * "unknown, pass it through".
 */
export function parseSupportedJurisdiction(
  value: string | null | undefined,
): SupportedJurisdiction | null {
  if (typeof value !== 'string') return null
  const upper = value.trim().toUpperCase()
  return upper === 'ON' || upper === 'QC' || upper === 'FED' ? upper : null
}

export function resolveRecipientJurisdictions(
  profileProvince: string | null | undefined,
  organizationDefaultJurisdiction: string | null | undefined,
): SupportedJurisdiction[] {
  const orgJurisdiction = parseSupportedJurisdiction(organizationDefaultJurisdiction)
  if (orgJurisdiction) return [orgJurisdiction]
  const profileJurisdiction = parseSupportedJurisdiction(profileProvince)
  if (profileJurisdiction) return [profileJurisdiction]
  return []
}

export interface DigestCandidateRow {
  id: string
  reviewStatus: string
  detectedAt: string | null
}

/**
 * Reviewed rows, detected on or after `goLiveAt`, not already recorded as
 * sent to `recipient`. Callers are expected to have already narrowed to
 * relevant (`change`, supported-jurisdiction) rows via
 * `selectRelevantUpdates` — this only adds the review gate, the backfill
 * cutoff, and the already-sent exclusion, so each concern stays testable on
 * its own.
 */
export function selectDigestableUpdates<T extends DigestCandidateRow>(
  rows: readonly T[],
  alreadySentIds: ReadonlySet<string>,
  goLiveAt: Date,
): T[] {
  return rows.filter((row) => {
    if (row.reviewStatus !== 'reviewed') return false
    if (alreadySentIds.has(row.id)) return false
    if (!row.detectedAt) return false
    const detected = new Date(row.detectedAt)
    if (Number.isNaN(detected.getTime())) return false
    return detected >= goLiveAt
  })
}
