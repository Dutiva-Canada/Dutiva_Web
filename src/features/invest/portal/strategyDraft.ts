/**
 * Editor draft model — the shape the strategy editor and wizard mutate
 * before saving. `rules` are wrapped in RuleDraft (stable ids for the
 * accordion); everything else maps 1:1 onto InvestStrategy.
 */
import type { InvestStrategy, MultiMatch, StrategyCadence, StrategyNotify, StrategyScope } from '../data/types'
import type { RuleDraft } from './ruleDrafts'
import { newRulePersistId, toDrafts } from './ruleDrafts'
import { storedRuleTitle } from './strategyUi'

export interface StrategyDraft {
  /** null until first save — a wizard-created strategy arrives already
      persisted, so in practice this is only null for a 'start blank' path. */
  id: string | null
  name: string
  enabled: boolean
  cadence: StrategyCadence
  scope: StrategyScope
  notify: StrategyNotify
  multiMatch: MultiMatch
  template: string
  rules: RuleDraft[]
}

export function toDraft(s: InvestStrategy): StrategyDraft {
  return {
    id: s.id,
    name: s.name,
    enabled: s.enabled,
    cadence: s.cadence,
    scope: { watchlist: s.scope.watchlist, symbols: [...s.scope.symbols] },
    notify: { ...s.notify },
    multiMatch: s.multiMatch,
    template: s.template,
    rules: toDrafts(s.rules),
  }
}

export function cloneDraft(d: StrategyDraft): StrategyDraft {
  return JSON.parse(JSON.stringify(d)) as StrategyDraft
}

/** Draft → save payload. Empty rule labels persist as the generated EN
    title (the dedupe fallback key needs a non-empty title) and every rule
    carries its persistent id — rule order in the array is display order
    (the engine evaluates all of them, it is not a priority). Invalid
    numbers stay invalid: the NaN clamps that used to silently turn a
    cleared input into a `gt 0` / `qty 0` rule are gone — validateRules
    catches those before this payload is ever sent. */
export function toWire(d: StrategyDraft): Omit<InvestStrategy, 'id'> & { id?: string } {
  return {
    ...(d.id ? { id: d.id } : {}),
    name: d.name.trim(),
    enabled: d.enabled,
    cadence: d.cadence,
    scope: {
      watchlist: d.scope.watchlist,
      symbols: d.scope.symbols.map((s) => s.toUpperCase()),
    },
    rules: d.rules.map((r) => ({
      ...r.rule,
      id: r.rule.id ?? newRulePersistId(),
      title: storedRuleTitle(r.rule),
    })),
    notify: { ...d.notify },
    multiMatch: d.multiMatch,
    template: d.template,
  }
}

export function draftsEqual(a: StrategyDraft, b: StrategyDraft): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
