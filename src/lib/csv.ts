/**
 * Shared CSV utilities. Extracted from the bank-statement parser so the bulk
 * importer and other modules can reuse the same robust line splitting and
 * delimiter detection.
 */

export type CSVOptions = {
  delimiter?: ',' | ';' | '\t' | '|' | string
  hasHeader?: boolean
}

export interface ParsedCSV {
  /** Raw header row if one is detected. */
  headers: string[]
  /** Data rows, including the header row if `hasHeader` is false. */
  rows: string[][]
  delimiter: string
}

/**
 * Detect the delimiter used in a CSV-like text by inspecting the first line.
 */
export function detectDelimiter(text: string): ',' | ';' | '\t' | '|' {
  const firstLine = text.split(/\r?\n/)[0] ?? ''
  if (firstLine.includes('\t')) return '\t'
  if (firstLine.includes(';')) return ';'
  if (firstLine.includes('|')) return '|'
  return ','
}

/**
 * Split a text body into non-empty lines, handling CRLF and LF.
 */
export function splitLines(text: string): string[] {
  return text.split(/\r?\n/).filter((l) => l.trim() !== '')
}

/**
 * Parse a single CSV line respecting quoted fields and escaped quotes.
 */
export function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result.map((s) => s.trim())
}

/**
 * Parse a CSV text into headers and rows. Auto-detects delimiter and header.
 * If `hasHeader` is not provided, it is inferred from the first row.
 */
export function parseCSV(text: string, options: CSVOptions = {}): ParsedCSV {
  const delimiter = options.delimiter ?? detectDelimiter(text)
  const lines = splitLines(text)
  if (lines.length === 0) {
    return { headers: [], rows: [], delimiter }
  }

  const firstRow = parseCSVLine(lines[0] ?? '', delimiter)
  const inferredHeader = options.hasHeader ?? firstRow.some((cell) => /^[A-Za-z_][A-Za-z0-9_\s]*$/.test(cell.trim()))

  const dataStart = inferredHeader ? 1 : 0
  const rows: string[][] = []
  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i] ?? ''
    if (line.trim() === '') continue
    rows.push(parseCSVLine(line, delimiter))
  }

  return { headers: inferredHeader ? firstRow : [], rows, delimiter }
}
