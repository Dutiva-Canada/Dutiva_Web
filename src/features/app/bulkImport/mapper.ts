import type { BulkImportField, BulkImportRow } from './types'

/**
 * Infer a column-to-field mapping from the file headers using each field's
 * header hints.
 */
export function inferMapping<T>(
  headers: string[],
  fields: BulkImportField<T>[],
): Record<number, keyof T> {
  const mapping: Record<number, keyof T> = {}
  const used = new Set<keyof T>()

  headers.forEach((header, index) => {
    const lower = header.toLowerCase().trim()
    for (const field of fields) {
      if (used.has(field.key)) continue
      if (field.headerHints.some((hint) => lower === hint.toLowerCase() || lower.includes(hint.toLowerCase()))) {
        mapping[index] = field.key
        used.add(field.key)
        break
      }
    }
  })

  return mapping
}

/**
 * Parse and validate every data row using the selected column mapping.
 */
export function mapAndValidateRows<T>(
  rawRows: string[][],
  _headers: string[],
  columnMapping: Record<number, keyof T>,
  fields: BulkImportField<T>[],
): BulkImportRow<T>[] {
  const fieldMap = new Map<keyof T, BulkImportField<T>>()
  for (const f of fields) fieldMap.set(f.key, f)

  return rawRows.map((raw, index) => {
    const values: Partial<T> = {}
    const errors: Record<string, string> = {}

    for (const [colIndex, fieldKey] of Object.entries(columnMapping)) {
      const field = fieldMap.get(fieldKey as keyof T)
      if (!field) continue
      const rawValue = raw[Number(colIndex)] ?? ''
      const parsed = field.parse ? field.parse(rawValue) : rawValue

      if (parsed === undefined || (typeof parsed === 'string' && parsed === '')) {
        if (field.required) {
          errors[String(field.key)] = 'required'
        }
        continue
      }

      const validationError = field.validate ? field.validate(parsed) : undefined
      if (validationError) {
        errors[String(field.key)] = validationError
      } else {
        ;(values as Record<string, unknown>)[String(field.key)] = parsed
      }
    }

    for (const field of fields) {
      if (field.required && !(field.key in values)) {
        errors[String(field.key)] = errors[String(field.key)] || 'required'
      }
    }

    const valid = Object.keys(errors).length === 0
    return { index, raw, values, errors, valid }
  })
}

export function generateTemplate<T>(fields: BulkImportField<T>[]): string {
  const headers = fields.map((f) => String(f.key))
  const rows = fields.map(() => '')
  return [headers.join(','), rows.join(',')].join('\n')
}
