import type { Bi } from '@/i18n/core'
import type { Jurisdiction } from '@/features/app/documents/data/types'

/**
 * Content model for guided flows — the surface Ring 2's interactive tools
 * needed and the product did not have (docs/FOUR_RING_FRAMEWORK.md).
 *
 * Document Studio renders a linear question set into merge-field blocks. That
 * covers a document you already know you are writing; it cannot express
 * "receive disclosure → assess → explore options → implement → document",
 * where what you are asked next depends on what you just said. `ClauseGate`
 * gates a block on jurisdiction, headcount and union — never on an answer —
 * so branching had nowhere to live.
 *
 * A flow is a graph of steps. Several shapes fall out of the same structure,
 * which is why this is one engine rather than several:
 *
 *   - a **checklist** is a chain of `task` steps with one exit each;
 *   - a **decision tree** is `choice` steps whose options name the next step;
 *   - a **numeric input** is an `input` step that routes from a typed integer
 *     (e.g. completed months of tenure) via `resolve`;
 *   - a **guided worksheet** mixes the above and ends at an `outcome`;
 *   - a **scored assessment** is `choice` steps whose options carry a `value`
 *     and share a destination, ending at a `result` that bands the total.
 *
 * Flows produce a record, not a document. A completed run summarises the path
 * taken and hands off to the Document Studio template that makes it official
 * (`outcome.documents`, or the band's on a scored run). Keeping the two
 * separate is deliberate: the flow is how you decide, the template is what
 * you send.
 */

export type FlowStepId = string

/** A step's outgoing edge. `to` is the id of the next step, or null to end. */
export interface FlowOption {
  id: string
  label: Bi
  /** Shown under the label when the choice needs a reason to pick it. */
  detail?: Bi
  to: FlowStepId | null
  /**
   * What picking this contributes to the run's score. Present on every option
   * of a rated question and on none of a branching one — a step with a mix is
   * neither, and `flowEngine.test.ts` fails it.
   */
  value?: number
}

interface FlowStepBase {
  id: FlowStepId
  title: Bi
  /** The step's explanation — what this stage is for, and what to watch. */
  body: Bi
  /**
   * A caution rendered with the step. Use for the thing that goes wrong here,
   * not for general encouragement.
   *
   * Every step shows in every jurisdiction. There is deliberately no
   * per-jurisdiction gate here: a run has no jurisdiction to gate on — the
   * runner never asks for one — so a gate would have silently no-opped and
   * shown Québec-specific content to an Ontario reader. Where the law differs,
   * say so in the copy and point at the Document Studio template, whose
   * `jurisdictionNotes` the reader can actually see resolved.
   */
  caution?: Bi
}

/**
 * A step that branches. The chosen option decides what comes next, which is
 * the whole reason this model exists.
 */
export interface FlowChoiceStep extends FlowStepBase {
  kind: 'choice'
  options: FlowOption[]
  /**
   * What this question measures, on a rated step. Two things depend on it: the
   * per-factor breakdown a result reports, and the fact that a score is only
   * worth showing if the reader can see which parts produced it.
   *
   * A rated question is just a choice whose options all carry a `value` and
   * lead to the same place — no separate step kind, because the only thing
   * that differs is what the answer is for.
   */
  domain?: Bi
}

/**
 * A step that instructs rather than asks. It has exactly one exit, and the
 * points are what the user is doing before they continue.
 */
export interface FlowTaskStep extends FlowStepBase {
  kind: 'task'
  points: Bi[]
  to: FlowStepId | null
}

/**
 * A step that collects a non-negative number (e.g. completed months, or
 * weekly wages) and routes to a destination via `resolve`. `destinations`
 * lists every id `resolve` may return so graph checks stay honest.
 */
export interface FlowInputStep extends FlowStepBase {
  kind: 'input'
  label: Bi
  /** Unit shown beside the field — "completed months", "CAD / week", etc. */
  unit: Bi
  /**
   * `integer` (default) rejects fractional values. `decimal` allows any
   * finite non-negative number — used for money inputs.
   */
  numberKind?: 'integer' | 'decimal'
  destinations: readonly FlowStepId[]
  resolve: (value: number) => FlowStepId
}

/** One labelled figure a formula ending shows (weeks, dollars, etc.). */
export interface FlowFormulaLine {
  label: Bi
  value: Bi
}

/**
 * A terminal step reached by feeding prior `input` answers into a formula.
 * Static `title` / `body` stay bilingual hedges; live figures come from
 * `evaluate` so copy cannot invent a statutory ladder in the step list.
 */
export interface FlowFormulaStep extends FlowStepBase {
  kind: 'formula'
  tone: 'ok' | 'caution'
  documents?: string[]
  noDocument?: Bi
  /** Prior `input` step ids this formula reads. */
  inputs: readonly FlowStepId[]
  evaluate: (getInput: (stepId: string) => number | undefined) => FlowFormulaLine[] | null
}

/** A terminal step reached by branching. Where the path led. */
export interface FlowOutcomeStep extends FlowStepBase {
  kind: 'outcome'
  /** How the outcome reads — a settled result, or a stop-and-get-help. */
  tone: 'ok' | 'caution'
  /** Document Studio tids this outcome hands off to, in the order to use them. */
  documents?: string[]
  /**
   * Why this ending deliberately produces no document, shown where the
   * handoff list would be. **Exactly one of this and `documents` is set**, and
   * `flowEngine.test.ts` fails an outcome carrying both or neither.
   *
   * The rule this relaxes is that a flow ending in advice leaves nothing on
   * the file. It still holds, with one exception found in review: an ending
   * whose whole content is "nothing changes, and record nothing about their
   * health" cannot lead with a document prompt without asking for exactly the
   * record it just said not to create. Naming a template there is worse than
   * naming none.
   *
   * So the pressure stays — an author cannot quietly omit the handoff, they
   * have to write down why there is none, and the reader sees it. Reach for
   * this only when producing a document would be the wrong instruction, never
   * when you have not worked out which one applies.
   */
  noDocument?: Bi
}

/** One reading of a score, selected by where the total lands. */
export interface FlowBand {
  id: string
  /**
   * Lower bound, inclusive, as a percentage of the score available on the
   * questions actually answered. A percentage rather than a raw total so a
   * band survives a question being added or reweighted.
   */
  minPercent: number
  tone: 'ok' | 'caution' | 'risk'
  title: Bi
  body: Bi
  documents?: string[]
}

/**
 * A terminal step reached by scoring. Where the answers added up to.
 *
 * Separate from `outcome` rather than an optional field on it: the two are
 * reached differently and read differently, and a single kind whose meaning
 * flips on whether `bands` is set is the shape that gets misused later.
 */
export interface FlowResultStep extends FlowStepBase {
  kind: 'result'
  /** Any order — the engine sorts. At least one must have `minPercent: 0`. */
  bands: FlowBand[]
}

export type FlowStep =
  | FlowChoiceStep
  | FlowTaskStep
  | FlowInputStep
  | FlowOutcomeStep
  | FlowFormulaStep
  | FlowResultStep

export interface Flow {
  /** Stable URL slug — `/app/workflows/<slug>`. */
  slug: string
  title: Bi
  summary: Bi
  /** Which ring and pillar this belongs to, for the framework doc's tables. */
  ring: 1 | 2 | 3 | 4
  jurisdictions: Jurisdiction[]
  /** Roughly how long a run takes, shown before starting. */
  estMinutes: number
  /** The step a run begins at. */
  start: FlowStepId
  steps: FlowStep[]
}

export const isOutcome = (step: FlowStep): step is FlowOutcomeStep => step.kind === 'outcome'

export const isFormula = (step: FlowStep): step is FlowFormulaStep => step.kind === 'formula'

export const isResult = (step: FlowStep): step is FlowResultStep => step.kind === 'result'

/** Reaching either kind ends the run. */
export const isTerminal = (
  step: FlowStep,
): step is FlowOutcomeStep | FlowFormulaStep | FlowResultStep =>
  isOutcome(step) || isFormula(step) || isResult(step)

/**
 * A rated question: every option carries a value **and** they all lead to the
 * same place. Both halves matter. A step where only some options are valued is
 * neither a rated question nor a clean branch; a step whose valued options
 * diverge is scoring and branching at once, which makes two runs' percentages
 * incomparable because they were measured on different questions.
 *
 * Either shape returns false here rather than being half-counted, and
 * `flowEngine.test.ts` rejects both outright so the authoring error surfaces
 * as a failure instead of as a question that quietly stops scoring.
 */
export const isScored = (step: FlowStep): step is FlowChoiceStep => {
  if (step.kind !== 'choice' || step.options.length === 0) return false
  if (!step.options.every((option) => option.value !== undefined)) return false
  const [first, ...rest] = step.options
  return rest.every((option) => option.to === first?.to)
}
