import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { memoryMessages as M } from '@/i18n/messages/memory'

/**
 * Accessible modal dialog for high-impact memory actions (remove, reject,
 * legal hold). Focuses the first control on open, traps focus within the
 * dialog, closes on Escape, and renders over a scrim. Reduced-motion safe.
 */
export interface MemoryConfirmDialogProps {
  readonly open: boolean
  readonly title: string
  readonly onClose: () => void
  readonly onConfirm: () => void
  readonly confirmLabel: string
  readonly confirmTone?: 'risk' | 'gold' | 'navy'
  readonly cancelLabel?: string
  readonly children?: React.ReactNode
  /** When set, shows a labelled text input (e.g. legal-hold reason). */
  readonly inputLabel?: string
  readonly inputValue?: string
  readonly onInputChange?: (value: string) => void
  readonly inputRequired?: boolean
}

export function MemoryConfirmDialog({
  open,
  title,
  onClose,
  onConfirm,
  confirmLabel,
  confirmTone = 'risk',
  cancelLabel,
  children,
  inputLabel,
  inputValue,
  onInputChange,
  inputRequired,
}: MemoryConfirmDialogProps) {
  const { x } = useI18n()
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      if (inputRef.current) inputRef.current.focus()
      else closeBtnRef.current?.focus()
    }, 0)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const toneClass =
    confirmTone === 'risk'
      ? 'border-risk-border bg-surface text-risk-dot hover:bg-risk-bg'
      : confirmTone === 'gold'
        ? 'border-gold-border bg-gold-bg text-gold-fg hover:brightness-95'
        : 'border-navy bg-navy text-white hover:brightness-110'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-90 flex items-center justify-center bg-black/45 p-[16px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-[460px] rounded-[14px] border border-border bg-surface-2 p-[18px] shadow-lg motion-safe:animate-[fadeIn_0.12s_ease-out]">
        <div className="mb-[10px] flex items-start justify-between gap-[10px]">
          <h2 className="m-0 font-display text-[16px] font-semibold text-text">{title}</h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label={x(M.memory_details_close)}
            className="flex min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-[8px] border-none bg-transparent text-text-muted hover:bg-inset"
          >
            <X size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
        {children != null && <div className="mb-[12px] text-[13px] leading-normal text-text-muted">{children}</div>}
        {inputLabel != null && (
          <div className="mb-[12px]">
            <label className="mb-[5px] block text-[12px] font-semibold text-text-3" htmlFor="mem-confirm-input">
              {inputLabel}
            </label>
            <input
              ref={inputRef}
              id="mem-confirm-input"
              value={inputValue ?? ''}
              onChange={(e) => onInputChange?.(e.target.value)}
              className="w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text outline-none"
            />
          </div>
        )}
        <div className="flex justify-end gap-[8px]">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-[9px] border border-border bg-surface px-[14px] py-[9px] font-sans text-[13px] font-semibold text-text-muted"
          >
            {cancelLabel ?? x(M.memory_action_cancel)}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={inputRequired === true && (inputValue ?? '').trim().length === 0}
            className={`cursor-pointer rounded-[9px] border px-[14px] py-[9px] font-sans text-[13px] font-bold disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
