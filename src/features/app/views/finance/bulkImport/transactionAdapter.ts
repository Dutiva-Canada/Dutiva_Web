import type { FinanceBankItem, FinanceBankStatementImportResult } from '../data/types'
import type { BulkImportAdapter, BulkImportField } from '@/features/app/bulkImport/types'
import { bulkImportMessages as B } from '@/i18n/messages/bulkImport'

function parseDate(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return trimmed
  const slash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slash) {
    const [a, b, year] = [Number(slash[1]), Number(slash[2]), slash[3]]
    if (a > 12) return `${year}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`
    return `${year}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`
  }
  return undefined
}

function normalizeAmount(raw: string): string {
  let s = raw.trim()
  if (s === '') return ''
  s = s.replace(/[$€£\s]/g, '')
  if (s.includes(',') && s.includes('.')) {
    const lastComma = s.lastIndexOf(',')
    const lastDot = s.lastIndexOf('.')
    if (lastComma > lastDot) {
      s = s.replace(/\./g, '').replace(',', '.')
    } else {
      s = s.replace(/,/g, '')
    }
  } else if (s.includes(',') && !s.includes('.')) {
    const afterComma = s.split(',')[1] ?? ''
    if (afterComma.length <= 2) {
      s = s.replace(',', '.')
    } else {
      s = s.replace(/,/g, '')
    }
  }
  const n = Number.parseFloat(s)
  if (!Number.isFinite(n)) return ''
  return n.toFixed(2)
}

export const transactionBulkImportFields: BulkImportField<FinanceBankItem>[] = [
  {
    key: 'date',
    label: B.bulk_field_date,
    required: true,
    parse: parseDate,
    validate: (v) => (v ? undefined : 'invalid date'),
    headerHints: ['date', 'transaction date', 'posting date', 'trans date'],
  },
  {
    key: 'amount',
    label: B.bulk_field_amount,
    required: true,
    parse: normalizeAmount,
    validate: (v) => (v && Number.parseFloat(String(v)) !== 0 ? undefined : 'invalid amount'),
    headerHints: ['amount', 'transaction amount', 'value'],
  },
  {
    key: 'description',
    label: B.bulk_field_description,
    required: true,
    headerHints: ['description', 'details', 'memo', 'narrative', 'payee'],
  },
  {
    key: 'bankAccountId',
    label: B.bulk_field_bank_account_id,
    required: true,
    headerHints: ['bank account', 'account id', 'bank account id'],
  },
  {
    key: 'currency',
    label: B.bulk_field_currency,
    parse: (v) => v.trim().toUpperCase(),
    validate: (v) => (typeof v === 'string' && ['CAD', 'USD', 'EUR', 'GBP'].includes(v) ? undefined : 'must be CAD, USD, EUR, or GBP'),
    headerHints: ['currency', 'ccy'],
  },
]

function generateStatementCSV(rows: Partial<FinanceBankItem>[]): string {
  const header = ['Date', 'Amount', 'Description']
  const lines = rows.map((r) => [r.date ?? '', r.amount ?? '', r.description ?? ''].join(','))
  return [header.join(','), ...lines].join('\n')
}

export function createTransactionBulkImportAdapter(
  importBankStatement: (
    bankAccountId: string,
    fileName: string,
    fileContent: string,
  ) => Promise<FinanceBankStatementImportResult | null>,
): BulkImportAdapter<FinanceBankItem> {
  return {
    name: B.bulk_import_transactions,
    fields: transactionBulkImportFields,
    import: async (rows) => {
      const byAccount = new Map<string, Partial<FinanceBankItem>[]>()
      for (const row of rows) {
        const accountId = row.bankAccountId
        if (!accountId) continue
        const list = byAccount.get(accountId) ?? []
        list.push(row)
        byAccount.set(accountId, list)
      }

      let created = 0
      const errors: string[] = []
      for (const [accountId, accountRows] of byAccount) {
        const csv = generateStatementCSV(accountRows)
        try {
          const result = await importBankStatement(accountId, 'bulk-import.csv', csv)
          if (result) created += result.newItems
          else errors.push(`Account ${accountId}: import returned null`)
        } catch (err) {
          errors.push(`Account ${accountId}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
      return { created, failed: rows.length - created, errors }
    },
    sampleTemplate: transactionBulkImportFields.map((f) => String(f.key)),
  }
}
