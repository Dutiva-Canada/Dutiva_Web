import { useRef, useState } from 'react'
import { FileUp, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { bulkImportMessages as M } from '@/i18n/messages/bulkImport'
import { useBulkImport } from './useBulkImport'
import type { BulkImportAdapter } from './types'
import { generateTemplate } from './mapper'

interface BulkImportWizardProps<T> {
  adapter: BulkImportAdapter<T>
  onClose: () => void
}

export function BulkImportWizard<T>({ adapter, onClose }: BulkImportWizardProps<T>) {
  const { x } = useI18n()
  const {
    step,
    parseResult,
    columnMapping,
    mappedRows,
    validCount,
    errorCount,
    importResult,
    setColumnMapping,
    handleFile,
    reset,
    importRows,
    goToPreview,
  } = useBulkImport({ adapter })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDrag(false)
    const file = e.dataTransfer.files[0]
    if (file) await handleFile(file)
  }

  const downloadTemplate = () => {
    const blob = new Blob([generateTemplate(adapter.fields)], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${String(x(adapter.name)).toLowerCase().replace(/\s+/g, '-')}-template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-[16px]">
      <div className="w-full max-w-[720px] max-h-[90vh] overflow-y-auto rounded-[12px] border border-border bg-surface p-[20px] shadow-lg">
        <div className="mb-[16px] flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-text">{x(M.bulk_import_title)}</h2>
          <button type="button" onClick={onClose} className="rounded-[6px] p-[4px] text-text-muted hover:bg-inset">
            <X size={18} />
          </button>
        </div>

        {step === 'upload' && (
          <div className="flex flex-col gap-[16px]">
            <p className="text-[13px] text-text-muted">{x(M.bulk_upload_description)}</p>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => setDrag(true)}
              onDragLeave={() => setDrag(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center gap-[10px] rounded-[10px] border-2 border-dashed p-[30px] transition-colors ${
                drag ? 'border-accent bg-inset' : 'border-border'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp size={28} className="text-text-muted" />
              <span className="text-[13px] text-text-muted">{x(M.bulk_upload_drop_or_click)}</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleFile(file)
              }}
            />
            <button
              type="button"
              onClick={downloadTemplate}
              className="self-start text-[12px] font-semibold text-accent hover:underline"
            >
              {x(M.bulk_download_template)}
            </button>
          </div>
        )}

        {step === 'map' && parseResult && (
          <div className="flex flex-col gap-[16px]">
            <p className="text-[13px] text-text-muted">
              {x(M.bulk_upload_map_columns)} <span className="text-text-2">({parseResult.fileName})</span>
            </p>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="py-[8px] pr-[8px]">{x(M.bulk_file_column)}</th>
                  <th className="py-[8px]">{x(M.bulk_field)}</th>
                </tr>
              </thead>
              <tbody>
                {parseResult.headers.map((header, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="py-[8px] pr-[8px] text-text">{header}</td>
                    <td className="py-[8px]">
                      <select
                        value={String(columnMapping[index] ?? '')}
                        onChange={(e) => {
                          const value = e.target.value
                          setColumnMapping((prev) => {
                            const next = { ...prev }
                            if (value === '') {
                              delete next[index]
                            } else {
                              next[index] = value as keyof T
                            }
                            return next
                          })
                        }}
                        className="w-full rounded-[6px] border border-border bg-inset px-[8px] py-[4px]"
                      >
                        <option value="">—</option>
                        {adapter.fields.map((field) => (
                          <option key={String(field.key)} value={String(field.key)}>
                            {x(field.label)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end gap-[8px]">
              <button type="button" onClick={reset} className="rounded-[6px] border border-border bg-inset px-[12px] py-[5px] text-[12px] font-semibold text-text-2">
                {x(M.bulk_back)}
              </button>
              <button
                type="button"
                onClick={goToPreview}
                className="rounded-[6px] bg-navy px-[12px] py-[5px] text-[12px] font-semibold text-white"
              >
                {x(M.bulk_preview)}
              </button>
            </div>
          </div>
        )}

        {(step === 'preview' || step === 'importing' || step === 'done') && (
          <div className="flex flex-col gap-[16px]">
            <div className="rounded-[8px] bg-inset p-[12px]">
              <div className="text-[13px] font-semibold text-text">
                {validCount} {x(M.bulk_preview_summary_valid)} · {errorCount} {x(M.bulk_preview_summary_errors)}
              </div>
            </div>
            {errorCount > 0 && (
              <div className="max-h-[240px] overflow-y-auto rounded-[8px] border border-border p-[10px]">
                <h3 className="mb-[8px] text-[13px] font-semibold text-text">{x(M.bulk_preview_errors)}</h3>
                <ul className="m-0 flex flex-col gap-[6px] p-0">
                  {mappedRows
                    .filter((r) => !r.valid)
                    .slice(0, 20)
                    .map((r) => (
                      <li key={r.index} className="text-[12px] text-red-600">
                        {x(M.bulk_row)} {r.index + 1}: {Object.values(r.errors).join(', ')}
                      </li>
                    ))}
                </ul>
              </div>
            )}
            {step === 'done' && importResult && (
              <div className="rounded-[8px] bg-inset p-[12px] text-[13px] text-text">
                {importResult.created} {x(M.bulk_import_done_created)} · {importResult.failed} {x(M.bulk_import_done_failed)}
                {importResult.errors.length > 0 && (
                  <ul className="mt-[8px] flex flex-col gap-[4px]">
                    {importResult.errors.map((err, i) => (
                      <li key={i} className="text-[12px] text-red-600">{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="flex justify-end gap-[8px]">
              {step === 'done' ? (
                <button type="button" onClick={onClose} className="rounded-[6px] bg-navy px-[12px] py-[5px] text-[12px] font-semibold text-white">
                  {x(M.bulk_close)}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={reset}
                    disabled={step === 'importing'}
                    className="rounded-[6px] border border-border bg-inset px-[12px] py-[5px] text-[12px] font-semibold text-text-2 disabled:opacity-60"
                  >
                    {x(M.bulk_back)}
                  </button>
                  <button
                    type="button"
                    onClick={importRows}
                    disabled={step === 'importing' || validCount === 0}
                    className="rounded-[6px] bg-navy px-[12px] py-[5px] text-[12px] font-semibold text-white disabled:opacity-60"
                  >
                    {step === 'importing' ? x(M.bulk_importing) : x(M.bulk_import_action)}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
