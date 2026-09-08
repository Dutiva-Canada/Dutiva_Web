import { useCallback, useRef, useState } from 'react'
import { FileText, Loader2, Upload, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { careersMessages as M } from '@/i18n/messages/careers'
import { extractTextFromFile, ResumeExtractionError } from './resumeExtraction'

type UploadState = 'idle' | 'reading' | 'done' | 'error'

interface CoverLetterUploadProps {
  value: string
  onChange: (value: string) => void
}

function errorMessageForReason(reason: 'unsupported_type' | 'empty_file' | 'too_large' | 'corrupt' | 'read_failed') {
  switch (reason) {
    case 'unsupported_type':
      return M.careers_file_error_unsupported_type
    case 'empty_file':
      return M.careers_file_error_empty_file
    case 'too_large':
      return M.careers_file_error_too_large
    case 'corrupt':
      return M.careers_file_error_corrupt
    case 'read_failed':
      return M.careers_file_error_read_failed
    default:
      return M.careers_file_error_generic
  }
}

export function CoverLetterUpload({ value, onChange }: CoverLetterUploadProps) {
  const { x } = useI18n()
  const [state, setState] = useState<UploadState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      setState('reading')
      setError(null)
      setFileName(file.name)

      try {
        const text = await extractTextFromFile(file)
        onChange(value ? `${value}\n\n${text}` : text)
        setState('done')
      } catch (err) {
        setState('error')
        if (err instanceof ResumeExtractionError) {
          setError(x(errorMessageForReason(err.reason)))
        } else if (err instanceof Error) {
          setError(err.message)
        } else {
          setError(x(M.careers_file_error_generic))
        }
      }
    },
    [onChange, value, x],
  )

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) void handleFile(file)
    },
    [handleFile],
  )

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      const file = e.dataTransfer.files?.[0]
      if (file) void handleFile(file)
    },
    [handleFile],
  )

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const clear = useCallback(() => {
    setFileName(null)
    setError(null)
    setState('idle')
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  return (
    <div className="flex flex-col gap-[12px]">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={onInputChange}
        className="sr-only"
        id="cp-cover-letter-upload"
        aria-label={x(M.careers_apply_cover_letter_upload_label)}
      />

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-[8px] rounded-[10px] border border-dashed border-border bg-bg px-[20px] py-[24px] transition-[border-color,background-color] duration-150 hover:border-navy hover:bg-inset"
      >
        {state === 'reading' ? (
          <Loader2 size={24} className="animate-spin text-text-muted" aria-hidden="true" />
        ) : (
          <Upload size={24} className="text-text-muted" aria-hidden="true" />
        )}
        <span className="text-[13px] font-semibold text-text">
          {state === 'reading'
            ? x(M.careers_apply_cover_letter_upload_processing)
            : x(M.careers_apply_cover_letter_upload_prompt)}
        </span>
        <span className="text-[12px] text-text-muted">{x(M.careers_apply_cover_letter_upload_hint)}</span>
      </div>

      {(fileName || state === 'error') && (
        <div className="flex items-center justify-between gap-[12px] rounded-[8px] border border-border bg-surface px-[12px] py-[10px]">
          <div className="flex min-w-0 items-center gap-[8px]">
            <FileText size={16} className="shrink-0 text-text-muted" aria-hidden="true" />
            <span className="min-w-0 truncate text-[13px] text-text">
              {state === 'error' ? x(M.careers_apply_cover_letter_upload_failed) : fileName}
            </span>
          </div>
          <button
            type="button"
            onClick={clear}
            className="shrink-0 rounded-[6px] p-[4px] text-text-muted transition-opacity hover:opacity-70"
            aria-label={x(M.careers_apply_cover_letter_upload_clear)}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {error && <p className="m-0 text-[12.5px] text-risk-fg">{error}</p>}

      <p className="m-0 text-[12px] text-text-muted">{x(M.careers_apply_cover_letter_upload_disclaimer)}</p>
    </div>
  )
}
