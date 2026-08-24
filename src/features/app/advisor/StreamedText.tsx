import { useI18n } from '@/i18n/context'
import { pickL } from '@/i18n/core'
import type { LText } from '@/i18n/core'
import { ChatMarkdown } from '@/components/advisor/ChatMarkdown'
import type { MemoryUsedRead } from './contract'
import { phrasesFromMemoryUsed } from './memoryHighlights'
import type { MessageStatus } from './types'

/**
 * Assistant reply text with the streaming reveal: while `status` is
 * 'streaming' it shows the first `streamedLen` characters of the localized
 * string plus the blinking caret (2×14px, `blinkCursor`); otherwise the full
 * text. Localization happens at render time, so a live language toggle
 * re-localizes mid-stream.
 *
 * The shown text is rendered as GitHub-flavored Markdown (`ChatMarkdown`), so
 * the backend's tables, lists, headings, links and code become real elements
 * rather than literal `| pipes |` and `**` markers. `streaming` suppresses a
 * half-arrived table until its separator row lands, and drives the caret —
 * `.cm-streaming` places it inline after the last block (chat-markdown.css)
 * instead of on a line of its own.
 *
 * When the turn used org memory, matching phrases are gold-underlined after
 * streaming completes (Advisor Memory chat-recall pattern).
 *
 * Only assistant text goes through here. User messages stay plain text, so
 * nothing a user types is ever parsed as Markdown.
 */
export interface StreamedTextProps {
  readonly text: LText
  readonly status?: MessageStatus
  readonly streamedLen?: number
  /** Confirmed memory injected this turn — drives gold in-answer highlights. */
  readonly memory?: MemoryUsedRead | null
}

export function StreamedText({ text, status, streamedLen, memory }: StreamedTextProps) {
  const { lang } = useI18n()
  const full = pickL(text, lang)
  const streaming = status === 'streaming'
  const shown = streaming ? full.slice(0, streamedLen ?? 0) : full
  const memoryHighlights =
    !streaming && memory != null ? phrasesFromMemoryUsed(memory, lang) : []
  return (
    <ChatMarkdown
      streaming={streaming}
      className={streaming ? 'cm-streaming' : undefined}
      memoryHighlights={memoryHighlights}
    >
      {shown}
    </ChatMarkdown>
  )
}
