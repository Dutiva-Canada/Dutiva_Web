import { describe, expect, it } from 'vitest'
import {
  advance,
  back,
  currentStep,
  flowRecord,
  isComplete,
  longestPath,
  nextStepId,
  outgoing,
  progress,
  scoreRun,
  bandFor,
  startRun,
  stepById,
  unreachableSteps,
} from './flowEngine'
import { isResult, isScored, isTerminal } from './flowModel'
import type { Flow, FlowResultStep } from './flowModel'
import { flows } from './data'
import { bi } from '@/i18n/core'

/**
 * Two kinds of test here, deliberately separated.
 *
 * The engine tests run against a small fixture flow, so a change to shipped
 * content cannot make them fail for reasons that have nothing to do with the
 * engine. The graph tests run against every real flow and assert the
 * structural invariants that make a flow safe to publish — reachable steps,
 * no route that ends anywhere but an outcome, bilingual copy throughout.
 */

const fixture: Flow = {
  slug: 'fixture',
  ring: 2,
  jurisdictions: ['ON', 'QC', 'FED'],
  estMinutes: 1,
  title: bi('Fixture', 'Exemple'),
  summary: bi('A tiny flow.', 'Un petit parcours.'),
  start: 'ask',
  steps: [
    {
      id: 'ask',
      kind: 'choice',
      title: bi('Ask', 'Demander'),
      body: bi('Pick one.', 'Choisissez.'),
      options: [
        { id: 'left', label: bi('Left', 'Gauche'), to: 'doLeft' },
        { id: 'right', label: bi('Right', 'Droite'), to: 'endRight' },
      ],
    },
    {
      id: 'doLeft',
      kind: 'task',
      title: bi('Do', 'Faire'),
      body: bi('Do the thing.', 'Faites la chose.'),
      points: [bi('A point.', 'Un point.')],
      to: 'endLeft',
    },
    {
      id: 'endLeft',
      kind: 'outcome',
      tone: 'ok',
      title: bi('Left end', 'Fin gauche'),
      body: bi('Done.', 'Terminé.'),
    },
    {
      id: 'endRight',
      kind: 'outcome',
      tone: 'caution',
      title: bi('Right end', 'Fin droite'),
      body: bi('Also done.', 'Aussi terminé.'),
    },
  ],
}

describe('flow engine', () => {
  it('starts on the flow’s start step and is not complete', () => {
    const run = startRun(fixture)
    expect(currentStep(fixture, run).id).toBe('ask')
    expect(isComplete(fixture, run)).toBe(false)
  })

  it('advances along the option that was chosen', () => {
    const run = advance(fixture, startRun(fixture), 'right')
    expect(currentStep(fixture, run).id).toBe('endRight')
    expect(isComplete(fixture, run)).toBe(true)
  })

  it('advances an input step from a typed non-negative integer', () => {
    const withInput: Flow = {
      ...fixture,
      slug: 'fixture-input',
      start: 'months',
      steps: [
        {
          id: 'months',
          kind: 'input',
          title: bi('Months', 'Mois'),
          body: bi('Enter months.', 'Entrez les mois.'),
          label: bi('Completed months', 'Mois complétés'),
          unit: bi('months', 'mois'),
          destinations: ['endRight', 'endLeft'],
          resolve: (n) => (n < 12 ? 'endRight' : 'endLeft'),
        },
        ...fixture.steps.filter((s) => s.kind === 'outcome'),
      ],
    }
    const short = advance(withInput, startRun(withInput), '3')
    expect(currentStep(withInput, short).id).toBe('endRight')
    expect(flowRecord(withInput, short).entries[0]?.chosen?.label.en).toBe('3 months')

    const long = advance(withInput, startRun(withInput), '36')
    expect(currentStep(withInput, long).id).toBe('endLeft')

    const bad = advance(withInput, startRun(withInput), '-1')
    expect(currentStep(withInput, bad).id).toBe('months')
    expect(nextStepId(withInput.steps[0]!, '1.5')).toBeUndefined()
  })

  it('records the chosen option on the step it was chosen at', () => {
    const run = advance(fixture, startRun(fixture), 'left')
    expect(run.path[0]).toEqual({ step: 'ask', option: 'left' })
    expect(run.path[1]).toEqual({ step: 'doLeft' })
  })

  it('ignores an option that does not belong to the step', () => {
    const run = startRun(fixture)
    /* A stale option id — from a double click, or a re-render mid-answer —
       must not move the run somewhere arbitrary. */
    expect(advance(fixture, run, 'nonsense')).toEqual(run)
    expect(advance(fixture, run)).toEqual(run)
  })

  it('cannot advance past an outcome', () => {
    const done = advance(fixture, startRun(fixture), 'right')
    expect(advance(fixture, done, 'left')).toEqual(done)
  })

  it('steps back and forgets the answer that led forward', () => {
    const forward = advance(fixture, startRun(fixture), 'left')
    const backAgain = back(forward)
    expect(currentStep(fixture, backAgain).id).toBe('ask')
    /* The point of the test: re-answering must be a clean choice. A retained
       option would render the branch as already taken. */
    expect(backAgain.path).toEqual([{ step: 'ask' }])
  })

  it('stays put when stepping back from the first step', () => {
    const run = startRun(fixture)
    expect(back(run)).toEqual(run)
  })

  it('reports progress that reaches 1 only at an outcome', () => {
    const start = startRun(fixture)
    expect(progress(fixture, start)).toBeLessThan(1)
    expect(progress(fixture, advance(fixture, start, 'right'))).toBe(1)
    expect(progress(fixture, advance(fixture, start, 'left'))).toBeGreaterThan(0)
  })

  it('measures the longest route, so a short branch does not read as behind', () => {
    /* ask → doLeft → endLeft is the long one. */
    expect(longestPath(fixture)).toBe(3)
  })

  it('builds a record of the path with the labels chosen', () => {
    const run = advance(fixture, advance(fixture, startRun(fixture), 'left'))
    const record = flowRecord(fixture, run)
    expect(record.entries.map((e) => e.step.id)).toEqual(['ask', 'doLeft', 'endLeft'])
    expect(record.entries[0]?.chosen?.label.en).toBe('Left')
    expect(record.outcome?.id).toBe('endLeft')
  })

  it('reports no outcome while the run is unfinished', () => {
    expect(flowRecord(fixture, startRun(fixture)).outcome).toBeNull()
  })

  it('throws on a step id the flow does not define', () => {
    expect(() => stepById(fixture, 'ghost')).toThrow(/no step ghost/)
  })

  it('distinguishes "ends the run" from "no such option"', () => {
    const ask = stepById(fixture, 'ask')
    const end = stepById(fixture, 'endLeft')
    expect(nextStepId(ask, 'left')).toBe('doLeft')
    expect(nextStepId(ask, 'ghost')).toBeUndefined()
    expect(nextStepId(end)).toBeNull()
  })

  it('terminates on a flow that loops', () => {
    /* Real flows loop — "check funding, then re-test". longestPath walks with
       a visited set, so a cycle must not hang it. */
    const looping: Flow = {
      ...fixture,
      steps: [
        {
          id: 'ask',
          kind: 'choice',
          title: bi('Ask', 'Demander'),
          body: bi('Pick.', 'Choisissez.'),
          options: [
            { id: 'loop', label: bi('Loop', 'Boucle'), to: 'doLeft' },
            { id: 'out', label: bi('Out', 'Sortir'), to: 'endRight' },
          ],
        },
        {
          id: 'doLeft',
          kind: 'task',
          title: bi('Do', 'Faire'),
          body: bi('Back we go.', 'On y retourne.'),
          points: [bi('A point.', 'Un point.')],
          to: 'ask',
        },
        ...fixture.steps.filter((s) => s.id === 'endRight'),
      ],
    }
    expect(longestPath(looping)).toBeGreaterThan(0)
    expect(unreachableSteps(looping)).toEqual([])
  })
})

const scored: Flow = {
  ...fixture,
  slug: 'scored',
  start: 'q1',
  steps: [
    {
      id: 'q1',
      kind: 'choice',
      domain: bi('Alpha', 'Alpha'),
      title: bi('Q1', 'Q1'),
      body: bi('First question.', 'Première question.'),
      options: [
        { id: 'lo', label: bi('Low', 'Faible'), value: 0, to: 'q2' },
        { id: 'hi', label: bi('High', 'Élevé'), value: 4, to: 'q2' },
      ],
    },
    {
      id: 'q2',
      kind: 'choice',
      domain: bi('Alpha', 'Alpha'),
      title: bi('Q2', 'Q2'),
      body: bi('Same factor as Q1.', 'Même facteur que Q1.'),
      options: [
        { id: 'lo', label: bi('Low', 'Faible'), value: 0, to: 'q3' },
        { id: 'hi', label: bi('High', 'Élevé'), value: 4, to: 'q3' },
      ],
    },
    {
      id: 'q3',
      kind: 'choice',
      domain: bi('Beta', 'Bêta'),
      title: bi('Q3', 'Q3'),
      body: bi('A different factor.', 'Un autre facteur.'),
      options: [
        { id: 'lo', label: bi('Low', 'Faible'), value: 0, to: 'end' },
        { id: 'hi', label: bi('High', 'Élevé'), value: 2, to: 'end' },
      ],
    },
    {
      id: 'end',
      kind: 'result',
      title: bi('Result', 'Résultat'),
      body: bi('Where you landed.', 'Où vous en êtes.'),
      bands: [
        {
          id: 'low',
          minPercent: 0,
          tone: 'risk',
          title: bi('Low', 'Faible'),
          body: bi('Start here.', 'Commencez ici.'),
        },
        {
          id: 'mid',
          minPercent: 50,
          tone: 'caution',
          title: bi('Mid', 'Moyen'),
          body: bi('Partway.', 'À mi-chemin.'),
        },
        {
          id: 'high',
          minPercent: 80,
          tone: 'ok',
          title: bi('High', 'Élevé'),
          body: bi('Solid.', 'Solide.'),
        },
      ],
    },
  ],
}

const answerAll = (ids: string[]) =>
  ids.reduce((run, id) => advance(scored, run, id), startRun(scored))

describe('longestPath on parallel edges', () => {
  it('walks distinct targets, not every edge', () => {
    /* A rated question is four options that all lead to the same next step.
       Walking the raw edge list explores that subtree once per option — 4^13
       for a thirteen-question assessment, which does not return. This is the
       shape that caught it: without deduping, the assertion below hangs
       rather than fails. */
    const chain = (n: number): Flow => ({
      ...fixture,
      slug: 'chain',
      start: 's0',
      steps: [
        ...Array.from({ length: n }, (_, i) => ({
          id: `s${i}`,
          kind: 'choice' as const,
          title: bi(`S${i}`, `S${i}`),
          body: bi('A rated question.', 'Une question notée.'),
          options: [0, 1, 2, 3].map((v) => ({
            id: `o${v}`,
            label: bi(`O${v}`, `O${v}`),
            value: v,
            to: i + 1 < n ? `s${i + 1}` : 'end',
          })),
        })),
        {
          id: 'end',
          kind: 'outcome' as const,
          tone: 'ok' as const,
          title: bi('End', 'Fin'),
          body: bi('Done.', 'Terminé.'),
        },
      ],
    })

    expect(longestPath(chain(13))).toBe(14)
  })
})

describe('scoring', () => {
  it('sums the values chosen and the values available', () => {
    const run = answerAll(['hi', 'hi', 'hi'])
    const result = scoreRun(scored, run)
    expect(result.total).toBe(10)
    expect(result.max).toBe(10)
    expect(result.percent).toBe(100)
  })

  it('scores the bottom of the scale as zero, not as unanswered', () => {
    const result = scoreRun(scored, answerAll(['lo', 'lo', 'lo']))
    expect(result.total).toBe(0)
    expect(result.max).toBe(10)
    expect(result.percent).toBe(0)
  })

  it('measures against what the answered questions offered', () => {
    /* Not against every rated question in the flow: a run that branched past
       some of them would otherwise be scored out of points it could never
       have earned, which reads as a failing grade for taking another route. */
    const partial = advance(scored, startRun(scored), 'hi')
    expect(scoreRun(scored, partial)).toMatchObject({ total: 4, max: 4, percent: 100 })
  })

  it('aggregates questions that share a factor', () => {
    const result = scoreRun(scored, answerAll(['hi', 'lo', 'hi']))
    const alpha = result.byDomain.find((d) => d.domain.en === 'Alpha')
    const beta = result.byDomain.find((d) => d.domain.en === 'Beta')
    expect(alpha).toEqual({ domain: expect.anything(), total: 4, max: 8 })
    expect(beta).toEqual({ domain: expect.anything(), total: 2, max: 2 })
  })

  it('scores nothing on a flow with no rated questions', () => {
    expect(scoreRun(fixture, startRun(fixture))).toMatchObject({ total: 0, max: 0, percent: 0 })
  })

  it('picks the highest band the score reaches', () => {
    const step = stepById(scored, 'end') as FlowResultStep
    expect(bandFor(step, 100)?.id).toBe('high')
    expect(bandFor(step, 80)?.id).toBe('high')
    expect(bandFor(step, 79)?.id).toBe('mid')
    expect(bandFor(step, 50)?.id).toBe('mid')
    expect(bandFor(step, 49)?.id).toBe('low')
    expect(bandFor(step, 0)?.id).toBe('low')
  })

  it('treats a result step as an ending', () => {
    const run = answerAll(['hi', 'hi', 'hi'])
    expect(isComplete(scored, run)).toBe(true)
    expect(isResult(currentStep(scored, run))).toBe(true)
    /* And cannot be advanced past, the same as an outcome. */
    expect(advance(scored, run, 'hi')).toEqual(run)
  })

  it('lets an outcome opt out of a document, but not silently', () => {
    /* The per-flow suite below enforces this on shipped content. This asserts
       the rule itself is exclusive-or, because the failure mode of relaxing
       it is an author who omits the handoff and writes no reason — which,
       without this, would read as "correctly opted out". */
    const holds = (step: { documents?: string[]; noDocument?: unknown }) =>
      (step.documents?.length ?? 0) > 0 !== Boolean(step.noDocument)

    expect(holds({ documents: ['T21'] }), 'names a document').toBe(true)
    expect(holds({ noDocument: bi('None, and here is why', 'Aucun, et voici pourquoi') })).toBe(
      true,
    )
    expect(holds({}), 'names neither').toBe(false)
    expect(holds({ documents: [] }), 'an empty list is naming neither').toBe(false)
    expect(
      holds({ documents: ['T21'], noDocument: bi('None', 'Aucun') }),
      'names both, so the reader is told two different things',
    ).toBe(false)
  })

  it('recognises a rated question and rejects the two shapes that are not one', () => {
    expect(isScored(stepById(scored, 'q1'))).toBe(true)
    expect(isScored(stepById(fixture, 'ask'))).toBe(false)

    const base = stepById(scored, 'q1') as { options: { value?: number }[] }
    const half = {
      ...base,
      options: [
        { id: 'a', label: bi('A', 'A'), value: 1, to: 'q2' },
        { id: 'b', label: bi('B', 'B'), to: 'q2' },
      ],
    }
    expect(isScored(half as never), 'only some options valued').toBe(false)

    /* Scoring and branching at once: the values are all there, but two runs
       answering "the same" question would be measured on different ones. */
    const branching = {
      ...base,
      options: [
        { id: 'a', label: bi('A', 'A'), value: 1, to: 'q2' },
        { id: 'b', label: bi('B', 'B'), value: 2, to: 'q3' },
      ],
    }
    expect(isScored(branching as never), 'valued options that diverge').toBe(false)
  })
})

describe.each(flows.map((f) => [f.slug, f] as const))('flow: %s', (_slug, flow) => {
  it('has no unreachable steps', () => {
    /* Content nobody can reach reads as shipped and is not. */
    expect(unreachableSteps(flow)).toEqual([])
  })

  it('points every exit at a step that exists', () => {
    for (const step of flow.steps) {
      for (const next of outgoing(step)) {
        if (next === null) continue
        expect(() => stepById(flow, next), `${step.id} → ${next}`).not.toThrow()
      }
    }
  })

  it('ends every route at an outcome, never at nothing', () => {
    /* A `to: null` on a task or choice would end a run with no result and no
       document to hand off to — the user is left mid-process with a blank. */
    for (const step of flow.steps) {
      if (isTerminal(step)) continue
      for (const next of outgoing(step)) {
        expect(next, `${step.id} ends the run without an outcome`).not.toBeNull()
      }
    }
  })

  it('reaches at least one terminal step', () => {
    expect(flow.steps.some(isTerminal)).toBe(true)
  })

  it('has a start step that exists', () => {
    expect(() => stepById(flow, flow.start)).not.toThrow()
  })

  it('ships every string in both languages', () => {
    const strings: [string, { en: string; fr: string }][] = [
      ['title', flow.title],
      ['summary', flow.summary],
    ]
    for (const step of flow.steps) {
      strings.push([`${step.id}.title`, step.title], [`${step.id}.body`, step.body])
      if (step.caution) strings.push([`${step.id}.caution`, step.caution])
      if (step.kind === 'task') {
        step.points.forEach((p, i) => strings.push([`${step.id}.points[${i}]`, p]))
      }
      if (step.kind === 'input') {
        strings.push([`${step.id}.label`, step.label], [`${step.id}.unit`, step.unit])
      }
      if (step.kind === 'choice') {
        /* The factor heading is user-facing — it labels a row of the result
           breakdown — so it belongs in the same net as the rest. */
        if (step.domain) strings.push([`${step.id}.domain`, step.domain])
        for (const option of step.options) {
          strings.push([`${step.id}.${option.id}`, option.label])
          if (option.detail) strings.push([`${step.id}.${option.id}.detail`, option.detail])
        }
      }
      if (step.kind === 'outcome' && step.noDocument) {
        /* It renders where the handoff list would be, so it is as user-facing
           as the documents it stands in for. */
        strings.push([`${step.id}.noDocument`, step.noDocument])
      }
      if (isResult(step)) {
        /* A band is what a scored run actually reads at the end — the step's
           own body is the preamble. An untranslated band would ship English
           to the French reader at the one moment the flow says something. */
        for (const band of step.bands) {
          strings.push(
            [`${step.id}/${band.id}.title`, band.title],
            [`${step.id}/${band.id}.body`, band.body],
          )
        }
      }
    }
    for (const [path, value] of strings) {
      expect(value.en.trim(), path).not.toBe('')
      expect(value.fr.trim(), path).not.toBe('')
      if (value.en.split(/\s+/).length > 3) {
        expect(value.fr, `${path} is untranslated`).not.toBe(value.en)
      }
      /* Flow copy renders as text, not markdown — `**emphasis**` reaches the
         reader as asterisks. Same guard as `GuideView.test.tsx`. */
      expect(value.en, `${path} carries markdown that will render literally`).not.toMatch(/\*\*/)
      expect(value.fr, `${path} carries markdown that will render literally`).not.toMatch(/\*\*/)
    }
  })

  it('hands every ending off to a document, or says why there is none', () => {
    /* A flow that ends in advice leaves nothing on the file, and the file is
       what an employer is asked to produce. Bands count as endings: a scored
       run reaches one of them, not the step's own body.

       `noDocument` is the one way out, and it is not a way to skip the
       question: an outcome carrying both, or neither, fails here. It exists
       because an ending whose content is "record nothing about their health"
       cannot lead with a document prompt without asking for the record it
       just said not to create. */
    for (const step of flow.steps) {
      if (step.kind === 'outcome') {
        const named = (step.documents?.length ?? 0) > 0
        expect(
          named !== Boolean(step.noDocument),
          `${step.id} must name documents or say why it names none — never both, never neither`,
        ).toBe(true)
      }
      if (isResult(step)) {
        for (const band of step.bands) {
          expect(
            band.documents?.length ?? 0,
            `${step.id}/${band.id} names no document`,
          ).toBeGreaterThan(0)
        }
      }
    }
  })

  it('sends every option of a rated question to the same place', () => {
    /* A question that scores *and* branches makes two runs' percentages
       incomparable — they were measured on different questions. `isScored`
       returns false for it, which would quietly stop it scoring, so the
       authoring error is caught loudly here instead. */
    for (const step of flow.steps) {
      if (step.kind !== 'choice') continue
      if (!step.options.every((o) => o.value !== undefined)) continue
      const targets = new Set(step.options.map((o) => o.to))
      expect(targets.size, `${step.id} scores and branches at once`).toBe(1)
    }
  })

  it('scores a question wholly or not at all', () => {
    /* An option carrying a value beside one that does not is neither a rated
       question nor a clean branch — `isScored` rejects it, so it would score
       zero silently instead of being caught. */
    for (const step of flow.steps) {
      if (step.kind !== 'choice') continue
      const valued = step.options.filter((o) => o.value !== undefined).length
      expect([0, step.options.length], `${step.id} mixes rated and unrated options`).toContain(
        valued,
      )
    }
  })

  it('names the factor behind every rated question', () => {
    /* A score with no breakdown tells a reader how they did and nothing about
       what to change. */
    for (const step of flow.steps) {
      if (isScored(step)) expect(step.domain, `${step.id} is rated but has no domain`).toBeDefined()
    }
  })

  it('lands every possible score in a band', () => {
    /* Without a band at 0 a low scorer reaches the end and is shown nothing —
       the one reader who most needs the result. */
    for (const step of flow.steps) {
      if (!isResult(step)) continue
      expect(
        step.bands.some((b) => b.minPercent === 0),
        `${step.id} has no band covering the bottom`,
      ).toBe(true)
      for (const percent of [0, 1, 39, 40, 69, 70, 100]) {
        expect(bandFor(step, percent), `${step.id} at ${percent}%`).not.toBeNull()
      }
    }
  })

  it('keeps input resolve destinations honest', () => {
    /* `outgoing` trusts `destinations`; if `resolve` can land elsewhere the
       graph checks would lie about reachability. */
    for (const step of flow.steps) {
      if (step.kind !== 'input') continue
      for (let n = 0; n <= 200; n++) {
        const dest = step.resolve(n)
        expect(step.destinations, `${step.id} resolve(${n}) → ${dest}`).toContain(dest)
      }
    }
  })
})
