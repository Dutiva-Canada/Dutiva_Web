import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FinanceBankItem, FinanceCategoryRule, FinanceLedgerAccount } from './types'
import type { RuleSuggestion } from './ruleSuggestion'

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

function item(description: string): FinanceBankItem {
  return {
    id: `bi-${description}`,
    bankAccountId: 'ba-1',
    date: '2026-01-01',
    amount: '100.00',
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
  if (t.includes('salary') || t.includes('payroll') || t.includes('6000')) return [1, 0, 0]
  if (t.includes('revenue') || t.includes('5000') || t.includes('stripe')) return [0, 1, 0]
  if (t.includes('bank') || t.includes('fee') || t.includes('6100')) return [0, 0, 1]
  return [0.1, 0.1, 0.1]
}

async function mockExtractor(inputs: string[]): Promise<{ data: number[]; dims: number[] }> {
  const data: number[] = []
  for (const text of inputs) data.push(...embeddingFor(text))
  return { data, dims: [inputs.length, 3] }
}

describe('suggestCategoryRulesWithAi', () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    const { pipeline } = await import('@xenova/transformers')
    vi.mocked(pipeline).mockResolvedValue(mockExtractor as any)
  })

  it('clusters salary/payroll descriptions and suggests the salary account', async () => {
    const { suggestCategoryRulesWithAi } = await import('./ruleSuggestionAi')
    const items = [
      item('SALARY DEPOSIT'),
      item('SALARY DIRECT DEPOSIT'),
      item('BIWEEKLY PAYROLL'),
      item('STRIPE PAYOUT'),
      item('STRIPE TRANSFER'),
      item('BANK FEE'),
    ]
    const result = await suggestCategoryRulesWithAi(items, accounts, [])

    const salary = result.find((r: RuleSuggestion) => r.ledgerAccountId === 'la-6000')
    expect(salary).toBeDefined()
    expect(salary!.direction).toBe('debit')
    expect(salary!.count).toBeGreaterThanOrEqual(2)
    expect(salary!.confidence).toBe('high')
  })

  it('matches bank fee descriptions to the bank fee account', async () => {
    const { suggestCategoryRulesWithAi } = await import('./ruleSuggestionAi')
    const result = await suggestCategoryRulesWithAi(
      [item('BANK FEE MONTHLY'), item('BANK FEE WIRE')],
      accounts,
      [],
    )

    const fee = result.find((r: RuleSuggestion) => r.ledgerAccountId === 'la-6100')
    expect(fee).toBeDefined()
    expect(fee!.direction).toBe('debit')
  })

  it('does not suggest a pattern already covered by an existing rule', async () => {
    const { suggestCategoryRulesWithAi } = await import('./ruleSuggestionAi')
    const existing: Pick<FinanceCategoryRule, 'pattern' | 'entityId'>[] = [
      { pattern: 'SALARY', entityId: 'ent-1' },
    ]
    const items = [item('SALARY DEPOSIT'), item('SALARY DIRECT DEPOSIT'), item('BIWEEKLY PAYROLL')]
    const result = await suggestCategoryRulesWithAi(items, accounts, existing)

    expect(result.find((r: RuleSuggestion) => r.pattern === 'SALARY')).toBeUndefined()
  })

  it('propagates an error when the pipeline fails to load', async () => {
    const { pipeline } = await import('@xenova/transformers')
    vi.mocked(pipeline).mockRejectedValue(new Error('network failure'))

    const { suggestCategoryRulesWithAi } = await import('./ruleSuggestionAi')
    await expect(suggestCategoryRulesWithAi([item('SALARY DEPOSIT')], accounts, [])).rejects.toThrow('network failure')
  })
})
