import { parseCSV } from '@/lib/csv'
import type { BulkImportParseResult } from './types'

export function parseImportFile(file: File): Promise<BulkImportParseResult> {
  const fileName = file.name
  const lower = fileName.toLowerCase()

  if (lower.endsWith('.csv') || lower.endsWith('.tsv') || lower.endsWith('.txt')) {
    return parseCSVFile(file, fileName)
  }

  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    throw new Error('Excel support is not yet available; please use CSV for now.')
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
