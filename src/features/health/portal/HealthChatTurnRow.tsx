import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  CornerDownLeft,
  Pencil,
  RefreshCw,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react'
import { healthMessages as HM } from '@/i18n/messages/health'
import type { HealthChatTurn } from '@/features/health/data/api'
import { CopyTurnButton, ReasonChips, ReasoningBlock } from '@/components/chat/portalChat'
import { formatTurnDay, formatTurnTime } from '@/components/chat/portalChatUtils'
import { actionLabel, actionRoute, contextLine } from './healthChatUi'
import { CrisisNote } from './CrisisNote'

/* Markdown + widget-fence rendering is a lazy chunk (react-markdown,
   remark-gfm, the widget spec parser) — the bubble falls back to verbatim
   text while it loads. */
const ChatMarkdown = lazy(() =>
  import('@/components/advisor/ChatMarkdown').then((m) => ({
    default: m.ChatMarkdown,
  })),
)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * One turn in the conversation log — the optional day separator, the
 * bubble (markdown for Mira, verbatim for the user), the transparency +
 * action chips under it, and the meta row (time, reuse, thumbs, regenerate,
 * delete). Row-level handlers all live on the page; this component only
 * renders and reports.
 */
export function HealthChatTurnRow({
  t,
  showDay,
  isLastAssistant,
  x,
  lang,
  dayLabels,
  reasonChips,
  sending,
  undoing,
  deleting,
  delArmed,
  reasonFor,
  crisisDismissed,
  onRetry,
  onEditFailed,
  onReuse,
  onRate,
  onPickReason,
  onDismissReasons,
  onRegenerate,
  onUndo,
  onRemoveTurn,
  onDismissCrisis,
}: {
  t: HealthChatTurn
  showDay: boolean
  isLastAssistant: boolean
  x: (m: { en: string; fr: string }) => string
  lang: 'en' | 'fr'
  dayLabels: { today: string; yesterday: string }
  reasonChips: string[]
  sending: boolean
  undoing: string | null
  deleting: string | null
  delArmed: string | null
  reasonFor: string | null
  crisisDismissed: boolean
  onRetry: (t: HealthChatTurn) => void
  onEditFailed: (t: HealthChatTurn) => void
  onReuse: (t: HealthChatTurn) => void
  onRate: (turnId: string, rating: 1 | -1) => void
  onPickReason: (turnId: string, reason: string) => void
  onDismissReasons: () => void
  onRegenerate: () => void
  onUndo: (turnId: string) => void
  onRemoveTurn: (t: HealthChatTurn) => void
  onDismissCrisis: (turnId: string) => void
}) {
  const route = t.action?.ok ? actionRoute(t.action) : null
  const drewOn = t.role === 'assistant' && t.contextUsed ? contextLine(t.contextUsed, x, lang) : null
  return (
    <div style={{ display: 'contents' }}>
      {showDay && (
        <div className="sbchat-day" role="separator">
          <span>{formatTurnDay(t.createdAt, lang, dayLabels)}</span>
        </div>
      )}
      <div className={`sbchat-bubble ${t.role}`} data-failed={t.failed || undefined}>
        {t.role === 'assistant' && t.reasoning && (
          <ReasoningBlock
            text={t.reasoning}
            live={false}
            label={x(HM.health_chat_reasoning)}
            hint={x(HM.health_chat_reasoning_hint)}
            className="sbchat-sees sbchat-think"
            bodyClass="sbchat-think-body"
          >
            <Suspense fallback={t.reasoning}>
              <ChatMarkdown widgetSurface="health">{t.reasoning}</ChatMarkdown>
            </Suspense>
          </ReasoningBlock>
        )}
        {t.role === 'assistant' ? (
          <Suspense fallback={t.content}>
            <ChatMarkdown widgetSurface="health">{t.content}</ChatMarkdown>
          </Suspense>
        ) : (
          t.content
        )}
        {t.failed && (
          <span className="sbchat-bubble-meta">
            {x(HM.health_chat_error)}
            <button type="button" className="sbchat-retry" onClick={() => onRetry(t)}>
              <RotateCcw size={10} aria-hidden="true" /> {x(HM.health_chat_retry)}
            </button>
            {/* Edit path — Retry resends verbatim; sometimes the fix is
                changing the words. */}
            <button
              type="button"
              className="sbchat-rate-btn"
              aria-label={x(HM.health_chat_reuse)}
              title={x(HM.health_chat_reuse)}
              onClick={() => onEditFailed(t)}
            >
              <Pencil size={11} aria-hidden="true" />
            </button>
          </span>
        )}
        {/* The transparency line — what this answer could see, counts only.
            Session-only: it isn't persisted with the turn, so a reloaded
            history shows none. */}
        {drewOn && <span className="sbchat-context">{drewOn}</span>}
        {t.action && (
          <span className="sbchat-chip" data-ok={t.action.ok ? 'true' : 'false'}>
            <Check size={11} aria-hidden="true" />
            {t.action.ok ? actionLabel(t.action, x) : x(HM.health_chat_action_failed)}
            {route && (
              <Link className="sbchat-chip-link" to={route}>
                {x(HM.health_chat_view)}
              </Link>
            )}
            {t.action.ok &&
              t.action.refId &&
              UUID_RE.test(t.id) &&
              (t.action.undone ? (
                <em className="sbchat-chip-undone">{x(HM.health_chat_undone)}</em>
              ) : (
                <button
                  type="button"
                  className="sbchat-chip-undo"
                  disabled={undoing === t.id}
                  onClick={() => onUndo(t.id)}
                >
                  {x(HM.health_chat_undo)}
                </button>
              ))}
          </span>
        )}
        {!t.failed && (
          <span className="sbchat-bubble-meta">
            <time dateTime={t.createdAt}>{formatTurnTime(t.createdAt, lang)}</time>
            {t.stopped && <em className="sbchat-stopped">{x(HM.health_chat_stopped)}</em>}
            {t.role === 'user' && (
              <button
                type="button"
                className="sbchat-rate-btn"
                aria-label={x(HM.health_chat_reuse)}
                title={x(HM.health_chat_reuse)}
                onClick={() => onReuse(t)}
              >
                <CornerDownLeft size={12} aria-hidden="true" />
              </button>
            )}
            {t.role === 'assistant' && UUID_RE.test(t.id) && (
              <span className="sbchat-rate">
                <CopyTurnButton
                  text={t.content}
                  label={x(HM.health_chat_copy)}
                  className="sbchat-rate-btn"
                />
                <button
                  type="button"
                  className="sbchat-rate-btn"
                  aria-label={x(HM.health_chat_rate_up)}
                  aria-pressed={t.feedback === 1}
                  onClick={() => onRate(t.id, 1)}
                >
                  <ThumbsUp size={12} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="sbchat-rate-btn"
                  aria-label={x(HM.health_chat_rate_down)}
                  aria-pressed={t.feedback === -1}
                  onClick={() => onRate(t.id, -1)}
                >
                  <ThumbsDown size={12} aria-hidden="true" />
                </button>
                {isLastAssistant && !sending && (
                  <button
                    type="button"
                    className="sbchat-rate-btn"
                    aria-label={x(HM.health_chat_regenerate)}
                    title={x(HM.health_chat_regenerate)}
                    onClick={onRegenerate}
                  >
                    <RefreshCw size={12} aria-hidden="true" />
                  </button>
                )}
              </span>
            )}
            {/* Per-turn delete — persisted rows only, two-step like Clear
                so a stray tap can't drop a turn. */}
            {UUID_RE.test(t.id) && (
              <button
                type="button"
                className="sbchat-rate-btn"
                data-armed={delArmed === t.id || undefined}
                aria-label={
                  delArmed === t.id ? x(HM.health_chat_sure) : x(HM.health_chat_turn_delete)
                }
                title={
                  delArmed === t.id ? x(HM.health_chat_sure) : x(HM.health_chat_turn_delete)
                }
                disabled={deleting === t.id}
                onClick={() => onRemoveTurn(t)}
              >
                {delArmed === t.id ? (
                  <span>{x(HM.health_chat_sure)}</span>
                ) : (
                  <Trash2 size={12} aria-hidden="true" />
                )}
              </button>
            )}
          </span>
        )}
        {reasonFor === t.id && !t.feedbackReason && (
          <ReasonChips
            label={x(HM.health_chat_reason_label)}
            reasons={reasonChips}
            className="sbchat-reasons"
            chipClass="sbchat-reason"
            onPick={(r) => onPickReason(t.id, r)}
            dismissLabel={x(HM.health_chat_reason_dismiss)}
            onDismiss={onDismissReasons}
          />
        )}
      </div>
      {/* Distress words pin the 988 line right under the bubble — a sibling
          row, dismissible, session-only. The verbs are tappable; `more`
          deep-links the Resources page's crisis block. */}
      {t.distress && !crisisDismissed && (
        <div className="sbchat-crisis-inline" role="note">
          <span><CrisisNote more /></span>
          <button
            type="button"
            className="sbchat-crisis-x"
            aria-label={x(HM.health_chat_reason_dismiss)}
            title={x(HM.health_chat_reason_dismiss)}
            onClick={() => onDismissCrisis(t.id)}
          >
            <X size={12} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}
