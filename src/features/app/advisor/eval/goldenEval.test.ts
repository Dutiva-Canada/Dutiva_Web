import { describe, expect, it } from 'vitest'
import { GOLDEN_CASES, GOLDEN_SET_VERSION } from './goldenCases'
import { STATUTE_REGISTRY } from './statuteRegistry'
import { runGoldenEval } from './goldenEval'

/**
 * The golden set gates on deterministic facts, not vibes: any case that
 * fails is a product defect (wrong jurisdiction read, closed gate that
 * should be open, a required proposition absent from the grounding chunk,
 * a corpus-cited section the chunk no longer names, a figure the schedule
 * contradicts) or a stale case — either way the build must not ship it.
 * Coverage *gaps* are reported in the run summary but never fail the suite.
 */
describe('advisor golden eval', () => {
  const result = runGoldenEval('2026-09-04T00:00:00.000Z')

  it('covers every corpus topic in at least one jurisdiction', () => {
    const topics = new Set(GOLDEN_CASES.map((c) => c.topic).filter(Boolean))
    expect(topics.size).toBeGreaterThanOrEqual(14)
  })

  it('spans all three jurisdictions', () => {
    for (const j of ['ON', 'QC', 'FED']) {
      expect(GOLDEN_CASES.some((c) => c.jurisdiction === j)).toBe(true)
    }
  })

  it('has unique, versioned case ids and documented gaps', () => {
    const ids = GOLDEN_CASES.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const c of GOLDEN_CASES) {
      expect(c.v).toBeGreaterThanOrEqual(1)
      if (c.kind === 'gap') expect(c.gapReason?.length ?? 0).toBeGreaterThan(0)
    }
  })

  it('every citation ref exists in the statute registry', () => {
    for (const c of GOLDEN_CASES) {
      for (const ref of [...c.requiredCitations, ...(c.expectedCitations ?? [])]) {
        expect(
          STATUTE_REGISTRY.some((e) => e.ref === ref),
          `${c.id} cites unregistered ref ${ref}`,
        ).toBe(true)
      }
    }
  })

  it('no registry entry is an orphan — every ref is exercised by a case', () => {
    const cited = new Set(
      GOLDEN_CASES.flatMap((c) => [...c.requiredCitations, ...(c.expectedCitations ?? [])]),
    )
    const orphans = STATUTE_REGISTRY.filter((e) => !cited.has(e.ref)).map((e) => e.ref)
    expect(orphans).toEqual([])
  })

  it.each(GOLDEN_CASES.map((c) => [c.id, c] as const))('%s has no failing check', (_id, c) => {
    const r = result.cases.find((x) => x.caseId === c.id)
    expect(r).toBeDefined()
    const failed = r!.checks.filter((x) => x.status === 'fail')
    expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
  })

  it('suite accuracy is reported and the run is timestamped', () => {
    expect(result.ranAt).toBe('2026-09-04T00:00:00.000Z')
    expect(result.suiteVersion).toBe(GOLDEN_SET_VERSION)
    expect(result.summary.total).toBe(GOLDEN_CASES.length)
    expect(result.summary.accuracy).toBeGreaterThan(0)
    expect(result.summary.fail).toBe(0)
  })
})
