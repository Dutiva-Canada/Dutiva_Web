import type { Bi } from '@/i18n/core'

export interface BulkImportField<T> {
  /** Object key this field maps to. */
  key: keyof T
  /** Bilingual label shown in the mapping UI. */
  label: Bi
  /** Whether the field is required for a valid row. */
  required?: boolean
  /** Parse a raw string into the target type. Return undefined to skip. */
  parse?: (value: string) => unknown
  /** Return an error message if the parsed value is invalid. */
  validate?: (value: unknown) => string | undefined
  /** Header names that commonly map to this field (auto-detection). */
  headerHints: string[]
}

export interface BulkImportRow<T> {
  /** 0-based index in the source file (data rows only, excluding header). */
  index: number
  /** Raw cell values from the file. */
  raw: string[]
  /** Mapped and parsed values. */
  values: Partial<T>
  /** Validation errors per field key or for the whole row. */
  errors: Record<string, string>
  /** True if the row is valid and can be imported. */
  valid: boolean
}

export interface BulkImportAdapter<T> {
  /** Bilingual adapter name. */
  name: Bi
  /** Fields the adapter can import. */
  fields: BulkImportField<T>[]
  /** Return an initial mapping from detected headers to field keys. */
  inferMapping?: (headers: string[]) => Record<string, keyof T>
  /** Persist valid rows. Returns the number created and any failures. */
  import: (rows: Partial<T>[]) => Promise<{ created: number; failed: number; errors?: string[] }>
  /** Optional sample CSV header row for download templates. */
  sampleTemplate?: string[]
}

export interface BulkImportParseResult {
  headers: string[]
  rows: string[][]
  format: 'csv' | 'xlsx' | 'unknown'
  fileName: string
}
