import { describe, expect, it } from 'vitest'
import { parseDraft, sanitizeGoal, validateAiAction } from './handlers'

describe('sanitizeGoal', () => {
  it('requires a real goal and caps length', () => {
    expect(sanitizeGoal('too short')).toBeNull()
    expect(sanitizeGoal(42)).toBeNull()
    expect(sanitizeGoal('a'.repeat(2000))).toHaveLength(1200)
    expect(sanitizeGoal('  rebalance when any holding drifts past 25%  ')).toBe(
      'rebalance when any holding drifts past 25%',
    )
  })
})

describe('parseDraft', () => {
  const good = JSON.stringify({
    name: 'Rebalance watch',
    cadence: 'weekly',
    asset_classes: ['equity', 'etf'],
    rules: [
      { metric: 'weight_pct', op: 'gt', value: 25, kind: 'alert', title: 'Drift over 25%' },
      { metric: 'bogus_metric', op: 'lt', value: 0, kind: 'alert', title: 'drops' },
    ],
  })

  it('returns a validated draft', () => {
    const draft = parseDraft(good)
    expect(draft).not.toBeNull()
    expect(draft!.name).toBe('Rebalance watch')
    expect(draft!.cadence).toBe('weekly')
    expect(draft!.asset_classes).toEqual(['equity', 'etf'])
    /* The bogus metric was dropped by the engine's own validator. */
    expect(draft!.rules).toHaveLength(1)
    expect(draft!.rules[0].metric).toBe('weight_pct')
  })

  it('tolerates code fences and prose around the JSON', () => {
    expect(parseDraft(`Here you go:\n\`\`\`json\n${good}\n\`\`\``)).not.toBeNull()
  })

  it('rejects drafts with no valid rules or no name', () => {
    expect(parseDraft(JSON.stringify({ name: 'x', rules: [{ metric: 'nope', op: 'lt', value: 1, kind: 'alert', title: 't' }] }))).toBeNull()
    expect(parseDraft(JSON.stringify({ rules: [{ metric: 'weight_pct', op: 'gt', value: 25, kind: 'alert', title: 't' }] }))).toBeNull()
    expect(parseDraft('no json here')).toBeNull()
    expect(parseDraft('{}')).toBeNull()
  })

  it('defaults bad cadence/asset-classes to safe values', () => {
    const draft = parseDraft(JSON.stringify({
      name: 'x', cadence: 'hourly', asset_classes: ['moon', 'crypto'],
      rules: [{ metric: 'day_change_pct', op: 'lt', value: -8, kind: 'screen', title: 'dip' }],
    }))
    expect(draft!.cadence).toBe('daily')
    expect(draft!.asset_classes).toEqual(['crypto'])
  })
})

describe('validateAiAction', () => {
  it('accepts only draft-strategy', () => {
    expect(validateAiAction('draft-strategy').ok).toBe(true)
    expect(validateAiAction('auto-trade').ok).toBe(false)
  })
})
