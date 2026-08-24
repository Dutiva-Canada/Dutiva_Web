import type { Bi } from '@/i18n/core'
import type { Flow, FlowBand, FlowResultStep, FlowStep, FlowStepId } from './flowModel'
import { isScored, isTerminal } from './flowModel'

/**
 * The flow engine: pure, so the graph can be reasoned about and tested
 * without rendering anything. The runner holds a `FlowRun` and calls
 * `advance` / `back`; nothing here mutates.
 *
 * The run keeps the whole path rather than just a cursor. That is what makes
 * "back" honest — stepping back off a branch has to forget the answers that
 * branch produced, and a cursor cannot tell you which those were.
 */

export interface FlowAnswer {
  step: FlowStepId
  /** The chosen option id — absent on a `task` step, which has one exit. */
  option?: string
}

export interface FlowRun {
  /** Every step entered, oldest first. The last entry is where the run is. */
  path: FlowAnswer[]
}

export const startRun = (flow: Flow): FlowRun => ({ path: [{ step: flow.start }] })

export function stepById(flow: Flow, id: FlowStepId): FlowStep {
  const step = flow.steps.find((s) => s.id === id)
  if (!step) throw new Error(`flow ${flow.slug}: no step ${id}`)
  return step
}

/** The step the run is currently on. */
export function currentStep(flow: Flow, run: FlowRun): FlowStep {
  const last = run.path.at(-1)
  if (!last) throw new Error(`flow ${flow.slug}: empty run`)
  return stepById(flow, last.step)
}

export const isComplete = (flow: Flow, run: FlowRun): boolean => isTerminal(currentStep(flow, run))

/**
 * Where a step leads. Returns null when the step ends the run, and undefined
 * when the option does not belong to the step — which is a caller bug, not a
 * flow one, so it is distinguishable from a legitimate ending.
 */
export function nextStepId(step: FlowStep, optionId?: string): FlowStepId | null | undefined {
  if (step.kind === 'task') return step.to
  if (step.kind === 'input') {
    if (optionId === undefined) return undefined
    const value = Number(optionId)
    if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) return undefined
    return step.resolve(value)
  }
  if (isTerminal(step)) return null
  const option = step.options.find((o) => o.id === optionId)
  return option ? option.to : undefined
}

/**
 * Move forward. Returns the run unchanged when the move is not available —
 * an unknown option, or a step that already ended the run — so a double
 * click or a stale option id cannot corrupt the path.
 */
export function advance(flow: Flow, run: FlowRun, optionId?: string): FlowRun {
  const step = currentStep(flow, run)
  if (isTerminal(step)) return run

  const next = nextStepId(step, optionId)
  if (next === undefined || next === null) return run

  const answered: FlowAnswer[] = [
    ...run.path.slice(0, -1),
    { step: step.id, ...(optionId !== undefined && { option: optionId }) },
  ]
  return { path: [...answered, { step: next }] }
}

/**
 * Step back one. A run on its first step stays there.
 *
 * Takes no `Flow`, unlike its neighbours: the path already names the step
 * being returned to, so there is nothing to look up.
 */
export function back(run: FlowRun): FlowRun {
  if (run.path.length <= 1) return run
  const path = run.path.slice(0, -1)
  const last = path.at(-1)
  /* Drop the answer that led here: the user is being asked it again, and
     leaving it set would make a re-answered branch look already-taken. */
  return { path: [...path.slice(0, -1), ...(last ? [{ step: last.step }] : [])] }
}

/** How far along the run is, as a fraction — for the progress bar. */
export function progress(flow: Flow, run: FlowRun): number {
  if (isComplete(flow, run)) return 1
  /* Against the longest route to an outcome, not the step count: a flow whose
     branches differ in length would otherwise jump backwards when the user
     picks the short one. */
  const longest = longestPath(flow)
  return longest <= 1 ? 1 : Math.min(1, (run.path.length - 1) / (longest - 1))
}

/**
 * Length of the longest *simple* route from the start, in steps.
 *
 * Flows legitimately loop — "check for funding, then re-test hardship" and
 * "go back and widen the options" are both real process steps, and removing
 * them to keep the graph a tree would make the flow describe a worse process
 * than the one it is modelling. So this walks with a visited set and measures
 * the longest path that does not repeat a step, which is finite regardless.
 *
 * A user who goes round a loop therefore runs past the denominator; `progress`
 * clamps rather than pretending the bar means something it cannot.
 */
export function longestPath(flow: Flow): number {
  const seen = new Set<FlowStepId>()
  const walk = (id: FlowStepId): number => {
    if (seen.has(id)) return 0
    seen.add(id)
    const step = stepById(flow, id)
    /* Deduped, and this is load-bearing rather than tidiness. A rated question
       is four options that all lead to the same next step, so walking the raw
       edge list explores that subtree four times over — 4^13 for a
       thirteen-question assessment, which does not return. Distinct targets
       are what a path branches on; parallel edges are one branch. */
    const nexts = new Set(outgoing(step))
    let deepest = 0
    for (const next of nexts) {
      if (next !== null) deepest = Math.max(deepest, walk(next))
    }
    seen.delete(id)
    return 1 + deepest
  }
  return walk(flow.start)
}

/** Every step this one can lead to. `null` means it ends the run. */
export function outgoing(step: FlowStep): (FlowStepId | null)[] {
  if (step.kind === 'choice') return step.options.map((o) => o.to)
  if (step.kind === 'task') return [step.to]
  if (step.kind === 'input') return [...step.destinations]
  return []
}

/** Steps unreachable from the start — dead content a reader can never hit. */
export function unreachableSteps(flow: Flow): FlowStepId[] {
  const reached = new Set<FlowStepId>()
  const queue: FlowStepId[] = [flow.start]
  while (queue.length > 0) {
    const id = queue.shift()
    if (id === undefined || reached.has(id)) continue
    reached.add(id)
    for (const next of outgoing(stepById(flow, id))) {
      if (next !== null) queue.push(next)
    }
  }
  return flow.steps.map((s) => s.id).filter((id) => !reached.has(id))
}

/**
 * The record a completed run produces: the questions asked, what was chosen,
 * and where it landed. This is what goes on the file — a flow decides, a
 * template documents.
 */
export interface FlowRecordEntry {
  step: FlowStep
  /** The option chosen at this step, when it was a choice. */
  chosen?: { id: string; label: Bi }
}

export interface FlowRecord {
  entries: FlowRecordEntry[]
  outcome: FlowStep | null
}

export function flowRecord(flow: Flow, run: FlowRun): FlowRecord {
  const entries: FlowRecordEntry[] = run.path.map((answer) => {
    const step = stepById(flow, answer.step)
    if (step.kind === 'input' && answer.option !== undefined) {
      return {
        step,
        chosen: {
          id: answer.option,
          label: {
            en: `${answer.option} ${step.unit.en}`,
            fr: `${answer.option} ${step.unit.fr}`,
          },
        },
      }
    }
    if (step.kind !== 'choice' || answer.option === undefined) return { step }
    const option = step.options.find((o) => o.id === answer.option)
    return option ? { step, chosen: { id: option.id, label: option.label } } : { step }
  })
  const last = entries.at(-1)?.step
  return { entries, outcome: last && isTerminal(last) ? last : null }
}

/* ── Scoring ─────────────────────────────────────────────────────────────── */

export interface FlowDomainScore {
  domain: Bi
  total: number
  max: number
}

export interface FlowScore {
  total: number
  /** The most that was available on the questions actually answered. */
  max: number
  /** `total / max` as a whole number, 0 when nothing scored was answered. */
  percent: number
  byDomain: FlowDomainScore[]
}

/**
 * Score a run over the rated questions it actually answered.
 *
 * Measured against what was available on the answered path rather than
 * against every rated question in the flow: a flow that branches past some of
 * them would otherwise report a percentage the reader could not have reached,
 * which reads as a failing grade for taking a different route.
 */
export function scoreRun(flow: Flow, run: FlowRun): FlowScore {
  let total = 0
  let max = 0
  const domains = new Map<string, FlowDomainScore>()

  for (const answer of run.path) {
    if (answer.option === undefined) continue
    const step = stepById(flow, answer.step)
    if (!isScored(step)) continue

    const chosen = step.options.find((o) => o.id === answer.option)
    if (!chosen) continue

    const scored = chosen.value ?? 0
    const available = Math.max(...step.options.map((o) => o.value ?? 0))
    total += scored
    max += available

    if (step.domain) {
      /* Keyed on the English label: two questions in the same domain must
         aggregate, and `Bi` objects are distinct references. */
      const key = step.domain.en
      const existing = domains.get(key)
      if (existing) {
        existing.total += scored
        existing.max += available
      } else {
        domains.set(key, { domain: step.domain, total: scored, max: available })
      }
    }
  }

  return {
    total,
    max,
    percent: max === 0 ? 0 : Math.round((total / max) * 100),
    byDomain: [...domains.values()],
  }
}

/**
 * The band a percentage lands in: the highest whose `minPercent` it reaches.
 *
 * Returns null only if the step has no band at 0 — an authoring error the
 * flow tests catch, not something a run can cause.
 */
export function bandFor(step: FlowResultStep, percent: number): FlowBand | null {
  const eligible = step.bands
    .filter((band) => percent >= band.minPercent)
    .sort((a, b) => b.minPercent - a.minPercent)
  return eligible[0] ?? null
}
