import { useCallback, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { BulkImportAdapter, BulkImportParseResult, BulkImportRow } from './types'
import { parseImportFile } from './parser'
import { inferMapping, mapAndValidateRows } from './mapper'

type BulkImportStep = 'upload' | 'map' | 'preview' | 'importing' | 'done'

interface UseBulkImportOptions<T> {
  adapter: BulkImportAdapter<T>
}

interface UseBulkImportResult<T> {
  step: BulkImportStep
  parseResult: BulkImportParseResult | null
  columnMapping: Record<number, keyof T>
  mappedRows: BulkImportRow<T>[]
  validCount: number
  errorCount: number
  importResult: { created: number; failed: number; errors: string[] } | null
  setParseResult: (result: BulkImportParseResult) => void
  setColumnMapping: Dispatch<SetStateAction<Record<number, keyof T>>>
  handleFile: (file: File) => Promise<void>
  reset: () => void
  importRows: () => Promise<void>
  goToPreview: () => void
}

export function useBulkImport<T>({ adapter }: UseBulkImportOptions<T>): UseBulkImportResult<T> {
  const [step, setStep] = useState<BulkImportStep>('upload')
  const [parseResult, setParseResult] = useState<BulkImportParseResult | null>(null)
  const [columnMapping, setColumnMapping] = useState<Record<number, keyof T>>({})
  const [importResult, setImportResult] = useState<{ created: number; failed: number; errors: string[] } | null>(null)

  const mappedRows = useMemo(() => {
    if (!parseResult) return []
    return mapAndValidateRows(parseResult.rows, parseResult.headers, columnMapping, adapter.fields)
  }, [parseResult, columnMapping, adapter.fields])

  const validCount = useMemo(() => mappedRows.filter((r) => r.valid).length, [mappedRows])
  const errorCount = useMemo(() => mappedRows.filter((r) => !r.valid).length, [mappedRows])

  const handleFile = useCallback(
    async (file: File) => {
      const result = await parseImportFile(file)
      setParseResult(result)
      const initial = adapter.inferMapping
        ? adapter.inferMapping(result.headers)
        : inferMapping(result.headers, adapter.fields)
      setColumnMapping(initial)
      setStep('map')
    },
    [adapter],
  )

  const importRows = useCallback(async () => {
    setStep('importing')
    const validRows = mappedRows.filter((r) => r.valid).map((r) => r.values)
    try {
      const result = await adapter.import(validRows)
      setImportResult({ ...result, errors: result.errors ?? [] })
      setStep('done')
    } catch (err) {
      setImportResult({ created: 0, failed: validRows.length, errors: [err instanceof Error ? err.message : String(err)] })
      setStep('done')
    }
  }, [mappedRows, adapter])

  const reset = useCallback(() => {
    setStep('upload')
    setParseResult(null)
    setColumnMapping({})
    setImportResult(null)
  }, [])

  return {
    step,
    parseResult,
    columnMapping,
    mappedRows,
    validCount,
    errorCount,
    importResult,
    setParseResult,
    setColumnMapping,
    handleFile,
    reset,
    importRows,
    goToPreview: () => setStep('preview'),
  }
}
