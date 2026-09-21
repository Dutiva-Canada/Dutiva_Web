import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { demoTodayISO } from '../calendar'
import type {
  MemoryCategory,
  MemoryClassification,
  MemoryConfirmation,
  MemoryFact,
  MemoryLegalHold,
  MemoryOrigin,
  MemoryRetentionCategory,
  MemoryRetrievalScope,
  MemoryScope,
  MemorySensitivity,
  MemorySourceType,
  MemoryStatus,
  MemoryVisibility,
} from '../types'

/**
 * Advisor Memory seed facts — extracted from `memories.ts` to keep that file
 * under the 800-line architecture budget. Entity ids map onto the existing
 * app fixtures (Jordan Mensah `e1` / `case1` / chat `c1`, Amara Okafor `e6` /
 * `case3`, Devon Clarke `e5`) so memory surfaces link to real routes. EN
 * follows corrected demo facts; FR [self-authored].
 */

export interface MemoryFactInputBase {
  id: string
  scope: MemoryScope
  entityId: string
  category: MemoryCategory
  statement: Bi
  source: { type: MemorySourceType; detail: Bi }
  learnedAt: string
  effectiveAt?: string | null
  visibility: MemoryVisibility
  sensitive?: boolean
  /* New domain fields */
  status?: MemoryStatus
  classification?: MemoryClassification
  origin?: MemoryOrigin
  sensitivity?: MemorySensitivity
  advisorUsable?: boolean
  retentionCategory?: MemoryRetentionCategory
  reviewDate?: string | null
  expiryDate?: string | null
  lastVerifiedAt?: string | null
  legalHold?: MemoryLegalHold | null
  purpose?: Bi | null
  jurisdiction?: string | null
  proposedBy?: string | null
  confidenceScore?: number | null
  sourceExcerpt?: Bi | null
  creator?: string | null
  confirmedBy?: string | null
  tags?: Bi[] | null
  retrievalScope?: MemoryRetrievalScope | null
}

/** Confirmed facts must not be seeded from Advisor inference alone. */
export type MemoryFactInput =
  | (MemoryFactInputBase & {
      confidence: 'confirmed'
      source: { type: Exclude<MemorySourceType, 'inference'>; detail: Bi }
      confirmation: MemoryConfirmation
    })
  | (MemoryFactInputBase & {
      confidence: 'inferred'
      confirmation: null
    })

export const M = (input: MemoryFactInput): MemoryFact => ({
  id: input.id,
  scope: input.scope,
  entityId: input.entityId,
  category: input.category,
  statement: input.statement,
  confidence: input.confidence,
  source: input.source,
  learnedAt: input.learnedAt,
  ...(input.effectiveAt != null ? { effectiveAt: input.effectiveAt } : {}),
  confirmation: input.confirmation,
  visibility: input.visibility,
  sensitive: input.sensitive ?? false,
  ...(input.status != null ? { status: input.status } : {}),
  ...(input.classification != null ? { classification: input.classification } : {}),
  ...(input.origin != null ? { origin: input.origin } : {}),
  ...(input.sensitivity != null ? { sensitivity: input.sensitivity } : {}),
  ...(input.advisorUsable != null ? { advisorUsable: input.advisorUsable } : {}),
  ...(input.retentionCategory != null ? { retentionCategory: input.retentionCategory } : {}),
  ...(input.reviewDate != null ? { reviewDate: input.reviewDate } : {}),
  ...(input.expiryDate != null ? { expiryDate: input.expiryDate } : {}),
  ...(input.lastVerifiedAt != null ? { lastVerifiedAt: input.lastVerifiedAt } : {}),
  ...(input.legalHold != null ? { legalHold: input.legalHold } : {}),
  ...(input.purpose != null ? { purpose: input.purpose } : {}),
  ...(input.jurisdiction != null ? { jurisdiction: input.jurisdiction } : {}),
  ...(input.proposedBy != null ? { proposedBy: input.proposedBy } : {}),
  ...(input.confidenceScore != null ? { confidenceScore: input.confidenceScore } : {}),
  ...(input.sourceExcerpt != null ? { sourceExcerpt: input.sourceExcerpt } : {}),
  ...(input.creator != null ? { creator: input.creator } : {}),
  ...(input.confirmedBy != null ? { confirmedBy: input.confirmedBy } : {}),
  ...(input.tags != null ? { tags: input.tags } : {}),
  ...(input.retrievalScope != null ? { retrievalScope: input.retrievalScope } : {}),
})

export const peopleRecord = bi('People record', 'Dossier du personnel')
export const caseNoteRiley = bi('Case note · Riley Summers', 'Note de dossier · Riley Summers')
export const caseAmara = bi('CASE-2026-0138', 'CASE-2026-0138')

/** ISO dates for deterministic demo memory (scenario date: Jul 11, 2026). */
export const APR2026 = '2026-04-03'
export const JUN22 = '2026-06-22'
export const JUL2 = '2026-07-02'
export const JUL5 = '2026-07-05'
export const JUL11 = demoTodayISO
