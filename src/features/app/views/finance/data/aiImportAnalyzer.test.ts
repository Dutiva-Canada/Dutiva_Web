import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FinanceBankItem, FinanceCategorizationFeedback, FinanceLedgerAccount } from './types'

vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn(),
  env: {
    backends: {
      onnx: {
        wasm: {},
      },
    },
  },
}))

function item(description: string, amount = '100.00'): FinanceBankItem {
  return {
    id: `bi-${description}`,
    bankAccountId: 'ba-1',
    date: '2026-01-15',
    amount,
    currency: 'CAD',
    description,
    matchStatus: 'unmatched',
  }
}

const accounts: FinanceLedgerAccount[] = [
  { id: 'la-6000', bookId: 'book-1', code: '6000', name: { en: 'Salaries and wages', fr: 'Salaires et traitements' }, type: 'expense', sensitive: false, active: true },
  { id: 'la-5000', bookId: 'book-1', code: '5000', name: { en: 'Revenue — Services', fr: 'Revenus — Services' }, type: 'revenue', sensitive: false, active: true },
  { id: 'la-6100', bookId: 'book-1', code: '6100', name: { en: 'Bank fees', fr: 'Frais bancaires' }, type: 'expense', sensitive: false, active: true },
]

function embeddingFor(text: string): number[] {
  const t = text.toLowerCase()
  if (t.includes('salary') || t.includes('salaries') || t.includes('payroll') || t.includes('pay') || t.includes('6000')) return [1, 0, 0]
  if (t.includes('revenue') || t.includes('5000') || t.includes('stripe') || t.includes('payout')) return [0, 1, 0]
  if (t.includes('bank') || t.includes('fee') || t.includes('6100')) return [0, 0, 1]
  return [0.1, 0.1, 0.1]
}

async function mockExtractor(inputs: string[]): Promise<{ data: number[]; dims: number[] }> {
  const data: number[] = []
  for (const text of inputs) data.push(...embeddingFor(text))
  return { data, dims: [inputs.length, 3] }
}

describe('analyzeImportWithAi', () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    const { pipeline } = await import('@xenova/transformers')
    vi.mocked(pipeline).mockResolvedValue(mockExtractor as any)
    const { clearExtractorForTests } = await import('./aiEmbeddings')
    clearExtractorForTests()
  })

  it('suggests the salary account for payroll descriptions', async () => {
    const { analyzeImportWithAi } = await import('./aiImportAnalyzer')
    const result = await analyzeImportWithAi(
      [item('SALARY DEPOSIT'), item('PAYROLL DIRECT'), item('BIWEEKLY PAYROLL')],
      accounts,
      [],
      [],
      'auto_high',
    )

    expect(result.categorizations).toHaveLength(3)
    const first = result.categorizations[0]!
    expect(first.ledgerAccountId).toBe('la-6000')
    expect(first.matchStatus).toBe('matched')
    expect(first.confidence).toBe('high')
    expect(result.ruleSuggestions.length).toBeGreaterThan(0)
  })

  it('keeps low-confidence items suggested in suggest-only mode', async () => {
    const { analyzeImportWithAi } = await import('./aiImportAnalyzer')
    const result = await analyzeImportWithAi([item('MYSTERY WIDGETS')], accounts, [], [], 'suggest')

    const first = result.categorizations[0]!
    expect(first.matchStatus).toBe('suggested')
    expect(['low', 'medium']).toContain(first.confidence)
  })

  it('falls back to rule-based matching when the model fails to load', async () => {
    const { pipeline } = await import('@xenova/transformers')
    vi.mocked(pipeline).mockRejectedValue(new Error('model unavailable'))

    const { clearExtractorForTests } = await import('./aiEmbeddings')
    clearExtractorForTests()

    const { analyzeImportWithAi } = await import('./aiImportAnalyzer')
    const rules = [
      { id: 'cr-1', entityId: 'ent-1', pattern: 'SALARY', matchType: 'contains' as const, ledgerAccountId: 'la-6000', direction: 'debit' as const, priority: 50, active: true },
    ]

    const result = await analyzeImportWithAi([item('SALARY DIRECT DEPOSIT')], accounts, rules, [], 'auto_high')

    const first = result.categorizations[0]!
    expect(first.ledgerAccountId).toBe('la-6000')
    expect(first.matchStatus).toBe('matched')
    expect(first.reasonKey).toBe('rule_match')
  })

  it('reuses prior feedback to correct misclassified items', async () => {
    const { analyzeImportWithAi } = await import('./aiImportAnalyzer')
    const feedback: FinanceCategorizationFeedback[] = [
      {
        id: 'fb-1',
        entityId: 'ent-1',
        description: 'STRIPE PAYOUT',
        correctedLedgerAccountId: 'la-5000',
        correctedDirection: 'credit',
        correctedAt: '2026-01-01T00:00:00Z',
      },
    ]

    const result = await analyzeImportWithAi([item('STRIPE PAYOUT', '250.00')], accounts, [], feedback, 'auto_high')

    const first = result.categorizations[0]!
    expect(first.ledgerAccountId).toBe('la-5000')
    expect(first.reasonKey).toBe('feedback_match')
  })
})
