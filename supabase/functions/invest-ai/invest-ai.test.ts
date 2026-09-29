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
    scope: { watchlist: false, symbols: ['SHOP', 'XEQT'] },
    rules: [
      {
        metric: 'weight_pct',
        op: 'gt',
        value: 25,
        type: 'signal',
        severity: 'alert',
        title: 'Drift over 25%',
      },
      {
        metric: 'bogus_metric',
        op: 'lt',
        value: 0,
        type: 'signal',
        severity: 'alert',
        title: 'drops',
      },
    ],
  })

  it('returns a validated draft', () => {
    const draft = parseDraft(good)
    expect(draft).not.toBeNull()
    expect(draft!.name).toBe('Rebalance watch')
    expect(draft!.cadence).toBe('weekly')
    expect(draft!.scope).toEqual({ watchlist: false, symbols: ['SHOP', 'XEQT'] })
    /* The bogus metric was dropped by the engine's own validator. */
    expect(draft!.rules).toHaveLength(1)
    expect(draft!.rules[0].metric).toBe('weight_pct')
    expect(draft!.rules[0].type).toBe('signal')
  })

  it('tolerates code fences and prose around the JSON', () => {
    expect(parseDraft(`Here you go:\n\`\`\`json\n${good}\n\`\`\``)).not.toBeNull()
  })

  it('rejects drafts with no valid rules or no name', () => {
    expect(
      parseDraft(
        JSON.stringify({
          name: 'x',
          rules: [{ metric: 'nope', op: 'lt', value: 1, type: 'signal', title: 't' }],
        }),
      ),
    ).toBeNull()
    expect(
      parseDraft(
        JSON.stringify({
          rules: [{ metric: 'weight_pct', op: 'gt', value: 25, type: 'signal', title: 't' }],
        }),
      ),
    ).toBeNull()
    expect(parseDraft('no json here')).toBeNull()
    expect(parseDraft('{}')).toBeNull()
  })

  it('defaults bad cadence/scope to safe values and maps legacy rules', () => {
    const draft = parseDraft(
      JSON.stringify({
        name: 'x',
        cadence: 'hourly',
        scope: { watchlist: false, symbols: ['not a symbol!!'] },
        rules: [
          { metric: 'day_change_pct', op: 'lt', value: -8, kind: 'screen', title: 'dip' },
          {
            metric: 'day_change_pct',
            op: 'lt',
            value: -5,
            kind: 'alert',
            title: 'buy',
            side: 'buy',
            qty: 2,
          },
        ],
      }),
    )
    expect(draft!.cadence).toBe('daily')
    /* No valid symbols → watchlist fallback so the draft still has scope. */
    expect(draft!.scope).toEqual({ watchlist: true, symbols: [] })
    /* Legacy kinds still normalize: screen → insight signal, side+qty → proposal. */
    expect(draft!.rules[0]).toMatchObject({ type: 'signal', severity: 'insight' })
    expect(draft!.rules[1]).toMatchObject({
      type: 'order_proposal',
      side: 'buy',
      qty: 2,
      qty_unit: 'shares',
    })
  })
})

describe('validateAiAction', () => {
  it('accepts only draft-strategy', () => {
    expect(validateAiAction('draft-strategy').ok).toBe(true)
    expect(validateAiAction('auto-trade').ok).toBe(false)
  })
})
