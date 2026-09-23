import { describe, expect, it } from 'vitest'
import { computeSetupSteps, remainingSetupSteps, type SetupSignals } from './setupPath'

const fresh: SetupSignals = {
  jurisdictionsConfigured: false,
  documents: 0,
  policies: 0,
  employees: 0,
  workflowVisited: false,
}

describe('computeSetupSteps', () => {
  it('orders the path foundation-first — people last', () => {
    const steps = computeSetupSteps(fresh)
    expect(steps.map((s) => s.key)).toEqual([
      'profile',
      'documents',
      'policies',
      'explore',
      'people',
    ])
    expect(steps.every((s) => !s.done)).toBe(true)
  })

  it('completes each step from its own live signal', () => {
    const steps = computeSetupSteps({
      jurisdictionsConfigured: true,
      documents: 2,
      policies: 1,
      employees: 3,
      workflowVisited: true,
    })
    expect(steps.every((s) => s.done)).toBe(true)
    expect(remainingSetupSteps(steps)).toHaveLength(0)
  })

  it('keeps "people" undone for a solo founder while earlier steps complete', () => {
    const steps = computeSetupSteps({ ...fresh, jurisdictionsConfigured: true, documents: 1 })
    const remaining = remainingSetupSteps(steps)
    expect(remaining.map((s) => s.key)).toEqual(['policies', 'explore', 'people'])
  })

  it('completes "people" when employees exist even if nothing else does', () => {
    const steps = computeSetupSteps({ ...fresh, employees: 4 })
    expect(steps.find((s) => s.key === 'people')?.done).toBe(true)
    expect(remainingSetupSteps(steps)).toHaveLength(4)
  })
})
