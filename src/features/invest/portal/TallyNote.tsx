import { Sparkles } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'

/** Tally's reaction to something the user just did on this page — the same
    words are persisted into the chat thread; this is the inline echo where
    the action happened. */
export function TallyNote({ line }: { line: string }) {
  const { x } = useI18n()
  return (
    <div className="sb-note" style={{ marginTop: 12 }}>
      <Sparkles size={15} aria-hidden="true" style={{ flexShrink: 0 }} />
      <span>
        <strong>{x(IM.invest_chat_title)}</strong> — {line}
      </span>
    </div>
  )
}
