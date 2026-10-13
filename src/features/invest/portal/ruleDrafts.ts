/**
 * Rule-draft helpers — the accordion needs a stable wrapper id for
 * reorder/expand/remove bookkeeping, and each rule carries a persistent
 * `id` of its own (0218): dedupe keys and firing history key on it, so a
 * label rename resets nothing and two same-title rules keep separate
 * slots. Kept separate from RulesAccordion.tsx so that file only exports
 * the component (react-refresh lint).
 */
import type { StrategyRule } from '../data/types'

export interface RuleDraft {
  id: string
  rule: StrategyRule
}

let ruleSeq = 0
const nextRuleId = () => `r${++ruleSeq}`

/** The persisted rule identity — collision-safe so two rules can never
    share a dedupe slot (a Date.now() key can collide in the same ms). */
export function newRulePersistId(): string {
  return `rule-${crypto.randomUUID()}`
}

/** Wrap stored rules for the accordion — backfilling a persistent id on
    rules saved before 0218 so the next save stamps it (the engine keeps
    title-keyed dedupe for older rows, so nothing rearms). */
export function toDrafts(rules: StrategyRule[]): RuleDraft[] {
  return rules.map((rule) => ({
    id: nextRuleId(),
    rule: rule.id ? rule : { ...rule, id: newRulePersistId() },
  }))
}

export function newRuleDraft(): RuleDraft {
  return {
    id: nextRuleId(),
    rule: {
      id: newRulePersistId(),
      type: 'signal',
      metric: 'vs_ma50',
      op: 'lt',
      value: -10,
      severity: 'insight',
      title: '',
    },
  }
}
