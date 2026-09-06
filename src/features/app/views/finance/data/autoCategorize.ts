import type { FinanceBankItem, FinanceCategoryRule, FinanceLedgerAccount } from './types'

/**
 * Rule-based auto-categorization engine. Matches bank item descriptions
 * against category rules and suggests a ledger account for each transaction.
 *
 * Rules are evaluated by priority (highest first). The first matching rule
 * wins. Unmatched items are left as 'unmatched' for manual review.
 */

export interface CategorizationSuggestion {
  bankItemId: string
  /** The rule that matched, if any. */
  ruleId?: string
  /** Ledger account ID to categorize to. */
  ledgerAccountId?: string
  /** Whether the amount debits or credits this account. */
  direction?: 'debit' | 'credit'
  /** Confidence: 'high' = exact match, 'medium' = contains/starts/ends. */
  confidence: 'high' | 'medium' | 'none'
  /** Human-readable reason for the suggestion. */
  reason: string
}

/**
 * Run auto-categorization on a set of bank items using the given rules.
 * Returns one suggestion per bank item. Items with no match get confidence 'none'.
 */
export function autoCategorize(
  bankItems: FinanceBankItem[],
  rules: FinanceCategoryRule[],
  ledgerAccounts: FinanceLedgerAccount[],
): CategorizationSuggestion[] {
  const sortedRules = [...rules].filter((r) => r.active).sort((a, b) => b.priority - a.priority)
  const ledgerById = new Map(ledgerAccounts.map((la) => [la.id, la]))

  return bankItems.map((bi) => {
    // Skip items already matched
    if (bi.matchStatus === 'matched') {
      return {
        bankItemId: bi.id,
        confidence: 'none',
        reason: 'Already matched',
      }
    }

    const upperDesc = bi.description.toUpperCase()
    for (const rule of sortedRules) {
      const pattern = rule.pattern.toUpperCase()
      const matched = matchPattern(upperDesc, pattern, rule.matchType)
      if (matched) {
        const account = ledgerById.get(rule.ledgerAccountId)
        const accountLabel = account ? `${account.code} — ${account.name.en}` : rule.ledgerAccountId
        return {
          bankItemId: bi.id,
          ruleId: rule.id,
          ledgerAccountId: rule.ledgerAccountId,
          direction: rule.direction,
          confidence: rule.matchType === 'exact' ? 'high' : 'medium',
          reason: `Matched rule "${rule.pattern}" → ${accountLabel}`,
        }
      }
    }

    return {
      bankItemId: bi.id,
      confidence: 'none',
      reason: 'No matching rule',
    }
  })
}

/**
 * Apply suggestions to bank items by updating their match status to 'suggested'
 * and recording the suggested ledger account. The caller is responsible for
 * persisting the updated items.
 */
export function applySuggestions(
  bankItems: FinanceBankItem[],
  suggestions: CategorizationSuggestion[],
): FinanceBankItem[] {
  const suggestionMap = new Map(suggestions.map((s) => [s.bankItemId, s]))
  return bankItems.map((bi) => {
    const sug = suggestionMap.get(bi.id)
    if (!sug || sug.confidence === 'none' || !sug.ledgerAccountId) return bi
    return {
      ...bi,
      matchStatus: 'suggested' as const,
    }
  })
}

/**
 * Create a journal entry line from a categorized bank item.
 * Positive amounts are debits to the bank account (asset increase);
 * the offsetting credit goes to the categorized account.
 * Negative amounts are credits to the bank account (asset decrease);
 * the offsetting debit goes to the categorized account.
 */
export function bankItemToJournalLine(
  bi: FinanceBankItem,
  suggestion: CategorizationSuggestion,
  bankLedgerAccountId: string,
): { lines: { accountId: string; debit: string; credit: string }[] } | null {
  if (!suggestion.ledgerAccountId || suggestion.confidence === 'none') return null

  const amount = Math.abs(Number.parseFloat(bi.amount)).toFixed(2)
  const isPositive = Number.parseFloat(bi.amount) > 0

  if (isPositive) {
    // Money in: debit bank, credit categorized account
    return {
      lines: [
        { accountId: bankLedgerAccountId, debit: amount, credit: '0.00' },
        { accountId: suggestion.ledgerAccountId, debit: '0.00', credit: amount },
      ],
    }
  }
  // Money out: credit bank, debit categorized account
  return {
    lines: [
      { accountId: suggestion.ledgerAccountId, debit: amount, credit: '0.00' },
      { accountId: bankLedgerAccountId, debit: '0.00', credit: amount },
    ],
  }
}

function matchPattern(description: string, pattern: string, matchType: string): boolean {
  switch (matchType) {
    case 'exact':
      return description === pattern
    case 'contains':
      return description.includes(pattern)
    case 'starts_with':
      return description.startsWith(pattern)
    case 'ends_with':
      return description.endsWith(pattern)
    default:
      return false
  }
}
