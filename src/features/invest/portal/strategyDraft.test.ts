import { describe, expect, it } from 'vitest'
import type { InvestStrategy, SignalRule } from '../data/types'
import { cloneDraft, draftsEqual, toDraft, toWire } from './strategyDraft'

const signal: SignalRule = {
  type: 'signal',
  metric: 'day_change_pct',
  op: 'lt',
  value: -5,
  severity: 'alert',
  title: 'Dip',
}

const strategy: InvestStrategy = {
  id: 's1',
  name: 'Dip watcher',
  enabled: true,
  scope: { watchlist: false, symbols: ['aapl'] },
  rules: [signal],
  notify: { inApp: true, email: false },
  cadence: 'weekly',
  multiMatch: 'summary',
  template: 'tpl:dip',
}

describe('strategyDraft', () => {
  it('round-trips a strategy through draft and back', () => {
    const d = toDraft(strategy)
    expect(d.rules).toHaveLength(1)
    expect(d.rules[0]!.id).toBeTruthy() // accordion bookkeeping id added
    const wire = toWire(d)
    expect(wire.id).toBe('s1')
    expect(wire.scope.symbols).toEqual(['AAPL'])
    /* The draft backfills a persistent rule id (0218) — it rides the wire
       and survives the round-trip as the rule's dedupe identity. */
    expect(wire.rules[0]).toMatchObject(signal)
    expect(wire.rules[0]!.id).toBeTruthy()
    expect(wire.multiMatch).toBe('summary')
  })

  it('keeps a stored rule id across the round-trip', () => {
    const wire = toWire(toDraft({ ...strategy, rules: [{ ...signal, id: 'rule-keep' }] }))
    expect(wire.rules[0]!.id).toBe('rule-keep')
  })

  it('persists rule array order verbatim (order is display order)', () => {
    const other: SignalRule = { ...signal, title: 'Second', metric: 'vs_ma50' }
    const wire = toWire(toDraft({ ...strategy, rules: [signal, other] }))
    expect(wire.rules.map((r) => r.title)).toEqual(['Dip', 'Second'])
  })

  it('fills a blank rule label with the generated title on save', () => {
    const wire = toWire(toDraft({ ...strategy, rules: [{ ...signal, title: ' ' }] }))
    expect(wire.rules[0]!.title.trim().length).toBeGreaterThan(0)
  })

  it('does not clamp invalid numbers — validation stops the save first', () => {
    /* The old NaN→0 clamp turned a cleared threshold into `gt 0` — a rule
       that fired every sweep. toWire now passes the value through;
       validateRules is what stands between it and the database. */
    const wire = toWire(toDraft({ ...strategy, rules: [{ ...signal, value: NaN }] }))
    expect(Number.isNaN(wire.rules[0]!.value)).toBe(true)
  })

  it('discard restores the snapshot exactly', () => {
    const snap = cloneDraft(toDraft(strategy))
    const edited = cloneDraft(snap)
    edited.name = 'Renamed'
    edited.rules = []
    expect(draftsEqual(edited, snap)).toBe(false)
    expect(draftsEqual(cloneDraft(snap), snap)).toBe(true)
  })
})
