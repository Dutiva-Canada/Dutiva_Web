import type { FinanceBankItem, FinanceCurrency } from './types'
import { detectDelimiter, splitLines, parseCSVLine } from '@/lib/csv'

/**
 * Bank statement import parser. Supports CSV files exported from Canadian
 * banking platforms (RBC, TD, Scotiabank, BMO, CIBC, Desjardins). The parser
 * auto-detects column layout from header names and falls back to positional
 * mapping when headers are missing.
 *
 * Money is represented as string-based fixed-precision decimals to avoid
 * binary floating point, matching the rest of the finance data layer.
 */

export interface ParsedStatementRow {
  date: string
  amount: string
  description: string
  /** Raw row index in the source file (0-based, after header). */
  rowIndex: number
  /** Whether the row had a parse error. */
  error?: string
}

export interface StatementParseResult {
  rows: ParsedStatementRow[]
  totalRows: number
  errorRows: number
  /** Detected column mapping. */
  columnMap: ColumnMap
  /** Detected delimiter. */
  delimiter: ',' | ';' | '\t' | '|'
}

export interface ColumnMap {
  date: number
  amount: number
  description: number
  /** Optional: separate debit column (some banks split deposits/withdrawals). */
  debitColumn?: number
  creditColumn?: number
}

const DATE_HEADERS = ['date', 'transaction date', 'posting date', 'trans date', 'date posted']
const AMOUNT_HEADERS = ['amount', 'transaction amount', 'amount (cad)', 'amount cad', 'value']
const DEBIT_HEADERS = ['debit', 'withdrawal', 'withdrawals', 'debit (cad)', 'outflow']
const CREDIT_HEADERS = ['credit', 'deposit', 'deposits', 'credit (cad)', 'inflow']
const DESCRIPTION_HEADERS = ['description', 'details', 'memo', 'narrative', 'transaction details', 'payee']

/**
 * Parse CSV text into structured statement rows. Auto-detects delimiter and
 * column layout from the header row. If no header is found, assumes
 * [date, amount, description] positional order.
 */
export function parseStatementCSV(text: string, _currency: FinanceCurrency): StatementParseResult {
  const delimiter = detectDelimiter(text)
  const lines = splitLines(text)
  if (lines.length === 0) {
    return { rows: [], totalRows: 0, errorRows: 0, columnMap: { date: 0, amount: 1, description: 2 }, delimiter }
  }

  const firstRow = parseCSVLine(lines[0] ?? '', delimiter)
  const columnMap = detectColumns(firstRow)
  const hasHeader = columnMap != null

  const dataStart = hasHeader ? 1 : 0
  const map: ColumnMap = hasHeader ? columnMap : { date: 0, amount: 1, description: 2 }

  const rows: ParsedStatementRow[] = []
  let errorRows = 0

  for (let i = dataStart; i < lines.length; i++) {
    const line = (lines[i] ?? '').trim()
    if (line === '') continue

    const fields = parseCSVLine(line, delimiter)
    const rowIndex = i - dataStart

    const dateRaw = fields[map.date]?.trim() ?? ''
    const description = fields[map.description]?.trim() ?? ''

    let amountRaw: string
    if (map.debitColumn != null && map.creditColumn != null) {
      const debit = fields[map.debitColumn]?.trim() ?? ''
      const credit = fields[map.creditColumn]?.trim() ?? ''
      amountRaw = debit || credit || '0'
      // Debit is negative (money out), credit is positive (money in).
      if (debit && !credit) amountRaw = `-${normalizeAmount(debit)}`
      else amountRaw = normalizeAmount(credit || debit)
    } else {
      amountRaw = fields[map.amount]?.trim() ?? '0'
    }

    const normalizedDate = normalizeDate(dateRaw)
    const normalizedAmount = normalizeAmount(amountRaw)

    if (!normalizedDate) {
      errorRows++
      rows.push({ date: dateRaw, amount: normalizedAmount, description, rowIndex, error: 'invalid_date' })
      continue
    }
    if (normalizedAmount === '' || !isFiniteAmount(normalizedAmount)) {
      errorRows++
      rows.push({ date: normalizedDate, amount: '0', description, rowIndex, error: 'invalid_amount' })
      continue
    }

    rows.push({ date: normalizedDate, amount: normalizedAmount, description, rowIndex })
  }

  return {
    rows,
    totalRows: rows.length,
    errorRows,
    columnMap: map,
    delimiter,
  }
}

/**
 * Convert parsed rows into FinanceBankItem objects, deduplicating against
 * existing bank items for the same account.
 */
export function rowsToBankItems(
  rows: ParsedStatementRow[],
  bankAccountId: string,
  currency: FinanceCurrency,
  existingItems: FinanceBankItem[],
): { newItems: FinanceBankItem[]; duplicates: number; errors: number } {
  const existingKeys = new Set(
    existingItems.map((bi) => `${bi.date}|${bi.amount}|${bi.description}`),
  )

  const newItems: FinanceBankItem[] = []
  let duplicates = 0
  let errors = 0

  for (const row of rows) {
    if (row.error) {
      errors++
      continue
    }
    const key = `${row.date}|${row.amount}|${row.description}`
    if (existingKeys.has(key)) {
      duplicates++
      continue
    }
    existingKeys.add(key)
    newItems.push({
      id: `bi-imp-${Date.now()}-${row.rowIndex}`,
      bankAccountId,
      date: row.date,
      amount: row.amount,
      currency,
      description: row.description,
      matchStatus: 'unmatched',
    })
  }

  return { newItems, duplicates, errors }
}

/* ---------- Internal helpers ---------- */

function detectColumns(header: string[]): ColumnMap | null {
  const lower = header.map((h) => h.toLowerCase().trim())

  const dateIdx = lower.findIndex((h) => DATE_HEADERS.includes(h))
  const amountIdx = lower.findIndex((h) => AMOUNT_HEADERS.includes(h))
  const descIdx = lower.findIndex((h) => DESCRIPTION_HEADERS.includes(h))
  const debitIdx = lower.findIndex((h) => DEBIT_HEADERS.includes(h))
  const creditIdx = lower.findIndex((h) => CREDIT_HEADERS.includes(h))

  // Need at least date and description; amount can come from debit/credit columns.
  const hasAmount = amountIdx >= 0 || (debitIdx >= 0 && creditIdx >= 0)
  if (dateIdx < 0 || descIdx < 0 || !hasAmount) return null

  return {
    date: dateIdx,
    amount: amountIdx >= 0 ? amountIdx : debitIdx,
    description: descIdx,
    debitColumn: debitIdx >= 0 ? debitIdx : undefined,
    creditColumn: creditIdx >= 0 ? creditIdx : undefined,
  }
}

function normalizeDate(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed === '') return ''

  // ISO format: 2026-08-15
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`

  // DD/MM/YYYY or MM/DD/YYYY — Canadian banks use both
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    const a = slashMatch[1] ?? '0'
    const b = slashMatch[2] ?? '0'
    const year = slashMatch[3] ?? '2000'
    const first = Number.parseInt(a, 10)
    const second = Number.parseInt(b, 10)
    // If first > 12, it's a day. If second > 12, first is month.
    if (first > 12) return `${year}-${String(second).padStart(2, '0')}-${String(first).padStart(2, '0')}`
    if (second > 12) return `${year}-${String(first).padStart(2, '0')}-${String(second).padStart(2, '0')}`
    // Ambiguous: default to DD/MM (common Canadian format)
    return `${year}-${String(second).padStart(2, '0')}-${String(first).padStart(2, '0')}`
  }

  // MM-DD-YYYY
  const dashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (dashMatch) {
    const a = dashMatch[1] ?? '0'
    const b = dashMatch[2] ?? '0'
    const year = dashMatch[3] ?? '2000'
    const first = Number.parseInt(a, 10)
    const second = Number.parseInt(b, 10)
    if (first > 12) return `${year}-${String(second).padStart(2, '0')}-${String(first).padStart(2, '0')}`
    return `${year}-${String(first).padStart(2, '0')}-${String(second).padStart(2, '0')}`
  }

  return ''
}

function normalizeAmount(raw: string): string {
  let s = raw.trim()
  if (s === '') return '0'
  // Remove currency symbols and spaces
  s = s.replace(/[$€£\s]/g, '')
  // Handle European decimal: 1.234,56 → 1234.56
  if (s.includes(',') && s.includes('.')) {
    // If comma comes after the last dot, comma is decimal separator
    const lastComma = s.lastIndexOf(',')
    const lastDot = s.lastIndexOf('.')
    if (lastComma > lastDot) {
      s = s.replace(/\./g, '').replace(',', '.')
    } else {
      s = s.replace(/,/g, '')
    }
  } else if (s.includes(',') && !s.includes('.')) {
    // Could be decimal or thousands. If 2 digits after comma, treat as decimal.
    const afterComma = s.split(',')[1] ?? ''
    if (afterComma.length <= 2) {
      s = s.replace(',', '.')
    } else {
      s = s.replace(/,/g, '')
    }
  }
  // Ensure two decimal places
  const n = Number.parseFloat(s)
  if (!Number.isFinite(n)) return '0'
  return n.toFixed(2)
}

function isFiniteAmount(s: string): boolean {
  const n = Number.parseFloat(s)
  return Number.isFinite(n) && n !== 0
}
