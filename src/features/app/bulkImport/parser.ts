import { parseCSV } from '@/lib/csv'
import { readSheet } from 'read-excel-file/browser'
import type { BulkImportParseResult } from './types'

export function parseImportFile(file: File): Promise<BulkImportParseResult> {
  const fileName = file.name
  const lower = fileName.toLowerCase()

  if (lower.endsWith('.csv') || lower.endsWith('.tsv') || lower.endsWith('.txt')) {
    return parseCSVFile(file, fileName)
  }

  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    return parseXLSXFile(file, fileName)
  }

  // Try CSV for files with no extension.
  return parseCSVFile(file, fileName)
}

function parseCSVFile(file: File, fileName: string): Promise<BulkImportParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = String(e.target?.result ?? '')
        const { headers, rows, delimiter } = parseCSV(text)
        void headers
        void delimiter
        resolve({ headers, rows, format: 'csv', fileName })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

function parseXLSXFile(file: File, fileName: string): Promise<BulkImportParseResult> {
  return readSheet(file).then((data) => {
    const rows = (data as (string | number | boolean | Date | null)[][]).map((r) =>
      (r ?? []).map((cell) => (cell == null ? '' : String(cell))),
    )
    const headers = rows[0] ?? []
    return { headers, rows: rows.slice(1), format: 'xlsx', fileName }
  })
}
