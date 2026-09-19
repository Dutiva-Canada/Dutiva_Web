import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { ArrowUp, FileText, Image as ImageIcon, Paperclip, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { advisorCore as M } from '@/i18n/messages/advisorCore'
import { ATTACHMENT_ACCEPT, MAX_ATTACHMENTS, attachmentFromFile } from './attachments'
import type { AdvisorAttachment, AttachmentIssue } from './attachments'
import { AttachmentError } from './attachments'

/**
 * Advisor composer — rounded input shell with the navy send button, per the
 * prototype's three sizes:
 *
 * - `home` — Advisor empty state (16px radius, 15px type, 36px send)
 * - `chat` — active conversation footer (14px radius, 14.5px type, 34px send)
 * - `rail` — contextual rail footer (11px radius, 13.5px type, 30px send)
 *
 * Enter sends (Shift+Enter for a newline); empty/whitespace input is ignored.
 *
 * `enableAttachments` adds a paperclip + pending-file chips: images ride to
 * a vision-capable route as `image_url` parts, documents go as text the
 * browser extracted (`./attachments.ts`). Refusals surface through
 * `onAttachmentIssue` so the caller decides how to say it.
 */
export interface ChatComposerProps {
  readonly placeholder: string
  readonly onSend: (text: string, attachments?: AdvisorAttachment[]) => void
  readonly variant?: 'home' | 'chat' | 'rail'
  /** Ignore sends while a reply is streaming (prototype `composerBusy`). */
  readonly disabled?: boolean
  /** Focus the textarea on mount (the rail focuses its composer on open). */
  readonly autoFocus?: boolean
  /** Show the attach button and pending-file chips. */
  readonly enableAttachments?: boolean
  /** A file was refused (type/size/extraction) — for toast surfacing. */
  readonly onAttachmentIssue?: (issue: AttachmentIssue, fileName: string) => void
}

interface VariantStyle {
  container: string
  textarea: string
  button: string
  icon: number
}

const VARIANTS: Record<'home' | 'chat' | 'rail', VariantStyle> = {
  home: {
    container:
      'flex items-end gap-[10px] rounded-[16px] border border-border bg-surface p-[8px] pl-[18px] shadow-float',
    textarea: 'max-h-[140px] py-[9px] text-[15px]',
    button: 'h-[36px] w-[36px] rounded-[10px]',
    icon: 15,
  },
  chat: {
    container:
      'flex items-end gap-[10px] rounded-[14px] border border-border bg-surface p-[8px] pl-[16px]',
    textarea: 'max-h-[140px] py-[8px] text-[14.5px]',
    button: 'h-[34px] w-[34px] rounded-[9px]',
    icon: 15,
  },
  rail: {
    container:
      'flex items-end gap-[8px] rounded-[11px] border border-border bg-bg p-[7px] pl-[13px]',
    textarea: 'max-h-[100px] py-[6px] text-[13.5px]',
    button: 'h-[30px] w-[30px] rounded-[8px]',
    icon: 13,
  },
}

export function ChatComposer({
  placeholder,
  onSend,
  variant = 'chat',
  disabled = false,
  autoFocus = false,
  enableAttachments = false,
  onAttachmentIssue,
}: ChatComposerProps) {
  const { x } = useI18n()
  const [value, setValue] = useState('')
  const [pending, setPending] = useState<AdvisorAttachment[]>([])
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const styles = VARIANTS[variant]

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus()
  }, [autoFocus])

  const attachFiles = (files: FileList | null) => {
    if (!files) return
    for (const file of Array.from(files)) {
      if (pending.length >= MAX_ATTACHMENTS) {
        onAttachmentIssue?.('too_many', file.name)
        break
      }
      void attachmentFromFile(file)
        .then((attachment) =>
          setPending((prev) =>
            prev.length >= MAX_ATTACHMENTS ? prev : [...prev, attachment],
          ),
        )
        .catch((error: unknown) =>
          onAttachmentIssue?.(
            error instanceof AttachmentError ? error.issue : 'read_failed',
            file.name,
          ),
        )
    }
  }

  const send = () => {
    const text = value.trim()
    if ((!text && pending.length === 0) || disabled) return
    onSend(text, pending.length > 0 ? pending : undefined)
    setValue('')
    setPending([])
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div>
      {enableAttachments && pending.length > 0 && (
        <div className="mb-[6px] flex flex-wrap gap-[6px] px-[4px]">
          {pending.map((a) => (
            <span
              key={a.id}
              className="flex items-center gap-[6px] rounded-[8px] border border-border bg-surface px-[9px] py-[5px] text-[12px] font-semibold text-text-2"
            >
              {a.kind === 'image' ? (
                <ImageIcon size={12} strokeWidth={1.9} aria-hidden="true" />
              ) : (
                <FileText size={12} strokeWidth={1.9} aria-hidden="true" />
              )}
              <span className="max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap">
                {a.name}
              </span>
              {a.truncated ? (
                <span className="text-[10.5px] font-medium text-text-faint">
                  {x(M.advisor_attach_truncated)}
                </span>
              ) : null}
              <button
                type="button"
                aria-label={`${x(M.advisor_attach_remove)} ${a.name}`}
                onClick={() => setPending((prev) => prev.filter((p) => p.id !== a.id))}
                className="cursor-pointer border-none bg-transparent p-0 text-text-faint hover:text-text-muted"
              >
                <X size={12} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className={styles.container}>
        {enableAttachments && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ATTACHMENT_ACCEPT}
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
              onChange={(e) => {
                attachFiles(e.target.files)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              aria-label={x(M.advisor_attach)}
              onClick={() => fileInputRef.current?.click()}
              className={`flex shrink-0 cursor-pointer items-center justify-center self-end rounded-[9px] border-none bg-transparent text-text-faint hover:bg-inset hover:text-text-muted ${styles.button}`}
            >
              <Paperclip size={styles.icon} strokeWidth={1.9} aria-hidden="true" />
            </button>
          </>
        )}
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={`flex-1 resize-none border-none bg-transparent font-sans leading-normal text-text outline-none ${styles.textarea}`}
        />
        <button
          type="button"
          onClick={send}
          aria-label={x(M.advisor_send)}
          className={`flex shrink-0 cursor-pointer items-center justify-center border-none bg-navy ${styles.button}`}
        >
          <ArrowUp size={styles.icon} strokeWidth={2.2} className="text-white" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
