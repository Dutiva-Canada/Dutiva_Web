import type { FinanceBankItem, FinanceCurrency, FinanceImportRowError } from './types'
import { detectDelimiter, splitLines, parseCSVLine } from '@/lib/csv'
import { readSheet } from 'read-excel-file/browser'

/**
 * Bank statement import parser. Supports CSV and Excel files exported from
 * Canadian banking platforms (RBC, TD, Scotiabank, BMO, CIBC, Desjardins).
 * Auto-detects column layout from header names and falls back to positional
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
  /** Original field values for error reporting. */
  rawDate?: string
  rawAmount?: string
  rawDescription?: string
}

export interface StatementParseResult {
  rows: ParsedStatementRow[]
  totalRows: number
  errorRows: number
  /** Detected column mapping. */
  columnMap: ColumnMap
  /** Detected delimiter (CSV) or ',' for Excel. */
  delimiter: ',' | ';' | '\t' | '|'
  /** Per-row error details for diagnostics and export. */
  errorDetails: StatementRowError[]
}

export interface StatementRowError extends FinanceImportRowError {}

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
    return { rows: [], totalRows: 0, errorRows: 0, columnMap: { date: 0, amount: 1, description: 2 }, delimiter, errorDetails: [] }
  }

  const firstRow = parseCSVLine(lines[0] ?? '', delimiter)
  const columnMap = detectColumns(firstRow)
  const hasHeader = columnMap != null

  const dataStart = hasHeader ? 1 : 0
  const map: ColumnMap = hasHeader ? columnMap : { date: 0, amount: 1, description: 2 }

  const dataRows = lines.slice(dataStart).map((line) => parseCSVLine(line, delimiter))
  const { rows, errorDetails } = parseStatementRows(map, dataRows)

  return {
    rows,
    totalRows: rows.length,
    errorRows: errorDetails.length,
    columnMap: map,
    delimiter,
    errorDetails,
  }
}

/**
 * Parse an Excel or CSV file into structured statement rows.
 * The bank-statement flow accepts the same formats as the generic
 * bulk-import wizard, but preserves Excel date cells and quoted CSV fields.
 */
export function parseStatementFile(
  file: File,
  currency: FinanceCurrency,
): Promise<StatementParseResult> {
  const lower = file.name.toLowerCase()
  if (lower.endsWith('.csv') || lower.endsWith('.tsv') || lower.endsWith('.txt')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const text = String(reader.result ?? '')
          resolve(parseStatementCSV(text, currency))
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  return readSheet(file).then((data) => {
    const rows = (data as (string | number | boolean | Date | null)[][]).map((r) =>
      (r ?? []).map((cell) => (cell == null ? '' : formatStatementCell(cell))),
    )
    const headers = rows[0] ?? []
    const columnMap = detectColumns(headers)
    const hasHeader = columnMap != null

    const map: ColumnMap = hasHeader ? columnMap : { date: 0, amount: 1, description: 2 }
    const dataRows = hasHeader ? rows.slice(1) : [headers, ...rows.slice(1)]

    const { rows: parsedRows, errorDetails } = parseStatementRows(map, dataRows)

    return {
      rows: parsedRows,
      totalRows: parsedRows.length,
      errorRows: errorDetails.length,
      columnMap: map,
      delimiter: ',',
      errorDetails,
    }
  })
}

function parseStatementRows(
  map: ColumnMap,
  dataRows: string[][],
): { rows: ParsedStatementRow[]; errorDetails: StatementRowError[] } {
  const rows: ParsedStatementRow[] = []
  const errorDetails: StatementRowError[] = []

  for (let i = 0; i < dataRows.length; i++) {
    const fields = dataRows[i] ?? []
    const rowIndex = i

    const dateRaw = fields[map.date]?.trim() ?? ''
    const description = fields[map.description]?.trim() ?? ''

    let amountRaw = ''
    if (map.debitColumn != null && map.creditColumn != null) {
      const debit = fields[map.debitColumn]?.trim() ?? ''
      const credit = fields[map.creditColumn]?.trim() ?? ''
      amountRaw = debit || credit
      if (debit && !credit) amountRaw = `-${debit}`
    } else {
      amountRaw = fields[map.amount]?.trim() ?? ''
    }

    // Skip blank or summary rows (e.g. totals, empty Excel cells).
    if (dateRaw === '' && amountRaw === '' && description === '') continue

    const normalizedDate = normalizeDate(dateRaw)
    const normalizedAmount = normalizeAmount(amountRaw)

    if (!normalizedDate) {
      errorDetails.push({
        rowIndex,
        rawDate: dateRaw,
        rawAmount: amountRaw,
        rawDescription: description,
        reason: 'invalid_date',
      })
      rows.push({
        date: dateRaw,
        amount: normalizedAmount,
        description,
        rowIndex,
        error: 'invalid_date',
        rawDate: dateRaw,
        rawAmount: amountRaw,
        rawDescription: description,
      })
      continue
    }

    if (amountRaw === '' || normalizedAmount === '') {
      errorDetails.push({
        rowIndex,
        rawDate: dateRaw,
        rawAmount: amountRaw,
        rawDescription: description,
        reason: 'invalid_amount',
      })
      rows.push({
        date: normalizedDate,
        amount: '0',
        description,
        rowIndex,
        error: 'invalid_amount',
        rawDate: dateRaw,
        rawAmount: amountRaw,
        rawDescription: description,
      })
      continue
    }

    rows.push({
      date: normalizedDate,
      amount: normalizedAmount,
      description,
      rowIndex,
      rawDate: dateRaw,
      rawAmount: amountRaw,
      rawDescription: description,
    })
  }

  return { rows, errorDetails }
}

/**
 * Convert a bank-statement file (CSV, XLSX, XLS) to a CSV string suitable for
 * `importBankStatement`. Preserves Excel dates as ISO strings and quotes cells
 * that contain commas or quotes.
 */
export function statementFileToCsv(file: File): Promise<string> {
  const lower = file.name.toLowerCase()
  if (lower.endsWith('.csv') || lower.endsWith('.tsv') || lower.endsWith('.txt')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  return readSheet(file).then((data) => {
    const rows = (data as (string | number | boolean | Date | null)[][]).map((r) =>
      (r ?? []).map((cell) => quoteCsvCell(formatStatementCell(cell))),
    )
    return rows.map((r) => r.join(',')).join('\n')
  })
}

function quoteCsvCell(cell: string): string {
  if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
    return `"${cell.replace(/"/g, '""')}"`
  }
  return cell
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
  const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{2})[-/.](\d{2})$/)
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`

  const slashMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)
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

  // MM-DD-YYYY or DD-MM-YYYY with 4-digit year at end, using - or .
  const dashMatch = trimmed.match(/^(\d{1,2})[-.](\d{1,2})[-.](\d{4})$/)
  if (dashMatch) {
    const a = dashMatch[1] ?? '0'
    const b = dashMatch[2] ?? '0'
    const year = dashMatch[3] ?? '2000'
    const first = Number.parseInt(a, 10)
    const second = Number.parseInt(b, 10)
    if (first > 12) return `${year}-${String(second).padStart(2, '0')}-${String(first).padStart(2, '0')}`
    return `${year}-${String(first).padStart(2, '0')}-${String(second).padStart(2, '0')}`
  }

  // Aug 15, 2026 or 15 Aug 2026 / 15-Aug-2026 with textual month
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  const textMatch = trimmed.match(/^(?:([A-Za-z]{3})[a-z]*[-\s,]+(\d{1,2})[-\s,]+(\d{4})|(\d{1,2})[-\s,]+([A-Za-z]{3})[a-z]*[-\s,]+(\d{4}))$/)
  if (textMatch) {
    const monthText = (textMatch[1] ?? textMatch[5] ?? '').toLowerCase()
    const day = Number.parseInt(textMatch[2] ?? textMatch[4] ?? '0', 10)
    const year = textMatch[3] ?? textMatch[6] ?? '2000'
    const month = monthNames.indexOf(monthText) + 1
    if (month > 0 && day > 0) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }

  return ''
}

function normalizeAmount(raw: string): string {
  let s = raw.trim()
  if (s === '') return '0'

  // Track negativity from parentheses, trailing minus, or debit / Dr / DB markers.
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

  // Remove currency symbols, spaces, and plus signs
  s = s.replace(/[$€£¥\s+]/g, '')

  // Handle European decimal: 1.234,56 → 1234.56
  if (s.includes(',') && s.includes('.')) {
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
  let n = Number.parseFloat(s)
  if (!Number.isFinite(n)) return '0'
  if (negative) n = -Math.abs(n)
  return n.toFixed(2)
}

function formatStatementCell(cell: string | number | boolean | Date | null): string {
  if (cell == null) return ''
  if (cell instanceof Date) {
    const year = cell.getFullYear()
    const month = String(cell.getMonth() + 1).padStart(2, '0')
    const day = String(cell.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  return String(cell)
}
