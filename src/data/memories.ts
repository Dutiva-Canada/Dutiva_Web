import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { demoTodayISO } from './calendar'
import { isCanonicalMemoryDate } from './memoryDates'
import type {
  MemoryFact,
  MemoryRetentionCategory,
  MemorySourceType,
} from './types'

/**
 * Advisor Memory seed fixtures — typed transcription of the Advisor Memory
 * prototype's `seedMemories()` / `people()` / `cases()`. Entity ids map onto
 * the existing app fixtures (Jordan Mensah `e1` / `case1` / chat `c1`,
 * Amara Okafor `e6` / `case3`, Devon Clarke `e5`) so memory surfaces link to
 * real routes. EN follows corrected demo facts; FR [self-authored].
 */

/** @deprecated Use `demoTodayISO` from `@/data` — kept for memory imports. */
export const memoryScenarioTodayISO = demoTodayISO

/* People with a memory profile (memory nav "People" group). */
export interface MemoryPersonChip {
  tone: 'ok' | 'warn' | 'risk' | 'neutral'
  label: Bi
}

export interface MemoryPerson {
  /** Employee id (routes /app/memory/people/:personId, /app/employees/:id). */
  id: string
  firstName: Bi
  navSub: Bi
  /** Profile-header status chips (prototype `people()[].chips`). */
  chips: MemoryPersonChip[]
  /** Case with memory for this person, if any (memory case view id). */
  memoryCaseId: string | null
  /** Real case-detail route target, if any (/app/cases/:caseId). */
  caseId: string | null
  /** Recall conversation for this person, if any (chat id). */
  threadId: string | null
}

export const memoryPeople: MemoryPerson[] = [
  {
    id: 'e1',
    firstName: bi('Jordan', 'Jordan'),
    navSub: bi('Termination', 'Licenciement'),
    chips: [
      { tone: 'risk', label: bi('Case open · high risk', 'Dossier ouvert · risque élevé') },
      { tone: 'ok', label: bi('Active employee', 'Employé actif') },
    ],
    memoryCaseId: 'case1',
    caseId: 'case1',
    threadId: 'c1',
  },
  {
    id: 'e6',
    firstName: bi('Amara', 'Amara'),
    navSub: bi('Accommodation', 'Accommodement'),
    chips: [
      { tone: 'warn', label: bi('Accommodation', 'Accommodement') },
      { tone: 'ok', label: bi('Active employee', 'Employée active') },
    ],
    memoryCaseId: 'case3',
    caseId: 'case3',
    threadId: null,
  },
  {
    id: 'e5',
    firstName: bi('Devon', 'Devon'),
    navSub: bi('Performance', 'Rendement'),
    chips: [
      { tone: 'warn', label: bi('Performance', 'Rendement') },
      { tone: 'ok', label: bi('Active employee', 'Employé actif') },
    ],
    memoryCaseId: null,
    caseId: 'case2',
    threadId: null,
  },
]

/* Cases with a memory picture (memory nav "Cases" group). */
export interface MemoryCase {
  /** Case id (routes /app/memory/cases/:caseId, /app/cases/:caseId). */
  id: string
  personId: string
  navLabel: Bi
  navSub: Bi
  code: string
  opened: Bi
  owner: string
}

export const memoryCases: MemoryCase[] = [
  {
    id: 'case1',
    personId: 'e1',
    navLabel: bi('Jordan · Termination', 'Jordan · Licenciement'),
    navSub: bi('Awaiting counsel', 'En attente du conseiller juridique'),
    code: 'CASE-2026-0142',
    opened: bi('Jul 2, 2026', '2 juill. 2026'),
    owner: 'Riley Summers',
  },
  {
    id: 'case3',
    personId: 'e6',
    navLabel: bi('Amara · Accommodation', 'Amara · Accommodement'),
    navSub: bi('Review Jul 14', 'Révision le 14 juill.'),
    code: 'CASE-2026-0138',
    opened: bi('Apr 3, 2026', '3 avr. 2026'),
    owner: 'Riley Summers',
  },
]

/* Recall conversations (memory nav "Conversations" group). */
export interface MemoryThread {
  /** Chat id (routes /app/memory/conversations/:threadId). */
  id: string
  personId: string
  caseId: string
  navLabel: Bi
  /** ISO date the conversation was last resumed — nav subtitle is derived in the UI. */
  resumedAt: string
}

export const memoryThreads: MemoryThread[] = [
  {
    id: 'c1',
    personId: 'e1',
    caseId: 'case1',
    navLabel: bi('Jordan termination', 'Licenciement de Jordan'),
    resumedAt: demoTodayISO,
  },
]

/* ------------------------------------------------------------ seed facts
   The seed fact array + its `M()` helper live in `./memoryFacts.ts` to keep
   this file under the 800-line architecture budget. Re-exported here so the
   `@/data` barrel and existing imports are unchanged. */
export { seedMemoryFacts } from './memoryFacts'
import { seedMemoryFacts } from './memoryFacts'

function assertCanonicalDate(factId: string, field: string, value: string): void {
  if (!isCanonicalMemoryDate(value)) {
    throw new Error(
      `Memory fact ${factId}: ${field} must be a canonical YYYY-MM-DD date, not "${value}"`,
    )
  }
}

/** Seed threads must store resumedAt as a canonical YYYY-MM-DD date. */
export function assertSeedMemoryThreadSemantics(threads: readonly MemoryThread[]): void {
  for (const thread of threads) {
    if (!isCanonicalMemoryDate(thread.resumedAt)) {
      throw new Error(
        `Memory thread ${thread.id}: resumedAt must be a canonical YYYY-MM-DD date, not "${thread.resumedAt}"`,
      )
    }
  }
}

/** Seed facts must not pair confirmed confidence with an inference-only source. */
export function assertSeedMemoryFactSemantics(facts: readonly MemoryFact[]): void {
  for (const fact of facts) {
    if (fact.confidence === 'confirmed' && fact.source.type === 'inference') {
      throw new Error(
        `Memory fact ${fact.id}: confirmed facts cannot be sourced from inference alone`,
      )
    }
    if (fact.confidence === 'inferred' && fact.confirmation !== null) {
      throw new Error(`Memory fact ${fact.id}: inferred facts must not carry confirmation`)
    }
    if (fact.confidence === 'confirmed' && fact.confirmation === null) {
      throw new Error(
        `Memory fact ${fact.id}: confirmed facts must include confirmation provenance`,
      )
    }
    // Compile-time typing excludes inference; cast guards malformed runtime/external rows.
    if (
      fact.confirmation !== null &&
      (fact.confirmation.source.type as MemorySourceType) === 'inference'
    ) {
      throw new Error(`Memory fact ${fact.id}: confirmation cannot be sourced from inference alone`)
    }

    assertCanonicalDate(fact.id, 'learnedAt', fact.learnedAt)
    if (fact.effectiveAt != null) {
      assertCanonicalDate(fact.id, 'effectiveAt', fact.effectiveAt)
    }
    if (fact.confirmation !== null) {
      assertCanonicalDate(fact.id, 'confirmation.at', fact.confirmation.at)
      if (fact.confirmation.at < fact.learnedAt) {
        throw new Error(
          `Memory fact ${fact.id}: confirmation cannot precede when the fact was learned`,
        )
      }
    }
    if (fact.reviewDate != null) {
      assertCanonicalDate(fact.id, 'reviewDate', fact.reviewDate)
    }
    if (fact.expiryDate != null) {
      assertCanonicalDate(fact.id, 'expiryDate', fact.expiryDate)
    }
    if (fact.lastVerifiedAt != null) {
      assertCanonicalDate(fact.id, 'lastVerifiedAt', fact.lastVerifiedAt)
    }
  }
}

assertSeedMemoryFactSemantics(seedMemoryFacts)
assertSeedMemoryThreadSemantics(memoryThreads)

/* ------------------------------------------------------ governance config */

/**
 * Retention schedule — category-aware, not a blanket seven-year rule. Each
 * rule distinguishes its basis (statutory minimum, organization policy,
 * Dutiva default, case-specific, legal hold). No statutory figures are
 * encoded in UI strings; durations are descriptive, not legal advice.
 *
 * Frontend default fixture — the production backend does not yet persist a
 * retention schedule (TODO). Organizations configure this per workspace.
 */
export interface MemoryRetentionRule {
  category: MemoryRetentionCategory
  /** Descriptive duration/rule (never a statutory figure). */
  rule: Bi
  /** What starts the retention clock. */
  trigger: Bi
  /** Jurisdiction or applicability label. */
  applicability: Bi
  /** Source/basis for the rule. */
  basis: Bi
  /** Whether the category requires periodic review. */
  reviewRequired: boolean
  enabled: boolean
}

export const memoryRetentionSchedule: MemoryRetentionRule[] = [
  {
    category: 'advisor_conversation',
    rule: bi('24 months from the conversation', '24 mois à partir de la conversation'),
    trigger: bi('Last conversation turn', 'Dernier échange de la conversation'),
    applicability: bi('All workspaces (Dutiva default)', 'Tous les espaces (valeur par défaut Dutiva)'),
    basis: bi('Dutiva default', 'Valeur par défaut Dutiva'),
    reviewRequired: true,
    enabled: true,
  },
  {
    category: 'employee_preference',
    rule: bi('While employed, then removed on request', 'Pendant l’emploi, puis retiré sur demande'),
    trigger: bi('Preference recorded', 'Préférence enregistrée'),
    applicability: bi('All workspaces (Dutiva default)', 'Tous les espaces (valeur par défaut Dutiva)'),
    basis: bi('Dutiva default', 'Valeur par défaut Dutiva'),
    reviewRequired: false,
    enabled: true,
  },
  {
    category: 'employment_record',
    rule: bi('Per your organization’s record-retention policy', 'Selon la politique de conservation de votre organisation'),
    trigger: bi('Employment ends', 'Fin d’emploi'),
    applicability: bi('Configured per organization', 'Configuré par organisation'),
    basis: bi('Organization policy', 'Politique de l’organisation'),
    reviewRequired: true,
    enabled: true,
  },
  {
    category: 'payroll_tax',
    rule: bi('Per applicable tax/payroll retention requirements', 'Selon les exigences de conservation fiscale et de paie applicables'),
    trigger: bi('Tax year end', 'Fin de l’année fiscale'),
    applicability: bi('Configured per jurisdiction', 'Configuré par juridiction'),
    basis: bi('Statutory minimum', 'Minimum statutaire'),
    reviewRequired: false,
    enabled: true,
  },
  {
    category: 'investigation',
    rule: bi('While the case is open, then per organization policy', 'Pendant que le dossier est ouvert, puis selon la politique de l’organisation'),
    trigger: bi('Case opened', 'Ouverture du dossier'),
    applicability: bi('Configured per organization', 'Configuré par organisation'),
    basis: bi('Case-specific + organization policy', 'Spécifique au dossier + politique de l’organisation'),
    reviewRequired: true,
    enabled: true,
  },
  {
    category: 'wellbeing_personal',
    rule: bi('12 months, then reviewed', '12 mois, puis révisé'),
    trigger: bi('Recorded', 'Enregistrement'),
    applicability: bi('All workspaces (Dutiva default)', 'Tous les espaces (valeur par défaut Dutiva)'),
    basis: bi('Dutiva default', 'Valeur par défaut Dutiva'),
    reviewRequired: true,
    enabled: true,
  },
  {
    category: 'custom',
    rule: bi('Defined by your organization', 'Défini par votre organisation'),
    trigger: bi('As configured', 'Tel que configuré'),
    applicability: bi('Configured per organization', 'Configuré par organisation'),
    basis: bi('Organization policy', 'Politique de l’organisation'),
    reviewRequired: true,
    enabled: false,
  },
]

/**
 * Privacy, purpose & consent configuration — jurisdiction-aware, not a claim
 * that every workspace is governed by both PIPEDA and Québec Law 25. The
 * product serves federally regulated, Ontario and Québec contexts.
 *
 * Frontend default fixture — production persistence is a TODO.
 */
export interface MemoryPrivacyConfig {
  /** Jurisdictions the workspace has identified as applicable. */
  jurisdictions: string[]
  /** Whether automatic Advisor memory proposals are enabled. */
  autoProposalsEnabled: boolean
  /** Whether restricted memories are excluded from Advisor retrieval by default. */
  restrictAdvisorRetrieval: boolean
  /** Whether access/correction/retention/deletion requests are subject to legal exceptions. */
  requestsSubjectToExceptions: boolean
}

export const memoryPrivacyConfig: MemoryPrivacyConfig = {
  jurisdictions: ['ON'],
  autoProposalsEnabled: true,
  restrictAdvisorRetrieval: true,
  requestsSubjectToExceptions: true,
}
