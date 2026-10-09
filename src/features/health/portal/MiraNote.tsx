import { Sparkles } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'

/** Mira's reaction to something the user just did on this page — the same
    words are persisted into the chat thread; this is the inline echo where
    the action happened. */
export function MiraNote({ line }: { line: string }) {
  const { x } = useI18n()
  return (
    <div className="sb-note" style={{ marginTop: 12 }}>
      <Sparkles size={15} aria-hidden="true" style={{ flexShrink: 0 }} />
      <span>
        <strong>{x(HM.health_chat_title)}</strong> — {line}
      </span>
    </div>
  )
}
