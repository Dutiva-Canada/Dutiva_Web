import '@/features/invest/portal/strategies.css'
import './pr.css'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Loader2, RotateCcw, Send, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { prMessages as PM } from '@/i18n/messages/pr'
import { useAuth } from '@/features/app/auth/authContext'
import { isInternalDutivaAccount } from '@/lib/billing/adminAccess'
import { usePrData } from '@/features/pr/data/PrDataContext'
import {
  clearPrChat,
  loadPrChatHistory,
  ratePrChatTurn,
  sendPrChat,
  undoPrChatAction,
  type PrChatAction,
  type PrChatTurn,
} from '@/features/pr/data/chatApi'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { CopyTurnButton } from '@/components/chat/portalChat'
import {
  formatTurnDay,
  formatTurnTime,
  sameTurnDay,
  useAutoGrowTextarea,
  useStickToBottom,
} from '@/components/chat/portalChatUtils'
import { paigeGreeting } from './prUi'
import { usePrHead } from './usePrHead'

/* Markdown + widget-fence rendering is a lazy chunk (react-markdown,
   remark-gfm, the widget spec parser) — the bubble falls back to verbatim
   text while it loads. */
const ChatMarkdown = lazy(() =>
  import('@/components/advisor/ChatMarkdown').then((m) => ({
    default: m.ChatMarkdown,
  })),
)

/** What the assistant did during a turn, as a confirmation chip. The label
    keys mirror the action grammar in pr-ai/handlers.ts. */
function actionLabel(
  action: PrChatAction,
  x: (m: { en: string; fr: string }) => string,
): string {
  const name = action.detail
  switch (action.type) {
    case 'add_campaign':
      return x(PM.pr_chat_did_campaign).replace('{name}', name)
    case 'add_content_item':
      return x(PM.pr_chat_did_content).replace('{name}', name)
    case 'add_media_contact':
      return x(PM.pr_chat_did_contact).replace('{name}', name)
    case 'add_mention':
      return x(PM.pr_chat_did_mention).replace('{name}', name)
    case 'add_keyword':
      return x(PM.pr_chat_did_keyword).replace('{name}', name)
    case 'add_geo_prompt':
      return x(PM.pr_chat_did_geo).replace('{name}', name)
    case 'update_campaign_status':
      return x(PM.pr_chat_did_campstatus).replace('{name}', name)
    default:
      return ''
  }
}

/** The portal page the action's write lands on — the chip's "View" link. */
function actionRoute(action: PrChatAction): string | null {
  switch (action.type) {
    case 'add_campaign':
    case 'update_campaign_status':
      return '/pr/campaigns'
    case 'add_content_item':
      return '/pr/content'
    case 'add_media_contact':
      return '/pr/media'
    case 'add_mention':
    case 'add_keyword':
      return '/pr/mentions'
    case 'add_geo_prompt':
      return '/pr/answers'
    default:
      return null
  }
}

const HISTORY_PAGE = 40
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/* Show the running count only once the 1200-char cap is in sight. */
const COUNT_FROM = 1000

/**
 * Paige — the desk's press specialist. A chat over the user's own PR data
 * that can also record what they ask for: a draft campaign, a content item,
 * a media contact, a logged mention, a keyword or GEO prompt to track.
 * Everything she writes lands as a draft or a log row — she never sends or
 * publishes. History persists server-side (pr_chat_messages); actions
 * refresh the shared PrDataContext so every other tab reflects them
 * immediately.
 */
export function PrChatPage() {
  const { x, lang } = useI18n()
  const { session } = useAuth()
  const { state, refresh } = usePrData()
  const { showToast } = useToasts()
  usePrHead(PM.pr_seo_title_chat, PM.pr_seo_desc_chat)

  const [turns, setTurns] = useState<PrChatTurn[] | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [streamed, setStreamed] = useState('')
  const [undoing, setUndoing] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  /* Stick-to-bottom follows new turns + streamed deltas; scrolling up to
     read history releases it. */
  const { logRef, stickToBottom, capturePrepend } = useStickToBottom([
    turns,
    sending,
    streamed,
  ])
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  useAutoGrowTextarea(inputRef, draft)

  const isInternal = isInternalDutivaAccount(session?.user?.email)

  useEffect(() => {
    loadPrChatHistory(HISTORY_PAGE)
      .then((rows) => {
        setTurns(rows)
        /* A full page back means older turns probably exist. */
        setHasMore(rows.length === HISTORY_PAGE)
      })
      .catch(() => setTurns([]))
  }, [])

  /* Older page — the server takes the oldest loaded turn's created_at as the
     cursor; capturePrepend keeps the viewport on the same message. */
  const loadEarlier = async () => {
    const oldest = turns?.[0]?.createdAt
    if (!oldest || loadingMore) return
    setLoadingMore(true)
    try {
      const rows = await loadPrChatHistory(HISTORY_PAGE, oldest)
      capturePrepend()
      setTurns((prev) => [...rows, ...(prev ?? [])])
      setHasMore(rows.length === HISTORY_PAGE)
    } catch {
      showToast(PM.pr_chat_error)
    } finally {
      setLoadingMore(false)
    }
  }

  const sendText = async (message: string) => {
    if (!message || sending) return
    setSending(true)
    setStreamed('')
    /* Optimistic user turn — your message should appear the moment you send,
       not after the reply round-trips. Sending always returns to the end of
       the log even if the reader had scrolled up. */
    const userTurn: PrChatTurn = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: message,
      action: null,
      feedback: null,
      createdAt: new Date().toISOString(),
    }
    stickToBottom()
    setTurns((prev) => [...(prev ?? []), userTurn])
    try {
      /* onDelta turns on SSE — the reply types into the pending bubble as
         it generates; the final payload stays authoritative. */
      const { reply, action, assistantId } = await sendPrChat(message, lang, setStreamed)
      setTurns((prev) => [
        ...(prev ?? []),
        {
          /* The persisted row id when the insert landed — rating needs it. */
          id: assistantId ?? `a-${Date.now()}`,
          role: 'assistant',
          content: reply,
          action,
          feedback: null,
          createdAt: new Date().toISOString(),
        },
      ])
      /* The action already wrote to the pr_* tables — refresh the shared
         state so Campaigns/Content/Media/SEO/Answers reflect it. */
      if (action?.ok) await refresh()
    } catch {
      showToast(PM.pr_chat_error)
      /* Keep the turn in the log flagged failed — the text stays visible
         and a Retry affordance resends it in place. */
      setTurns((prev) =>
        (prev ?? []).map((t) => (t.id === userTurn.id ? { ...t, failed: true } : t)),
      )
    } finally {
      setSending(false)
      setStreamed('')
    }
  }

  const send = () => {
    const message = draft.trim()
    if (!message || sending) return
    setDraft('')
    void sendText(message)
  }

  /* A failed turn disappears and its text goes back through sendText —
     same pipe as a fresh send. */
  const retry = (turn: PrChatTurn) => {
    if (sending) return
    setTurns((prev) => (prev ?? []).filter((t) => t.id !== turn.id))
    void sendText(turn.content)
  }

  /* Undo on an action chip — the server deletes the row the action created
     and marks it undone, so the chip doesn't offer it again after a reload. */
  const undo = async (turnId: string) => {
    if (undoing) return
    setUndoing(turnId)
    try {
      await undoPrChatAction(turnId)
      setTurns((prev) =>
        (prev ?? []).map((t) =>
          t.id === turnId && t.action ? { ...t, action: { ...t.action, undone: true } } : t,
        ),
      )
      await refresh()
    } catch {
      showToast(PM.pr_chat_undo_failed)
    } finally {
      setUndoing(null)
    }
  }

  const clear = async () => {
    if (clearing) return
    setClearing(true)
    try {
      await clearPrChat()
      setTurns([])
      setHasMore(false)
    } catch {
      showToast(PM.pr_chat_error)
    } finally {
      setClearing(false)
    }
  }

  /* Thumbs on an assistant turn — only real rows (uuid ids) can hold a
     rating; optimistic, reverted if the write fails. */
  const rate = async (turnId: string, rating: 1 | -1) => {
    const before = turns?.find((t) => t.id === turnId)?.feedback ?? null
    const next = before === rating ? 0 : rating
    setTurns((prev) =>
      (prev ?? []).map((t) => (t.id === turnId ? { ...t, feedback: next || null } : t)),
    )
    try {
      await ratePrChatTurn(turnId, next)
    } catch {
      setTurns((prev) =>
        (prev ?? []).map((t) => (t.id === turnId ? { ...t, feedback: before } : t)),
      )
    }
  }

  /* Empty-state starters — the third slot differs by tier so staff see an
     advice-shaped ask instead of a teaching one. */
  const starters = [
    x(PM.pr_chat_starter_1),
    x(PM.pr_chat_starter_2),
    x(isInternal ? PM.pr_chat_starter_int : PM.pr_chat_starter_ext),
  ]

  return (
    <div className="sb prx sb-page">
      <div className="sb-head-row">
        <h1>{x(PM.pr_chat_title)}</h1>
        {turns !== null && turns.length > 0 && (
          <button
            type="button"
            className="sb-btn sb-btn-sm sb-btn-secondary"
            onClick={() => void clear()}
            disabled={clearing}
          >
            <Trash2 size={13} aria-hidden="true" />
            {x(PM.pr_chat_clear)}
          </button>
        )}
      </div>
      {/* Internal-staff tier — the edge function advises @dutiva.ca accounts
          directly, so the desk-specialist subtitle is joined by a badge that
          makes the active register scannable. */}
      <p className="sb-sub">
        {x(isInternal ? PM.pr_chat_sub_internal : PM.pr_chat_sub)}
        {isInternal && <span className="sbchat-tier">{x(PM.pr_chat_internal_badge)}</span>}
      </p>

      <section className="sb-card sb-card-pad sbchat" style={{ marginTop: 14 }}>
        <div
          className="sbchat-log"
          ref={logRef}
          aria-live="polite"
          aria-busy={turns === null || sending}
        >
          {hasMore && (
            <button
              type="button"
              className="sbchat-more"
              onClick={() => void loadEarlier()}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <Loader2 size={12} className="animate-spin" aria-hidden="true" />
              ) : (
                x(PM.pr_chat_load_earlier)
              )}
            </button>
          )}
          {turns === null ? (
            <>
              <div className="sbchat-bubble assistant sbchat-ghost sbchat-g-a" aria-hidden="true" />
              <div className="sbchat-bubble user sbchat-ghost sbchat-g-b" aria-hidden="true" />
            </>
          ) : turns.length === 0 ? (
            /* She speaks first — a greeting built locally from PrState, not
               a stored turn, so clearing history brings it back. The chips
               are tappable sends — they teach the surface without typing. */
            <>
              <div className="sbchat-bubble assistant">{paigeGreeting(state, lang)}</div>
              <div className="sbchat-starters">
                {starters.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="sbchat-starter"
                    onClick={() => void sendText(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          ) : (
            turns.map((t, i) => {
              const prev = i > 0 ? turns[i - 1] : undefined
              const showDay = !prev || !sameTurnDay(prev.createdAt, t.createdAt)
              const route = t.action?.ok ? actionRoute(t.action) : null
              return (
                <div key={t.id} style={{ display: 'contents' }}>
                  {showDay && (
                    <div className="sbchat-day" role="separator">
                      <span>{formatTurnDay(t.createdAt, lang)}</span>
                    </div>
                  )}
                  <div className={`sbchat-bubble ${t.role}`} data-failed={t.failed || undefined}>
                    {t.role === 'assistant' ? (
                      <Suspense fallback={t.content}>
                        <ChatMarkdown widgetSurface="pr">{t.content}</ChatMarkdown>
                      </Suspense>
                    ) : (
                      t.content
                    )}
                    {t.failed && (
                      <span className="sbchat-bubble-meta">
                        {x(PM.pr_chat_error)}
                        <button
                          type="button"
                          className="sbchat-retry"
                          onClick={() => retry(t)}
                        >
                          <RotateCcw size={10} aria-hidden="true" /> {x(PM.pr_chat_retry)}
                        </button>
                      </span>
                    )}
                    {t.action && (
                      <span className="sbchat-chip" data-ok={t.action.ok ? 'true' : 'false'}>
                        <Check size={11} aria-hidden="true" />
                        {t.action.ok ? actionLabel(t.action, x) : x(PM.pr_chat_action_failed)}
                        {route && (
                          <Link className="sbchat-chip-link" to={route}>
                            {x(PM.pr_chat_view)}
                          </Link>
                        )}
                        {t.action.ok &&
                          t.action.refId &&
                          UUID_RE.test(t.id) &&
                          (t.action.undone ? (
                            <em className="sbchat-chip-undone">{x(PM.pr_chat_undone)}</em>
                          ) : (
                            <button
                              type="button"
                              className="sbchat-chip-undo"
                              disabled={undoing === t.id}
                              onClick={() => void undo(t.id)}
                            >
                              {x(PM.pr_chat_undo)}
                            </button>
                          ))}
                      </span>
                    )}
                    {!t.failed && (
                      <span className="sbchat-bubble-meta">
                        <time>{formatTurnTime(t.createdAt, lang)}</time>
                        {t.role === 'assistant' && UUID_RE.test(t.id) && (
                          <span className="sbchat-rate">
                            <CopyTurnButton
                              text={t.content}
                              label={x(PM.pr_chat_copy)}
                              className="sbchat-rate-btn"
                            />
                            <button
                              type="button"
                              className="sbchat-rate-btn"
                              aria-label={x(PM.pr_chat_rate_up)}
                              aria-pressed={t.feedback === 1}
                              onClick={() => void rate(t.id, 1)}
                            >
                              <ThumbsUp size={12} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="sbchat-rate-btn"
                              aria-label={x(PM.pr_chat_rate_down)}
                              aria-pressed={t.feedback === -1}
                              onClick={() => void rate(t.id, -1)}
                            >
                              <ThumbsDown size={12} aria-hidden="true" />
                            </button>
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
          {sending && (
            <div className="sbchat-bubble assistant">
              {streamed ? (
                <Suspense fallback={streamed}>
                  <ChatMarkdown widgetSurface="pr" streaming>
                    {streamed}
                  </ChatMarkdown>
                </Suspense>
              ) : (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              )}
            </div>
          )}
        </div>

        <div className="sbchat-compose">
          <textarea
            ref={inputRef}
            className="sbchat-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder={x(PM.pr_chat_placeholder)}
            maxLength={1200}
            rows={1}
            aria-label={x(PM.pr_chat_placeholder)}
          />
          <button
            type="button"
            className="sbchat-send"
            onClick={send}
            disabled={sending || !draft.trim()}
            aria-label={x(PM.pr_chat_send)}
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="sbchat-compose-meta">
          <span>{x(PM.pr_chat_enter_hint)}</span>
          {draft.length > COUNT_FROM && <span>{draft.length}/1200</span>}
        </div>
      </section>
    </div>
  )
}
