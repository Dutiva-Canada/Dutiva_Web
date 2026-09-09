import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { demoTodayISO } from './calendar'
import type {
  MemoryCategory,
  MemoryClassification,
  MemoryConfirmation,
  MemoryFact,
  MemoryLegalHold,
  MemoryOrigin,
  MemoryRetentionCategory,
  MemoryScope,
  MemorySensitivity,
  MemorySourceType,
  MemoryStatus,
  MemoryVisibility,
} from './types'

/**
 * Advisor Memory seed facts — extracted from `memories.ts` to keep that file
 * under the 800-line architecture budget. Entity ids map onto the existing
 * app fixtures (Jordan Mensah `e1` / `case1` / chat `c1`, Amara Okafor `e6` /
 * `case3`, Devon Clarke `e5`) so memory surfaces link to real routes. EN
 * follows corrected demo facts; FR [self-authored].
 */

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
})

const peopleRecord = bi('People record', 'Dossier du personnel')
const caseNoteRiley = bi('Case note · Riley Summers', 'Note de dossier · Riley Summers')
const caseAmara = bi('CASE-2026-0138', 'CASE-2026-0138')

/** ISO dates for deterministic demo memory (scenario date: Jul 11, 2026). */
const APR2026 = '2026-04-03'
const JUN22 = '2026-06-22'
const JUL2 = '2026-07-02'
const JUL5 = '2026-07-05'
const JUL11 = demoTodayISO

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
    status: 'confirmed',
    classification: 'fact',
    origin: 'explicit',
    sensitivity: 'restricted',
    advisorUsable: false,
    retentionCategory: 'payroll_tax',
    lastVerifiedAt: JUL11,
    purpose: bi('Payroll administration', 'Administration de la paie'),
    jurisdiction: 'ON',
    creator: 'HRIS sync',
    confirmedBy: 'HRIS sync',
    tags: [bi('compensation', 'rémunération')],
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
    status: 'proposed',
    classification: 'opinion',
    origin: 'inferred',
    sensitivity: 'restricted',
    advisorUsable: false,
    retentionCategory: 'investigation',
    reviewDate: JUL11,
    purpose: bi('Termination notice exposure analysis', 'Analyse de l’exposition au préavis de licenciement'),
    jurisdiction: 'ON',
    proposedBy: 'Advisor',
    confidenceScore: 0.78,
    sourceExcerpt: bi(
      '“…based on 8 years’ service and a senior role, common-law notice typically falls in the 9–12 month range…”',
      '« …compte tenu de 8 ans de service et d’un poste de cadre, le préavis en common law se situe généralement entre 9 et 12 mois… »',
    ),
    creator: 'Advisor',
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
    status: 'proposed',
    classification: 'contextual',
    origin: 'inferred',
    proposedBy: 'Advisor',
    confidenceScore: 0.62,
    sourceExcerpt: bi(
      '“I’ll be off the week of July 14.”',
      '« Je serai en congé la semaine du 14 juillet. »',
    ),
    creator: 'Advisor',
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
      'Termination letter draft dated Jul 5',
      'Ébauche de lettre de licenciement datée du 5 juill.',
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
    status: 'proposed',
    classification: 'contextual',
    origin: 'inferred',
    sensitivity: 'restricted',
    advisorUsable: false,
    retentionCategory: 'investigation',
    jurisdiction: 'ON',
    proposedBy: 'Advisor',
    confidenceScore: 0.71,
    creator: 'Advisor',
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
    status: 'proposed',
    classification: 'contextual',
    origin: 'inferred',
    proposedBy: 'Advisor',
    confidenceScore: 0.55,
    creator: 'Advisor',
  }),
  /* Amara / Devon */
  M({
    id: 'a1',
    scope: 'person',
    entityId: 'e6',
    category: 'employment',
    statement: bi(
      'Software Engineer, 2.6 years’ service — Ontario',
      'Ingénieure logicielle, 2,6 ans de service — Ontario',
    ),
    confidence: 'confirmed',
    source: { type: 'hris', detail: peopleRecord },
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
      'Modified-duties accommodation established; 90-day review scheduled for Jul 14',
      'Accommodement en tâches modifiées établi; révision de 90 jours prévue le 14 juill.',
    ),
    confidence: 'confirmed',
    source: { type: 'case', detail: caseAmara },
    learnedAt: APR2026,
    confirmation: { at: APR2026, source: { type: 'case', detail: caseAmara } },
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
    learnedAt: JUN22,
    confirmation: {
      at: JUN22,
      source: { type: 'case', detail: bi('Case note', 'Note de dossier') },
    },
    visibility: 'hr',
    sensitive: true,
    status: 'confirmed',
    classification: 'decision',
    origin: 'manual',
    sensitivity: 'restricted',
    advisorUsable: true,
    retentionCategory: 'employment_record',
    reviewDate: '2026-07-22',
    purpose: bi('Performance management', 'Gestion du rendement'),
    jurisdiction: 'ON',
    creator: 'Riley Summers',
    confirmedBy: 'Riley Summers',
  }),
  /* Case allegation — preserved as an allegation, never promoted to a
     confirmed employee fact. Source + case relationship + evidentiary status
     are kept so an unresolved allegation does not feed Advisor as fact. */
  M({
    id: 'c5',
    scope: 'case',
    entityId: 'case1',
    category: 'case',
    statement: bi(
      'Manager alleged that Jordan falsified the August 3 timesheet',
      'Le gestionnaire a allégué que Jordan avait falsifié la feuille de temps du 3 août',
    ),
    confidence: 'confirmed',
    source: {
      type: 'manual',
      detail: bi('Case intake note · Morgan Chen', 'Note d’ouverture de dossier · Morgan Chen'),
    },
    learnedAt: JUL2,
    confirmation: { at: JUL2, source: { type: 'manual', detail: caseNoteRiley } },
    visibility: 'case',
    sensitive: true,
    status: 'confirmed',
    classification: 'allegation',
    origin: 'explicit',
    sensitivity: 'restricted',
    advisorUsable: false,
    retentionCategory: 'investigation',
    reviewDate: '2026-07-25',
    purpose: bi('Investigation record', 'Dossier d’enquête'),
    jurisdiction: 'ON',
    creator: 'Morgan Chen',
    confirmedBy: 'Riley Summers',
    sourceExcerpt: bi(
      '“Jordan submitted hours on Aug 3 that don’t match the dispatch log.”',
      '« Jordan a soumis des heures le 3 août qui ne correspondent pas au registre de dispatch. »',
    ),
    tags: [bi('allegation', 'allégation'), bi('timesheet', 'feuille de temps')],
  }),
  /* Expiring soon — conversation memory nearing its 24-month review window. */
  M({
    id: 't3',
    scope: 'thread',
    entityId: 'c1',
    category: 'conversation',
    statement: bi(
      'Jordan asked about severance vs. working notice in the Jul 2 chat',
      'Jordan a demandé l’indemnité de cessation par rapport au préavis de travail dans le clavardage du 2 juill.',
    ),
    confidence: 'confirmed',
    source: {
      type: 'chat',
      detail: bi('Conversation · Jul 2', 'Conversation · 2 juill.'),
    },
    learnedAt: JUL2,
    confirmation: {
      at: JUL2,
      source: { type: 'chat', detail: bi('Conversation · Jul 2', 'Conversation · 2 juill.') },
    },
    visibility: 'case',
    status: 'confirmed',
    classification: 'fact',
    origin: 'explicit',
    retentionCategory: 'advisor_conversation',
    reviewDate: '2026-07-14',
    expiryDate: '2026-07-14',
    lastVerifiedAt: JUL5,
    creator: 'Advisor',
    confirmedBy: 'Riley Summers',
  }),
  /* Legal hold — scheduled expiration/deletion paused. */
  M({
    id: 'p10',
    scope: 'person',
    entityId: 'e1',
    category: 'record',
    statement: bi(
      'Disciplinary warning issued Mar 2026 — held for active litigation',
      'Avertissement disciplinaire émis en mars 2026 — conservé pour litige actif',
    ),
    confidence: 'confirmed',
    source: {
      type: 'document',
      detail: bi('Disciplinary Warning.pdf', 'Avertissement disciplinaire.pdf'),
    },
    learnedAt: '2026-03-10',
    confirmation: {
      at: '2026-03-10',
      source: { type: 'document', detail: bi('Disciplinary Warning.pdf', 'Avertissement disciplinaire.pdf') },
    },
    visibility: 'restricted',
    sensitive: true,
    status: 'confirmed',
    classification: 'decision',
    origin: 'explicit',
    sensitivity: 'restricted',
    advisorUsable: false,
    retentionCategory: 'investigation',
    expiryDate: '2026-07-09',
    lastVerifiedAt: '2026-03-10',
    legalHold: {
      reason: bi('Litigation hold — Mensah v. Northgate', 'Conservation pour litige — Mensah c. Northgate'),
      placedAt: '2026-06-30',
      placedBy: 'Riley Summers',
    },
    purpose: bi('Litigation hold', 'Conservation pour litige'),
    jurisdiction: 'ON',
    creator: 'Riley Summers',
    confirmedBy: 'Riley Summers',
    tags: [bi('disciplinary', 'disciplinaire'), bi('legal hold', 'conservation pour litige')],
  }),
  /* Additional confirmed memories for layout density. */
  M({
    id: 'p11',
    scope: 'person',
    entityId: 'e1',
    category: 'employment',
    statement: bi(
      'Hybrid schedule — 3 days on-site, 2 remote',
      'Horaire hybride — 3 jours au bureau, 2 à distance',
    ),
    confidence: 'confirmed',
    source: { type: 'hris', detail: peopleRecord },
    learnedAt: JUL2,
    confirmation: { at: JUL2, source: { type: 'hris', detail: peopleRecord } },
    visibility: 'hr',
    status: 'confirmed',
    classification: 'fact',
    origin: 'explicit',
    retentionCategory: 'employment_record',
    lastVerifiedAt: JUL2,
    creator: 'HRIS sync',
    confirmedBy: 'HRIS sync',
  }),
  M({
    id: 'p12',
    scope: 'person',
    entityId: 'e1',
    category: 'note',
    statement: bi(
      'Prefers written follow-ups after 1:1s',
      'Préfère des suivis écrits après les rencontres individuelles',
    ),
    confidence: 'confirmed',
    source: {
      type: 'chat',
      detail: bi('Mentioned in chat · Jun 28', 'Mentionné en clavardage · 28 juin'),
    },
    learnedAt: '2026-06-28',
    confirmation: {
      at: '2026-06-28',
      source: { type: 'chat', detail: bi('Mentioned in chat · Jun 28', 'Mentionné en clavardage · 28 juin') },
    },
    visibility: 'hr',
    status: 'confirmed',
    classification: 'preference',
    origin: 'explicit',
    retentionCategory: 'employee_preference',
    lastVerifiedAt: '2026-06-28',
    creator: 'Riley Summers',
    confirmedBy: 'Riley Summers',
    tags: [bi('preference', 'préférence')],
  }),
  M({
    id: 'a3',
    scope: 'person',
    entityId: 'e6',
    category: 'note',
    statement: bi(
      'Requested quiet workspace as part of accommodation plan',
      'A demandé un espace de travail calme dans le cadre du plan d’accommodement',
    ),
    confidence: 'confirmed',
    source: { type: 'case', detail: caseAmara },
    learnedAt: APR2026,
    confirmation: { at: APR2026, source: { type: 'case', detail: caseAmara } },
    visibility: 'restricted',
    sensitive: true,
    status: 'confirmed',
    classification: 'contextual',
    origin: 'explicit',
    sensitivity: 'restricted',
    advisorUsable: false,
    retentionCategory: 'wellbeing_personal',
    reviewDate: '2026-07-14',
    purpose: bi('Accommodation', 'Accommodement'),
    jurisdiction: 'ON',
    creator: 'Riley Summers',
    confirmedBy: 'Riley Summers',
  }),
]
