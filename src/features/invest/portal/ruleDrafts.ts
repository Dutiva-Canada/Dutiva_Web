/**
 * Rule-draft helpers — rules carry no id in the domain model, so drafts
 * wrap each with a stable one for the accordion's reorder/expand/remove
 * bookkeeping. Kept separate from RulesAccordion.tsx so that file only
 * exports the component (react-refresh lint).
 */
import type { StrategyRule } from '../data/types'

export interface RuleDraft {
  id: string
  rule: StrategyRule
}

let ruleSeq = 0
const nextRuleId = () => `r${++ruleSeq}`

export function toDrafts(rules: StrategyRule[]): RuleDraft[] {
  return rules.map((rule) => ({ id: nextRuleId(), rule }))
}

export function newRuleDraft(): RuleDraft {
  return {
    id: nextRuleId(),
    rule: {
      type: 'signal',
      metric: 'vs_ma50',
      op: 'lt',
      value: -10,
      severity: 'insight',
      title: '',
    },
  }
}
