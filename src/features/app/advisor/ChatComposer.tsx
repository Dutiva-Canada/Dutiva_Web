import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { ArrowUp } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { advisorCore as M } from '@/i18n/messages/advisorCore'

/**
 * Advisor composer — rounded input shell with the navy send button, per the
 * prototype's three sizes:
 *
 * - `home` — Advisor empty state (16px radius, 15px type, 36px send)
 * - `chat` — active conversation footer (14px radius, 14.5px type, 34px send)
 * - `rail` — contextual rail footer (11px radius, 13.5px type, 30px send)
 *
 * Enter sends (Shift+Enter for a newline); empty/whitespace input is ignored.
 */
export interface ChatComposerProps {
  readonly placeholder: string
  readonly onSend: (text: string) => void
  readonly variant?: 'home' | 'chat' | 'rail'
  /** Ignore sends while a reply is streaming (prototype `composerBusy`). */
  readonly disabled?: boolean
  /** Focus the textarea on mount (the rail focuses its composer on open). */
  readonly autoFocus?: boolean
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
}: ChatComposerProps) {
  const { x } = useI18n()
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const styles = VARIANTS[variant]

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus()
  }, [autoFocus])

  const send = () => {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className={styles.container}>
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
  )
}
