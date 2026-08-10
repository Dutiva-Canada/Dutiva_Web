import type { Bi } from '@/i18n/core'
import type { Jurisdiction } from '@/features/app/documents/data/types'
import type { ChipTone } from '@/components/chips'

/**
 * Which supported jurisdictions law-change monitoring actually covers.
 *
 * The monitor sweeps 19 pages across 14 jurisdictions, but sweeping a page is
 * not the same as detecting an amendment on it. A 2026-07-30 audit
 * (docs/LAW_MONITORING.md) found most sources unusable: Ontario serves a
 * JavaScript shell whose statute text never reaches a server-side fetch, and
 * Québec's source refuses automated requests outright. Neither is fixable by
 * changing a URL.
 *
 * The product says so rather than letting the panel imply working coverage.
 * That is the whole point of this module: **monitored is not covered**, and a
 * compliance product should never let a customer infer otherwise.
 *
 * Scope is the three supported jurisdictions (docs/CANONICAL_FACTS.md), not
 * all 14 monitored — a jurisdiction Dutiva does not support should not appear
 * in a coverage claim at all, working or not.
 *
 * **This is a maintained claim, deliberately not derived from
 * `law_page_hashes`.** Deriving it would re-create the failure it exists to
 * prevent: the health column read healthy for months precisely because a
 * blocked page answered HTTP 200. A stated claim, dated and reviewed, cannot
 * drift silently in the reassuring direction. Re-run the audit and update
 * `COVERAGE_AUDITED_ON` in the same change.
 */

/** Date of the audit these statuses describe. Shown to the reader. */
export const COVERAGE_AUDITED_ON = '2026-08-10'

export type CoverageStatus =
  /** Verified to be fetching real legislation and able to detect a change. */
  | 'active'
  /** Reachable but unusable — cannot detect an amendment. */
  | 'unavailable'
  /** Not confirmed either way since the audit; do not claim it works. */
  | 'unverified'

export interface JurisdictionCoverage {
  jurisdiction: Jurisdiction
  label: Bi
  status: CoverageStatus
  /** Why, in the customer's words — plain, specific, no hedging. */
  detail: Bi
}

/** [FR self-authored] throughout — no prototype counterpart for this panel. */
export const MONITORING_COVERAGE: readonly JurisdictionCoverage[] = [
  {
    jurisdiction: 'ON',
    label: { en: 'Ontario', fr: 'Ontario' },
    status: 'active',
    detail: {
      en: 'Ontario statutes are now read from the e-Laws act-versions API, which publishes machine-readable, byte-stable JSON. The scheduled sweep on 2026-08-10 confirmed all three Ontario pages are fetched and baselined.',
      fr: "Les lois ontariennes sont désormais lues à partir de l'API des versions de lois d'e-Laws, qui publie du JSON stable et lisible par machine. La vérification programmée du 2026-08-10 a confirmé que les trois pages ontariennes sont récupérées et référencées.",
    },
  },
  {
    jurisdiction: 'QC',
    label: { en: 'Quebec', fr: 'Québec' },
    status: 'active',
    detail: {
      en: "Québec statutes are now read from Données Québec's codified-legislation CKAN dataset, which publishes a first-party, byte-stable zip. The scheduled sweep on 2026-08-10 confirmed both the LNT and Charter pages are fetched and baselined.",
      fr: "Les lois québécoises sont désormais lues à partir du jeu de données CKAN Législation codifiée de Données Québec, qui publie un zip stable et provenant d'une source officielle. La vérification programmée du 2026-08-10 a confirmé que les pages de la LNT et de la Charte sont récupérées et référencées.",
    },
  },
  {
    jurisdiction: 'FED',
    label: { en: 'Federal', fr: 'Fédéral' },
    status: 'active',
    detail: {
      en: 'Sourced from the federal government’s own published legislation data, which states when each Act was last amended. The first completed sweep on 2026-08-06 confirmed both federal pages are fetched and baselined.',
      fr: "Provient des données législatives publiées par le gouvernement fédéral, qui indiquent la date de la dernière modification de chaque loi. La première vérification complète le 2026-08-06 a confirmé que les deux pages fédérales sont récupérées et référencées.",
    },
  },
]

/**
 * How the monitor spells the supported jurisdictions in
 * `law_updates.jurisdiction` — display names, not the product's codes.
 *
 * Used to filter what the panel shows. Monitoring covers 14 jurisdictions and
 * Dutiva supports three, so an unfiltered read puts Alberta and PEI notices in
 * front of an Ontario employer — under a heading that just told them Ontario
 * is not monitored.
 *
 * Mirrors the server-side map in
 * `supabase/functions/_shared/lawUpdateRelevance.ts`; duplicated because edge
 * functions and the client cannot share a module, and pinned by a test.
 */
export const MONITOR_JURISDICTION_NAMES: readonly string[] = ['Ontario', 'Quebec', 'Federal']

/**
 * The only `law_updates.event_type` a customer should ever see.
 *
 * `first_seen` means Dutiva started watching a page, `redirect` means a
 * government moved a URL, and `broken` means Dutiva's own scraper failed.
 * All three are operational records about this product, not legal news — and
 * `redirect` rows alone currently outnumber real changes in the table.
 */
export const CUSTOMER_FACING_EVENT_TYPE = 'change'

const STATUS_TONE: Record<CoverageStatus, ChipTone> = {
  active: 'success',
  unavailable: 'risk',
  unverified: 'warning',
}

export function coverageTone(status: CoverageStatus): ChipTone {
  return STATUS_TONE[status]
}

export const COVERAGE_STATUS_LABEL: Record<CoverageStatus, Bi> = {
  active: { en: 'Monitored', fr: 'Surveillée' },
  unavailable: { en: 'Not monitored', fr: 'Non surveillée' },
  unverified: { en: 'Unconfirmed', fr: 'Non confirmée' },
}

/** True when no supported jurisdiction has confirmed working detection. */
export function noSupportedJurisdictionCovered(
  coverage: readonly JurisdictionCoverage[] = MONITORING_COVERAGE,
): boolean {
  return coverage.every((c) => c.status !== 'active')
}
