/**
 * Jurisdiction-scoping questionnaire logic — pure functions, no I/O.
 *
 * Determines which Canadian employment standards jurisdiction likely applies
 * to a given employment relationship: Ontario (ESA), Quebec (LNT), or
 * Federal (Canada Labour Code Part III). The questionnaire asks about the
 * nature of the employer's undertaking and the employee's work location —
 * it does NOT ask about or output any statutory figures (notice periods,
 * thresholds, deadlines), per the editorial rule in `articleModel.ts`.
 *
 * The result names the statute and points the reader to the official text
 * and to a professional. It is compliance-oriented guidance, not a legal
 * determination — the disclaimer makes this explicit on the page.
 */

import type { Bi, Lang } from '@/i18n/core'
import { bi, pick } from '@/i18n/core'

/** The three supported jurisdictions. */
export type Jurisdiction = 'ON' | 'QC' | 'FED'

/** Question identifiers — stable, used as keys in the message catalogue. */
export type QuestionId =
  | 'employerType' // Is the employer a federally regulated undertaking?
  | 'workProvince' // In which province does the employee primarily work?
  | 'qcLanguage' // Is French the predominant language of the workplace? (QC only)

/** A single answer option. */
export interface QuestionOption {
  id: string
  label: Bi
}

/** A question in the questionnaire. */
export interface Question {
  id: QuestionId
  /** The question prompt. */
  prompt: Bi
  /** Answer options. */
  options: QuestionOption[]
  /** Whether this question is conditional on a previous answer. */
  conditionalOn?: {
    questionId: QuestionId
    answerId: string
  }
}

/** The result of the questionnaire — which jurisdiction applies and why. */
export interface JurisdictionResult {
  jurisdiction: Jurisdiction
  /** The statute name, bilingual. */
  statute: Bi
  /** A plain-language explanation of why this jurisdiction applies. */
  explanation: Bi
  /** A link to the official text of the statute. */
  officialSource: { url: string; label: Bi }
}

/** The answers map: question id → selected option id. */
export type Answers = Partial<Record<QuestionId, string>>

/* ------------------------------------------------------------------ */
/* Question definitions                                                */
/* ------------------------------------------------------------------ */

export const QUESTIONS: readonly Question[] = [
  {
    id: 'employerType',
    prompt: bi(
      'Is the employer a federally regulated undertaking — such as a bank, airline, railway, telecom, interprovincial or international trucking company, radio/TV broadcaster, or Crown corporation?',
      'L’employeur est-il une entreprise sous réglementation fédérale — par exemple une banque, une compagnie aérienne, une entreprise ferroviaire, une entreprise de télécommunications, une entreprise de camionnage interprovincial ou international, un radiodiffuseur ou une société d’État?',
    ),
    options: [
      { id: 'federal', label: bi('Yes, federally regulated', 'Oui, réglementation fédérale') },
      { id: 'provincial', label: bi('No, or not sure', 'Non, ou pas certain') },
    ],
  },
  {
    id: 'workProvince',
    prompt: bi(
      'In which province does the employee primarily work?',
      'Dans quelle province l’employé travaille-t-il principalement?',
    ),
    options: [
      { id: 'ON', label: bi('Ontario', 'Ontario') },
      { id: 'QC', label: bi('Quebec', 'Québec') },
      {
        id: 'other',
        label: bi('Another province or territory', 'Une autre province ou un territoire'),
      },
    ],
  },
  {
    id: 'qcLanguage',
    prompt: bi(
      'Is French the predominant language of the workplace?',
      'Le français est-il la langue prédominante du milieu de travail?',
    ),
    options: [
      { id: 'yes', label: bi('Yes', 'Oui') },
      { id: 'no', label: bi('No', 'Non') },
    ],
    conditionalOn: { questionId: 'workProvince', answerId: 'QC' },
  },
] as const

/* ------------------------------------------------------------------ */
/* Results                                                             */
/* ------------------------------------------------------------------ */

const RESULTS: Record<Jurisdiction, JurisdictionResult> = {
  FED: {
    jurisdiction: 'FED',
    statute: bi(
      'Canada Labour Code, Part III (Standard Hours, Wages, Vacations and Holidays)',
      'Code canadien du travail, partie III (heures normales de travail, salaires, congés et jours fériés)',
    ),
    explanation: bi(
      'Federally regulated undertakings are governed by the Canada Labour Code, not by provincial employment standards. The federal jurisdiction applies regardless of the province where the employee works.',
      'Les entreprises sous réglementation fédérale sont régies par le Code canadien du travail, et non par les normes d’emploi provinciales. La juridiction fédérale s’applique quelle que soit la province où l’employé travaille.',
    ),
    officialSource: {
      url: 'https://laws-lois.justice.gc.ca/eng/acts/L-2/index.html',
      label: bi(
        'Canada Labour Code (Part III) — Justice Canada',
        'Code canadien du travail (partie III) — Justice Canada',
      ),
    },
  },
  ON: {
    jurisdiction: 'ON',
    statute: bi(
      'Employment Standards Act, 2000 (Ontario)',
      'Loi de 2000 sur les normes d’emploi (Ontario)',
    ),
    explanation: bi(
      'Employers that are not federally regulated are governed by the employment standards of the province where the employee primarily works. For Ontario, that is the ESA.',
      'Les employeurs qui ne sont pas sous réglementation fédérale sont régis par les normes d’emploi de la province où l’employé travaille principalement. Pour l’Ontario, il s’agit de la Loi de 2000 sur les normes d’emploi.',
    ),
    officialSource: {
      url: 'https://www.ontario.ca/laws/statute/00e14',
      label: bi(
        'Employment Standards Act, 2000 — Ontario.ca',
        'Loi de 2000 sur les normes d’emploi — Ontario.ca',
      ),
    },
  },
  QC: {
    jurisdiction: 'QC',
    statute: bi(
      'Act respecting labour standards (Quebec)',
      'Loi sur les normes du travail (Québec)',
    ),
    explanation: bi(
      'Employers that are not federally regulated are governed by the employment standards of the province where the employee primarily works. For Quebec, that is the Act respecting labour standards (LNT).',
      'Les employeurs qui ne sont pas sous réglementation fédérale sont régis par les normes d’emploi de la province où l’employé travaille principalement. Pour le Québec, il s’agit de la Loi sur les normes du travail (LNT).',
    ),
    officialSource: {
      url: 'https://www.legisquebec.gouv.qc.ca/en/document/cs/N-1.1',
      label: bi(
        'Act respecting labour standards — LégisQuébec',
        'Loi sur les normes du travail — LégisQuébec',
      ),
    },
  },
}

/* ------------------------------------------------------------------ */
/* Pure logic                                                          */
/* ------------------------------------------------------------------ */

/**
 * Determine which questions to show, given the answers so far. A question
 * is shown if it has no `conditionalOn` or if its condition is met.
 */
export function visibleQuestions(answers: Answers): readonly Question[] {
  return QUESTIONS.filter((q) => {
    if (!q.conditionalOn) return true
    const answered = answers[q.conditionalOn.questionId]
    return answered === q.conditionalOn.answerId
  })
}

/**
 * Whether all visible questions have been answered. A question that becomes
 * visible after a previous answer is required; a question that was visible
 * but is now hidden (because the condition changed) is not required.
 */
export function isComplete(answers: Answers): boolean {
  return visibleQuestions(answers).every((q) => answers[q.id] !== undefined)
}

/**
 * Determine the jurisdiction from the answers. Returns `null` if the
 * answers are incomplete or the combination is not one Dutiva supports
 * (e.g., an employee working in a province other than ON/QC).
 */
export function determineJurisdiction(answers: Answers): JurisdictionResult | null {
  if (answers.employerType === 'federal') return RESULTS.FED
  if (answers.workProvince === 'ON') return RESULTS.ON
  if (answers.workProvince === 'QC') return RESULTS.QC
  return null
}

/**
 * Whether the answers lead to a supported jurisdiction. Used to show a
 * "Dutiva supports ON, QC, and FED" message when the user selects another
 * province.
 */
export function isSupported(answers: Answers): boolean {
  return determineJurisdiction(answers) !== null
}

/** Get the result for a jurisdiction (used for display). */
export function getResult(jurisdiction: Jurisdiction): JurisdictionResult {
  return RESULTS[jurisdiction]
}

/** Get a question by id. */
export function getQuestion(id: QuestionId): Question {
  const q = QUESTIONS.find((q) => q.id === id)
  if (!q) throw new Error(`Unknown question id: ${id}`)
  return q
}

/** Get an option's label by question id and option id. */
export function getOptionLabel(questionId: QuestionId, optionId: string, lang: Lang): string {
  const q = getQuestion(questionId)
  const opt = q.options.find((o) => o.id === optionId)
  if (!opt) throw new Error(`Unknown option id: ${optionId} for question ${questionId}`)
  return pick(opt.label, lang)
}
