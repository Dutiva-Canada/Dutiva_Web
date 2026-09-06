import type { BulkImportAdapter, BulkImportField } from '@/features/app/bulkImport/types'
import { bulkImportMessages as B } from '@/i18n/messages/bulkImport'

export interface BankStatementImportRow {
  date?: string
  description?: string
  debit?: string
  credit?: string
  amount?: string
}

function parseDate(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const iso = trimmed.match(/^(\d{4})[-/.](\d{2})[-/.](\d{2})$/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const slash = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)
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
  let negative = false
  if (s.startsWith('(') && s.endsWith(')')) {
    negative = true
    s = s.slice(1, -1)
  }
  if (s.endsWith('-')) {
    negative = true
    s = s.slice(0, -1).trim()
  }
  if (/\b(Dr|DB|Debit)\b$/i.test(s)) {
    negative = true
    s = s.replace(/\s*(Dr|DB|Debit)\b$/i, '')
  } else if (/\b(Cr|CD|Credit)\b$/i.test(s)) {
    s = s.replace(/\s*(Cr|CD|Credit)\b$/i, '')
  }
  s = s.replace(/[$€£¥\s+]/g, '')
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
  if (negative) return (-Math.abs(n)).toFixed(2)
  return n.toFixed(2)
}

export const bankStatementBulkImportFields: BulkImportField<BankStatementImportRow>[] = [
  {
    key: 'date',
    label: B.bulk_field_date,
    required: true,
    parse: parseDate,
    validate: (v) => (v ? undefined : 'invalid date'),
    headerHints: ['date', 'transaction date', 'posting date', 'trans date'],
  },
  {
    key: 'description',
    label: B.bulk_field_description,
    required: true,
    headerHints: ['description', 'details', 'memo', 'narrative', 'payee'],
  },
  {
    key: 'debit',
    label: B.bulk_field_debit,
    parse: normalizeAmount,
    headerHints: ['debit', 'withdrawal', 'withdrawals', 'outflow'],
  },
  {
    key: 'credit',
    label: B.bulk_field_credit,
    parse: normalizeAmount,
    headerHints: ['credit', 'deposit', 'deposits', 'inflow'],
  },
  {
    key: 'amount',
    label: B.bulk_field_amount,
    parse: normalizeAmount,
    validate: (v) => (v && Number.parseFloat(String(v)) !== 0 ? undefined : 'invalid amount'),
    headerHints: ['amount', 'transaction amount', 'value'],
  },
]

function generateStatementCSV(rows: Partial<BankStatementImportRow>[]): string {
  const header = ['Date', 'Amount', 'Description']
  const lines = rows.map((r) => {
    let amount = r.amount
    if (!amount) {
      const debit = r.debit
      const credit = r.credit
      if (debit) amount = `-${debit}`
      else amount = credit
    }
    return [r.date ?? '', amount ?? '', r.description ?? ''].join(',')
  })
  return [header.join(','), ...lines].join('\n')
}

export function createBankStatementBulkImportAdapter(
  bankAccountId: string,
  importBankStatement: (
    bankAccountId: string,
    fileName: string,
    fileContent: string,
  ) => Promise<{ newItems: number; duplicates: number; errors: number } | null>,
): BulkImportAdapter<BankStatementImportRow> {
  return {
    name: B.bulk_import_bank_statement,
    fields: bankStatementBulkImportFields,
    import: async (rows: Partial<BankStatementImportRow>[]) => {
      const validRows = rows.filter((r) => r.date && (r.amount || r.debit || r.credit) && r.description)
      if (validRows.length === 0) return { created: 0, failed: rows.length, errors: ['No valid rows to import'] }

      const csv = generateStatementCSV(validRows)
      try {
        const result = await importBankStatement(bankAccountId, 'bulk-import.csv', csv)
        if (!result) return { created: 0, failed: rows.length, errors: ['Import returned null'] }
        return { created: result.newItems, failed: result.duplicates + result.errors, errors: [] }
      } catch (err) {
        return { created: 0, failed: rows.length, errors: [err instanceof Error ? err.message : String(err)] }
      }
    },
    sampleTemplate: bankStatementBulkImportFields.map((f) => String(f.key)),
  }
}
