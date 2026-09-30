import type { FinanceJournalLine } from './types'

export function isJournalBalanced(lines: FinanceJournalLine[]): boolean {
  const debit = lines.reduce((sum, l) => sum + parseDecimal(l.debit), 0)
  const credit = lines.reduce((sum, l) => sum + parseDecimal(l.credit), 0)
  return Math.abs(debit - credit) < 0.005
}

function parseDecimal(s: string): number {
  const n = Number.parseFloat(s)
  return Number.isFinite(n) ? n : 0
}
