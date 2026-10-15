import { Sparkles, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'

/** Mira's reaction to something the user just did on this page — the same
    words are persisted into the chat thread; this is the inline echo where
    the action happened. role="status" announces the async arrival; the
    dismiss clears a reaction that would otherwise sit for the session. */
export function MiraNote({ line, onDismiss }: { line: string; onDismiss?: () => void }) {
  const { x } = useI18n()
  return (
    <div className="sb-note" style={{ marginTop: 12 }} role="status">
      <Sparkles size={15} aria-hidden="true" style={{ flexShrink: 0 }} />
      <span>
        <strong>{x(HM.health_chat_title)}</strong> — {line}
      </span>
      {onDismiss && (
        <button
          type="button"
          className="hb-note-close"
          aria-label={x(HM.health_dismiss)}
          onClick={onDismiss}
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
