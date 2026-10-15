import { lazy, Suspense, type RefObject } from 'react'
import { Loader2, Send, Square } from 'lucide-react'
import { healthMessages as HM } from '@/i18n/messages/health'
import { ReasoningBlock } from '@/components/chat/portalChat'

/* Markdown + widget-fence rendering is a lazy chunk (react-markdown,
   remark-gfm, the widget spec parser) — the bubble falls back to verbatim
   text while it loads. */
const ChatMarkdown = lazy(() =>
  import('@/components/advisor/ChatMarkdown').then((m) => ({
    default: m.ChatMarkdown,
  })),
)

/* Show the running count only once the 1200-char cap is in sight. */
const COUNT_FROM = 1000

/**
 * The in-flight assistant turn inside the log — streamed reasoning fills
 * the thinking panel first, then the reply types in. The Stop pill aborts
 * the stream; whatever arrived is kept as a flagged partial turn.
 */
export function HealthChatPendingBubble({
  streamed,
  streamedReasoning,
  x,
  onStop,
}: {
  streamed: string
  streamedReasoning: string
  x: (m: { en: string; fr: string }) => string
  onStop: () => void
}) {
  return (
    <div className="sbchat-bubble assistant">
      {streamedReasoning && (
        <ReasoningBlock
          text={streamedReasoning}
          live
          label={x(HM.health_chat_reasoning)}
          hint={x(HM.health_chat_reasoning_hint)}
          className="sbchat-sees sbchat-think"
          bodyClass="sbchat-think-body"
        >
          <Suspense fallback={streamedReasoning}>
            <ChatMarkdown widgetSurface="health" streaming>
              {streamedReasoning}
            </ChatMarkdown>
          </Suspense>
        </ReasoningBlock>
      )}
      {streamed ? (
        <Suspense fallback={streamed}>
          <ChatMarkdown widgetSurface="health" streaming>
            {streamed}
          </ChatMarkdown>
        </Suspense>
      ) : streamedReasoning ? null : (
        <span className="sbchat-typing">
          <Loader2 size={12} className="animate-spin" aria-hidden="true" />
          {x(HM.health_chat_typing)}
        </span>
      )}
      <span className="sbchat-bubble-meta">
        <button
          type="button"
          className="sbchat-rate-btn sbchat-stop"
          aria-label={x(HM.health_chat_stop)}
          title={x(HM.health_chat_stop)}
          onClick={onStop}
        >
          <Square size={11} aria-hidden="true" />
          {x(HM.health_chat_stop)}
        </button>
      </span>
    </div>
  )
}

/**
 * The composer — textarea + send + the Enter hint and the standing crisis
 * note. Enter sends, Shift+Enter newline, an open IME composition never
 * sends. `ready` gates the send until the history fetch resolves.
 */
export function HealthChatComposer({
  inputRef,
  draft,
  onDraft,
  onSend,
  disabled,
  x,
}: {
  inputRef: RefObject<HTMLTextAreaElement | null>
  draft: string
  onDraft: (v: string) => void
  onSend: () => void
  disabled: boolean
  x: (m: { en: string; fr: string }) => string
}) {
  return (
    <>
      <div className="sbchat-compose">
        <textarea
          ref={inputRef}
          className="sbchat-input"
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          onKeyDown={(e) => {
            /* isComposing — an IME candidate confirmation Enter must not
               send the half-composed line. */
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              onSend()
            }
          }}
          placeholder={x(HM.health_chat_placeholder)}
          maxLength={1200}
          rows={1}
          aria-label={x(HM.health_chat_input_label)}
        />
        <button
          type="button"
          className="sbchat-send"
          onClick={onSend}
          disabled={disabled}
          aria-label={x(HM.health_chat_send)}
        >
          <Send size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="sbchat-compose-meta">
        <span className="sbchat-hint">{x(HM.health_chat_enter_hint)}</span>
        {draft.length > COUNT_FROM && <span>{draft.length}/1200</span>}
      </div>
      <p className="sbchat-note">{x(HM.health_crisis_note)}</p>
    </>
  )
}
