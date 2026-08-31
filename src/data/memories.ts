import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { demoTodayISO } from './calendar'
import { isCanonicalMemoryDate } from './memoryDates'
import type {
  MemoryCategory,
  MemoryConfirmation,
  MemoryFact,
  MemoryScope,
  MemorySourceType,
  MemoryVisibility,
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

/* ------------------------------------------------------------ seed facts */

interface MemoryFactInputBase {
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
}

/** Confirmed facts must not be seeded from Advisor inference alone. */
type MemoryFactInput =
  | (MemoryFactInputBase & {
      confidence: 'confirmed'
      source: { type: Exclude<MemorySourceType, 'inference'>; detail: Bi }
      confirmation: MemoryConfirmation
    })
  | (MemoryFactInputBase & {
      confidence: 'inferred'
      confirmation: null
    })

const M = (input: MemoryFactInput): MemoryFact => ({
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
})

const peopleRecord = bi('People record', 'Dossier du personnel')
const caseNoteRiley = bi('Case note · Riley Summers', 'Note de dossier · Riley Summers')
const complianceReviewJul11 = bi('Compliance review · Jul 11', 'Revue conformité · 11 juill.')

/** ISO dates for deterministic demo memory (scenario date: Jul 11, 2026). */
const MAR2018 = '2018-03-01'
const AUG2022 = '2022-08-01'
const APR2026 = '2026-04-01'
const JUN22 = '2026-06-22'
const JUL2 = '2026-07-02'
const JUL5 = '2026-07-05'
const JUL11 = memoryScenarioTodayISO

export const seedMemoryFacts: MemoryFact[] = [
  /* Jordan — person */
  M({
    id: 'p1',
    scope: 'person',
    entityId: 'e1',
    category: 'employment',
    statement: bi(
      'Senior Operations Manager on the Operations team',
      'Gestionnaire principal des opérations, équipe Opérations',
    ),
    confidence: 'confirmed',
    source: { type: 'hris', detail: peopleRecord },
    effectiveAt: MAR2018,
    learnedAt: JUL2,
    confirmation: { at: JUL2, source: { type: 'hris', detail: peopleRecord } },
    visibility: 'hr',
  }),
  M({
    id: 'p2',
    scope: 'person',
    entityId: 'e1',
    category: 'employment',
    statement: bi(
      '8 years’ continuous service — started March 2018',
      '8 ans de service continu — entrée en mars 2018',
    ),
    confidence: 'confirmed',
    source: { type: 'hris', detail: peopleRecord },
    effectiveAt: MAR2018,
    learnedAt: JUL2,
    confirmation: { at: JUL2, source: { type: 'hris', detail: peopleRecord } },
    visibility: 'hr',
  }),
  M({
    id: 'p3',
    scope: 'person',
    entityId: 'e1',
    category: 'employment',
    statement: bi(
      'Employed in Ontario — provincially regulated (ESA, 2000)',
      'Employé en Ontario — réglementation provinciale (LNE, 2000)',
    ),
    confidence: 'confirmed',
    source: {
      type: 'chat',
      detail: bi('Confirmed in chat · Jul 2', 'Confirmé en clavardage · 2 juill.'),
    },
    learnedAt: JUL2,
    confirmation: {
      at: JUL2,
      source: {
        type: 'chat',
        detail: bi('Confirmed in chat · Jul 2', 'Confirmé en clavardage · 2 juill.'),
      },
    },
    visibility: 'hr',
  }),
  M({
    id: 'p4',
    scope: 'person',
    entityId: 'e1',
    category: 'employment',
    statement: bi(
      'Employment agreement contains no termination clause',
      'Le contrat de travail ne comporte aucune clause de licenciement',
    ),
    confidence: 'confirmed',
    source: {
      type: 'document',
      detail: bi('Employment Agreement.pdf', 'Employment Agreement.pdf'),
    },
    learnedAt: JUL2,
    confirmation: {
      at: JUL2,
      source: {
        type: 'document',
        detail: bi('Employment Agreement.pdf', 'Employment Agreement.pdf'),
      },
    },
    visibility: 'case',
    sensitive: true,
  }),
  M({
    id: 'p5',
    scope: 'person',
    entityId: 'e1',
    category: 'compensation',
    statement: bi(
      'Base salary $95,000 + variable commission',
      'Salaire de base de 95 000 $ + commission variable',
    ),
    confidence: 'confirmed',
    source: { type: 'hris', detail: peopleRecord },
    learnedAt: JUL11,
    confirmation: { at: JUL11, source: { type: 'hris', detail: peopleRecord } },
    visibility: 'restricted',
    sensitive: true,
  }),
  M({
    id: 'p6',
    scope: 'person',
    entityId: 'e1',
    category: 'record',
    statement: bi(
      'No prior formal discipline on file',
      'Aucune mesure disciplinaire formelle au dossier',
    ),
    confidence: 'confirmed',
    source: { type: 'hris', detail: peopleRecord },
    learnedAt: JUL2,
    confirmation: { at: JUL2, source: { type: 'hris', detail: peopleRecord } },
    visibility: 'hr',
    sensitive: true,
  }),
  M({
    id: 'p8',
    scope: 'person',
    entityId: 'e1',
    category: 'record',
    statement: bi('Reports to Morgan Chen', 'Relève de Morgan Chen'),
    confidence: 'confirmed',
    source: { type: 'hris', detail: peopleRecord },
    effectiveAt: MAR2018,
    learnedAt: JUL2,
    confirmation: { at: JUL2, source: { type: 'hris', detail: peopleRecord } },
    visibility: 'hr',
  }),
  M({
    id: 'p7',
    scope: 'person',
    entityId: 'e1',
    category: 'matter',
    statement: bi(
      'Preliminary common-law reasonable-notice estimate: 9–12 months; subject to additional employee and labour-market factors and counsel review',
      'Estimation préliminaire du préavis raisonnable en common law : 9 à 12 mois; sous réserve de facteurs additionnels liés à l’employé et au marché du travail ainsi que d’une révision juridique',
    ),
    confidence: 'inferred',
    source: {
      type: 'inference',
      detail: bi('Advisor analysis · Jul 5', 'Analyse du Conseiller · 5 juill.'),
    },
    learnedAt: JUL5,
    confirmation: null,
    visibility: 'case',
    sensitive: true,
  }),
  M({
    id: 'p9',
    scope: 'person',
    entityId: 'e1',
    category: 'note',
    statement: bi('Booked vacation Jul 14–18', 'Vacances réservées du 14 au 18 juill.'),
    confidence: 'inferred',
    source: {
      type: 'chat',
      detail: bi('Mentioned in chat · Jul 5', 'Mentionné en clavardage · 5 juill.'),
    },
    learnedAt: JUL5,
    confirmation: null,
    visibility: 'hr',
    sensitive: true,
  }),
  /* Jordan — case (termination) */
  M({
    id: 'c1',
    scope: 'case',
    entityId: 'case1',
    category: 'case',
    statement: bi(
      'Terminating without cause — no offer issued',
      'Licenciement sans motif — aucune offre émise',
    ),
    confidence: 'confirmed',
    source: { type: 'manual', detail: caseNoteRiley },
    learnedAt: JUL2,
    confirmation: { at: JUL2, source: { type: 'manual', detail: caseNoteRiley } },
    visibility: 'case',
    sensitive: true,
  }),
  M({
    id: 'c2',
    scope: 'case',
    entityId: 'case1',
    category: 'case',
    statement: bi('Counsel review requested Jul 5', 'Révision juridique demandée le 5 juill.'),
    confidence: 'confirmed',
    source: {
      type: 'chat',
      detail: bi('Advisor · Jul 5', 'Conseiller · 5 juill.'),
    },
    learnedAt: JUL5,
    confirmation: {
      at: JUL5,
      source: {
        type: 'chat',
        detail: bi('Advisor · Jul 5', 'Conseiller · 5 juill.'),
      },
    },
    visibility: 'case',
    sensitive: true,
  }),
  M({
    id: 'c3',
    scope: 'case',
    entityId: 'case1',
    category: 'case',
    statement: bi(
      'Termination letter drafted Jul 5 — held, not sent',
      'Lettre de licenciement rédigée le 5 juill. — retenue, non envoyée',
    ),
    confidence: 'confirmed',
    source: {
      type: 'document',
      detail: bi('Termination Letter (draft)', 'Lettre de licenciement (ébauche)'),
    },
    learnedAt: JUL5,
    confirmation: {
      at: JUL5,
      source: {
        type: 'document',
        detail: bi('Termination Letter (draft)', 'Lettre de licenciement (ébauche)'),
      },
    },
    visibility: 'case',
    sensitive: true,
  }),
  M({
    id: 'c4',
    scope: 'case',
    entityId: 'case1',
    category: 'case',
    statement: bi(
      'ESA minimum: 8 weeks’ termination notice/pay; statutory severance may also apply if eligibility requirements are met',
      'Minimum LNE : 8 semaines de préavis ou d’indemnité de licenciement; une indemnité de cessation d’emploi peut aussi s’appliquer si les conditions d’admissibilité sont remplies',
    ),
    confidence: 'inferred',
    source: {
      type: 'inference',
      detail: bi('Advisor analysis · Jul 2', 'Analyse du Conseiller · 2 juill.'),
    },
    learnedAt: JUL2,
    confirmation: null,
    visibility: 'case',
    sensitive: true,
  }),
  /* Jordan — thread */
  M({
    id: 't1',
    scope: 'thread',
    entityId: 'c1',
    category: 'conversation',
    statement: bi(
      'This conversation is about Jordan Mensah’s termination',
      'Cette conversation porte sur le licenciement de Jordan Mensah',
    ),
    confidence: 'confirmed',
    source: {
      type: 'chat',
      detail: bi('Conversation · opened Jul 2', 'Conversation · ouverte le 2 juill.'),
    },
    learnedAt: JUL2,
    confirmation: {
      at: JUL2,
      source: {
        type: 'chat',
        detail: bi('Conversation · opened Jul 2', 'Conversation · ouverte le 2 juill.'),
      },
    },
    visibility: 'case',
  }),
  M({
    id: 't2',
    scope: 'thread',
    entityId: 'c1',
    category: 'conversation',
    statement: bi(
      'You want notice exposure and next steps before contacting Jordan',
      'Vous voulez l’exposition au préavis et les prochaines étapes avant de contacter Jordan',
    ),
    confidence: 'inferred',
    source: {
      type: 'inference',
      detail: bi('Conversation summary', 'Résumé de la conversation'),
    },
    learnedAt: JUL5,
    confirmation: null,
    visibility: 'case',
    sensitive: true,
  }),
  /* Amara / Devon */
  M({
    id: 'a1',
    scope: 'person',
    entityId: 'e6',
    category: 'employment',
    statement: bi(
      'Operations Analyst, 3 years’ service — British Columbia',
      'Analyste des opérations, 3 ans de service — Colombie-Britannique',
    ),
    confidence: 'confirmed',
    source: { type: 'hris', detail: peopleRecord },
    effectiveAt: AUG2022,
    learnedAt: APR2026,
    confirmation: { at: APR2026, source: { type: 'hris', detail: peopleRecord } },
    visibility: 'hr',
  }),
  M({
    id: 'a2',
    scope: 'person',
    entityId: 'e6',
    category: 'matter',
    statement: bi(
      'Modified-duties accommodation active; 90-day review due Jul 14',
      'Accommodement en tâches modifiées actif; révision de 90 jours le 14 juill.',
    ),
    confidence: 'confirmed',
    source: { type: 'case', detail: complianceReviewJul11 },
    effectiveAt: APR2026,
    learnedAt: JUL11,
    confirmation: { at: JUL11, source: { type: 'case', detail: complianceReviewJul11 } },
    visibility: 'case',
    sensitive: true,
  }),
  M({
    id: 'd1',
    scope: 'person',
    entityId: 'e5',
    category: 'matter',
    statement: bi(
      'On a performance improvement plan; 30-day check-in Jul 22',
      'Sous plan d’amélioration du rendement; suivi de 30 jours le 22 juill.',
    ),
    confidence: 'confirmed',
    source: { type: 'case', detail: bi('Case note', 'Note de dossier') },
    effectiveAt: JUN22,
    learnedAt: JUN22,
    confirmation: {
      at: JUN22,
      source: { type: 'case', detail: bi('Case note', 'Note de dossier') },
    },
    visibility: 'hr',
    sensitive: true,
  }),
]

function assertCanonicalDate(factId: string, field: string, value: string): void {
  if (!isCanonicalMemoryDate(value)) {
    throw new Error(`Memory fact ${factId}: ${field} must be a canonical ISO date, not "${value}"`)
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

    assertCanonicalDate(fact.id, 'learnedAt', fact.learnedAt)
    if (fact.effectiveAt != null) {
      assertCanonicalDate(fact.id, 'effectiveAt', fact.effectiveAt)
    }
    if (fact.confirmation !== null) {
      assertCanonicalDate(fact.id, 'confirmation.at', fact.confirmation.at)
      if (fact.confirmation.at < fact.learnedAt.slice(0, 10)) {
        throw new Error(
          `Memory fact ${fact.id}: confirmation cannot precede when the fact was learned`,
        )
      }
    }
  }
}

assertSeedMemoryFactSemantics(seedMemoryFacts)
