import './strategies.css'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  Loader2,
  Pencil,
  RefreshCw,
  RotateCcw,
  Send,
  Square,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import { useAuth } from '@/features/app/auth/authContext'
import { isInternalDutivaAccount } from '@/lib/billing/adminAccess'
import { useInvestData } from '@/features/invest/data/InvestDataContext'
import {
  clearInvestChat,
  listInvestChatThreads,
  loadInvestChatHistory,
  newInvestChatThread,
  rateInvestChatTurn,
  regenerateInvestChat,
  sendInvestChat,
  undoInvestChatAction,
  type InvestChatAction,
  type InvestChatThread,
  type InvestChatTurn,
} from '@/features/invest/data/chatApi'
import { useToasts } from '@/features/app/toasts/toastsContext'
import {
  ChipRow,
  CopyTurnButton,
  JumpToLatest,
  ReasonChips,
  ThreadSwitcher,
} from '@/components/chat/portalChat'
import {
  formatTurnDay,
  formatTurnTime,
  sameTurnDay,
  useAutoGrowTextarea,
  usePortalChatDraft,
  useStickToBottom,
} from '@/components/chat/portalChatUtils'
import { tallyGreeting } from './strategyUi'
import { useInvestHead } from './useInvestHead'

/* Markdown + widget-fence rendering is a lazy chunk (react-markdown,
   remark-gfm, the widget spec parser) — the bubble falls back to verbatim
   text while it loads. */
const ChatMarkdown = lazy(() =>
  import('@/components/advisor/ChatMarkdown').then((m) => ({
    default: m.ChatMarkdown,
  })),
)

/** What the assistant did during a turn, as a confirmation chip. The label
    keys mirror the action grammar in invest-ai/handlers.ts. */
function actionLabel(
  action: InvestChatAction,
  x: (m: { en: string; fr: string }) => string,
): string {
  const name = action.detail
  switch (action.type) {
    case 'add_watch_symbol':
      return x(IM.invest_chat_did_watch).replace('{name}', name)
    case 'remove_watch_symbol':
      return x(IM.invest_chat_did_unwatch).replace('{name}', name)
    case 'create_order':
      return x(IM.invest_chat_did_order).replace('{name}', name)
    case 'update_signal':
      return x(IM.invest_chat_did_signal).replace('{name}', name)
    case 'draft_strategy':
      return x(IM.invest_chat_did_strategy).replace('{name}', name)
    case 'add_position':
      return x(IM.invest_chat_did_position).replace('{name}', name)
    default:
      return ''
  }
}

/** The portal page the action's write lands on — the chip's "View" link. */
function actionRoute(action: InvestChatAction): string | null {
  switch (action.type) {
    case 'create_order':
      return '/invest/orders'
    case 'add_watch_symbol':
    case 'remove_watch_symbol':
    case 'add_position':
      return '/invest/portfolio'
    case 'update_signal':
      return '/invest/signals'
    case 'draft_strategy':
      return '/invest/strategies'
    default:
      return null
  }
}

const HISTORY_PAGE = 40
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/* Show the running count only once the 1200-char cap is in sight. */
const COUNT_FROM = 1000

/** True when a failed send was the reader's own stop — an aborted stream
    keeps its partial text instead of flagging the turn failed. */
function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

/**
 * Tally — the book's watch clerk. A chat over the user's own portfolio rows
 * that can also act: watch/unwatch a symbol, queue a draft order, update a
 * signal's status, or file a strategy draft for review. Orders land
 * 'queued' — the only fill path stays the manual execute action. History
 * persists server-side (invest_chat_messages); actions refresh the shared
 * InvestDataContext so every other tab reflects them immediately.
 */
export function InvestChatPage() {
  const { x, lang } = useI18n()
  const { session } = useAuth()
  const { state, refresh } = useInvestData()
  const { showToast } = useToasts()
  useInvestHead(IM.invest_seo_title_chat, IM.invest_seo_desc_chat)

  const [turns, setTurns] = useState<InvestChatTurn[] | null>(null)
  const [sending, setSending] = useState(false)
  const [streamed, setStreamed] = useState('')
  const [undoing, setUndoing] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  /* Follow-up chips from the latest reply — ephemeral, cleared on send. */
  const [suggests, setSuggests] = useState<string[]>([])
  /* Named conversations — null threadId is the default ("main") one. */
  const [threads, setThreads] = useState<InvestChatThread[] | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  /* Turn id whose downvote is waiting on a reason chip pick. */
  const [reasonFor, setReasonFor] = useState<string | null>(null)
  /* The running send's abort handle — the Stop pill cancels the stream. */
  const abortRef = useRef<AbortController | null>(null)
  const [draft, setDraft] = usePortalChatDraft(`dutiva:invest-chat:${threadId ?? 'main'}`)
  /* Stick-to-bottom follows new turns + streamed deltas; scrolling up to
     read history releases it (farUp then drives the jump pill). */
  const { logRef, stickToBottom, capturePrepend, farUp, hasNew } = useStickToBottom([
    turns,
    sending,
    streamed,
  ])
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  useAutoGrowTextarea(inputRef, draft)

  const isInternal = isInternalDutivaAccount(session?.user?.email)

  /* History reloads whenever the thread changes — skeleton shows while the
     scoped page loads. The thread list loads once. */
  useEffect(() => {
    setTurns(null)
    setSuggests([])
    loadInvestChatHistory(HISTORY_PAGE, undefined, threadId)
      .then((rows) => {
        setTurns(rows)
        /* A full page back means older turns probably exist. */
        setHasMore(rows.length === HISTORY_PAGE)
      })
      .catch(() => setTurns([]))
  }, [threadId])

  useEffect(() => {
    listInvestChatThreads()
      .then(setThreads)
      .catch(() => setThreads([]))
  }, [])

  /* While the tab sits open, pick up turns another writer added — the
     scheduled invest-bot insight lands in the default conversation without
     a send. Append-only merge on row ids; a poll never reorders or drops
     local turns. */
  useEffect(() => {
    const poll = async () => {
      if (document.hidden || sending) return
      try {
        const rows = await loadInvestChatHistory(20, undefined, threadId)
        setTurns((prev) => {
          if (!prev) return prev
          const seen = new Set(prev.map((t) => t.id))
          const fresh = rows.filter((r) => !seen.has(r.id))
          return fresh.length ? [...prev, ...fresh] : prev
        })
      } catch {
        /* The poll is best-effort — a miss just means next tick. */
      }
    }
    const t = setInterval(() => void poll(), 45_000)
    return () => clearInterval(t)
  }, [sending, threadId])

  /* Older page — the server takes the oldest loaded turn's created_at as the
     cursor; capturePrepend keeps the viewport on the same message. */
  const loadEarlier = async () => {
    const oldest = turns?.[0]?.createdAt
    if (!oldest || loadingMore) return
    setLoadingMore(true)
    try {
      const rows = await loadInvestChatHistory(HISTORY_PAGE, oldest, threadId)
      capturePrepend()
      setTurns((prev) => [...rows, ...(prev ?? [])])
      setHasMore(rows.length === HISTORY_PAGE)
    } catch {
      showToast(IM.invest_chat_error)
    } finally {
      setLoadingMore(false)
    }
  }

  /* Shared tail of send + regenerate — appends the assistant turn, adopts
     its suggestions, and refreshes a named thread's freshly-set title. */
  const adoptReply = (result: {
    reply: string
    action: InvestChatAction | null
    assistantId: string | null
    suggests: string[]
  }) => {
    setTurns((prev) => [
      ...(prev ?? []),
      {
        /* The persisted row id when the insert landed — rating needs it. */
        id: result.assistantId ?? `a-${Date.now()}`,
        role: 'assistant',
        content: result.reply,
        action: result.action,
        feedback: null,
        createdAt: new Date().toISOString(),
      },
    ])
    setSuggests(result.suggests)
    if (threadId) {
      void listInvestChatThreads()
        .then(setThreads)
        .catch(() => {})
    }
    return result.action?.ok ? refresh() : Promise.resolve()
  }

  const sendText = async (message: string) => {
    if (!message || sending) return
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setSending(true)
    setStreamed('')
    setSuggests([])
    setReasonFor(null)
    /* Optimistic user turn — your message should appear the moment you send,
       not after the reply round-trips. Sending always returns to the end of
       the log even if the reader had scrolled up. */
    const userTurn: InvestChatTurn = {
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
      const result = await sendInvestChat(message, lang, setStreamed, {
        threadId,
        signal: ctrl.signal,
      })
      await adoptReply(result)
    } catch (err) {
      if (isAbort(err) || ctrl.signal.aborted) {
        /* Stop pressed — keep whatever streamed in as a local turn (the
           server may still persist the full reply; reload reconciles). */
        setStreamed((partial) => {
          if (partial) {
            setTurns((prev) => [
              ...(prev ?? []),
              {
                id: `a-${Date.now()}`,
                role: 'assistant' as const,
                content: partial,
                action: null,
                feedback: null,
                createdAt: new Date().toISOString(),
              },
            ])
          }
          return ''
        })
      } else {
        showToast(IM.invest_chat_error)
        /* Keep the turn in the log flagged failed — the text stays visible
           and a Retry affordance resends it in place. */
        setTurns((prev) =>
          (prev ?? []).map((t) => (t.id === userTurn.id ? { ...t, failed: true } : t)),
        )
      }
    } finally {
      abortRef.current = null
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
  const retry = (turn: InvestChatTurn) => {
    if (sending) return
    setTurns((prev) => (prev ?? []).filter((t) => t.id !== turn.id))
    void sendText(turn.content)
  }

  /* Try another answer — the server drops the last pair and re-asks, so
     locally the pair leaves too; the fresh reply streams into the pending
     bubble like a normal send. */
  const regenerate = async () => {
    if (sending) return
    const list = turns ?? []
    const last = list[list.length - 1]
    const prevUser = list[list.length - 2]
    if (!last || last.role !== 'assistant' || !prevUser || prevUser.role !== 'user') return
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setSending(true)
    setStreamed('')
    setSuggests([])
    setReasonFor(null)
    stickToBottom()
    /* Locally the pair stays — the pending bubble shows the re-asked
       question's progress; the old answer swaps out only when the new one
       lands or the call fails (the pair is gone server-side either way). */
    const pairIds = [last.id, prevUser.id]
    setTurns((prev) => (prev ?? []).filter((t) => !pairIds.includes(t.id)))
    setTurns((prev) => [
      ...(prev ?? []),
      {
        id: `u-${Date.now()}`,
        role: 'user',
        content: prevUser.content,
        action: null,
        feedback: null,
        createdAt: new Date().toISOString(),
      },
    ])
    try {
      const result = await regenerateInvestChat(lang, setStreamed, {
        threadId,
        signal: ctrl.signal,
      })
      await adoptReply(result)
    } catch (err) {
      if (!(isAbort(err) || ctrl.signal.aborted)) showToast(IM.invest_chat_error)
    } finally {
      abortRef.current = null
      setSending(false)
      setStreamed('')
    }
  }

  /* Reuse — copies a sent turn back into the composer for editing; the
     original history row is untouched. */
  const reuse = (turn: InvestChatTurn) => {
    setDraft(turn.content)
    inputRef.current?.focus()
  }

  /* Undo on an action chip — the server reverses the write while it's still
     reversible and marks it undone, so the chip doesn't offer it again
     after a reload. */
  const undo = async (turnId: string) => {
    if (undoing) return
    setUndoing(turnId)
    try {
      await undoInvestChatAction(turnId)
      setTurns((prev) =>
        (prev ?? []).map((t) =>
          t.id === turnId && t.action ? { ...t, action: { ...t.action, undone: true } } : t,
        ),
      )
      await refresh()
    } catch {
      showToast(IM.invest_chat_undo_failed)
    } finally {
      setUndoing(null)
    }
  }

  const clear = async () => {
    if (clearing) return
    setClearing(true)
    try {
      await clearInvestChat(threadId)
      setTurns([])
      setHasMore(false)
      setSuggests([])
    } catch {
      showToast(IM.invest_chat_error)
    } finally {
      setClearing(false)
    }
  }

  /* Thumbs on an assistant turn — only real rows (uuid ids) can hold a
     rating; optimistic, reverted if the write fails. A downvote opens the
     one-tap reason chips. */
  const rate = async (turnId: string, rating: 1 | -1) => {
    const before = turns?.find((t) => t.id === turnId)?.feedback ?? null
    const next = before === rating ? 0 : rating
    setTurns((prev) =>
      (prev ?? []).map((t) =>
        t.id === turnId ? { ...t, feedback: next || null, feedbackReason: null } : t,
      ),
    )
    setReasonFor(next === -1 ? turnId : null)
    try {
      await rateInvestChatTurn(turnId, next)
    } catch {
      setTurns((prev) =>
        (prev ?? []).map((t) => (t.id === turnId ? { ...t, feedback: before } : t)),
      )
      setReasonFor(null)
    }
  }

  /* Reason chip under a downvote — stores the why with the rating. */
  const pickReason = async (turnId: string, reason: string) => {
    setReasonFor(null)
    setTurns((prev) =>
      (prev ?? []).map((t) => (t.id === turnId ? { ...t, feedbackReason: reason } : t)),
    )
    try {
      await rateInvestChatTurn(turnId, -1, reason)
    } catch {
      /* The rating itself already landed — a failed reason just leaves the
         downvote unexplained. */
      setTurns((prev) =>
        (prev ?? []).map((t) => (t.id === turnId ? { ...t, feedbackReason: null } : t)),
      )
    }
  }

  /* Thread switching — the list holds the named conversations; the default
     (null) is always selectable as the main one. */
  const openThread = (id: string | null) => {
    if (sending || id === threadId) return
    setThreadId(id)
  }
  const startThread = async () => {
    if (sending) return
    try {
      const t = await newInvestChatThread()
      setThreads((prev) => [...(prev ?? []), t])
      setThreadId(t.id)
    } catch {
      showToast(IM.invest_chat_error)
    }
  }

  /* Empty-state starters — the third slot differs by tier so staff see an
     advice-shaped ask instead of a teaching one. */
  const starters = [
    x(IM.invest_chat_starter_1),
    x(IM.invest_chat_starter_2),
    x(isInternal ? IM.invest_chat_starter_int : IM.invest_chat_starter_ext),
  ]
  const reasonChips = [
    x(IM.invest_chat_reason_wrong),
    x(IM.invest_chat_reason_vague),
    x(IM.invest_chat_reason_tone),
  ]
  const activeThread = threads?.find((t) => t.id === threadId)
  const threadName = threadId
    ? (activeThread?.title ?? x(IM.invest_chat_thread_untitled))
    : x(IM.invest_chat_thread_default)

  return (
    <div className="sb sb-page">
      <div className="sb-head-row">
        <h1>{x(IM.invest_chat_title)}</h1>
        <div className="sbchat-head-actions">
          <ThreadSwitcher
            activeName={threadName}
            threads={threads ?? []}
            activeId={threadId}
            disabled={sending}
            labels={{
              defaultThread: x(IM.invest_chat_thread_default),
              untitled: x(IM.invest_chat_thread_untitled),
              newThread: x(IM.invest_chat_thread_new),
            }}
            buttonClass="sb-btn sb-btn-sm sb-btn-secondary"
            listClass="sbchat-thread-list"
            itemClass="sbchat-thread-item"
            newItemClass="sbchat-thread-new"
            onOpen={openThread}
            onNew={() => void startThread()}
          />
          {turns !== null && turns.length > 0 && (
            <button
              type="button"
              className="sb-btn sb-btn-sm sb-btn-secondary"
              onClick={() => void clear()}
              disabled={clearing}
            >
              <Trash2 size={13} aria-hidden="true" />
              {x(IM.invest_chat_clear)}
            </button>
          )}
        </div>
      </div>
      {/* Internal-staff tier — the edge function advises @dutiva.ca
          accounts directly, so the "never investment advice" subtitle would
          be untrue for them; the badge makes the active register scannable. */}
      <p className="sb-sub">
        {x(isInternal ? IM.invest_chat_sub_internal : IM.invest_chat_sub)}
        {isInternal && <span className="sbchat-tier">{x(IM.invest_chat_internal_badge)}</span>}
      </p>
      {/* Data-source disclosure — an advice surface says what it reads. */}
      <details className="sbchat-sees">
        <summary>{x(IM.invest_chat_sees)}</summary>
        <p>{x(IM.invest_chat_sees_list)}</p>
      </details>

      <section className="sb-card sb-card-pad sbchat" style={{ marginTop: 14 }}>
        <div className="sbchat-log-wrap">
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
                  x(IM.invest_chat_load_earlier)
                )}
              </button>
            )}
            {turns === null ? (
              <>
                <div className="sbchat-bubble assistant sbchat-ghost sbchat-g-a" aria-hidden="true" />
                <div className="sbchat-bubble user sbchat-ghost sbchat-g-b" aria-hidden="true" />
              </>
            ) : turns.length === 0 ? (
              /* She speaks first — a greeting built locally from InvestState,
                 not a stored turn, so clearing history brings it back. The
                 chips are tappable sends — they teach the surface without
                 typing. */
              <>
                <div className="sbchat-bubble assistant">{tallyGreeting(state, lang)}</div>
                <ChipRow
                  chips={starters}
                  className="sbchat-starters"
                  chipClass="sbchat-starter"
                  onPick={(s) => void sendText(s)}
                />
              </>
            ) : (
              turns.map((t, i) => {
                const prev = i > 0 ? turns[i - 1] : undefined
                const showDay = !prev || !sameTurnDay(prev.createdAt, t.createdAt)
                const route = t.action?.ok ? actionRoute(t.action) : null
                const isLastAssistant =
                  t.role === 'assistant' && i === turns.length - 1 && UUID_RE.test(t.id)
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
                          <ChatMarkdown widgetSurface="invest">{t.content}</ChatMarkdown>
                        </Suspense>
                      ) : (
                        t.content
                      )}
                      {t.failed && (
                        <span className="sbchat-bubble-meta">
                          {x(IM.invest_chat_error)}
                          <button
                            type="button"
                            className="sbchat-retry"
                            onClick={() => retry(t)}
                          >
                            <RotateCcw size={10} aria-hidden="true" /> {x(IM.invest_chat_retry)}
                          </button>
                        </span>
                      )}
                      {t.action && (
                        <span className="sbchat-chip" data-ok={t.action.ok ? 'true' : 'false'}>
                          <Check size={11} aria-hidden="true" />
                          {t.action.ok ? actionLabel(t.action, x) : x(IM.invest_chat_action_failed)}
                          {route && (
                            <Link className="sbchat-chip-link" to={route}>
                              {x(IM.invest_chat_view)}
                            </Link>
                          )}
                          {t.action.ok &&
                            t.action.refId &&
                            UUID_RE.test(t.id) &&
                            (t.action.undone ? (
                              <em className="sbchat-chip-undone">{x(IM.invest_chat_undone)}</em>
                            ) : (
                              <button
                                type="button"
                                className="sbchat-chip-undo"
                                disabled={undoing === t.id}
                                onClick={() => void undo(t.id)}
                              >
                                {x(IM.invest_chat_undo)}
                              </button>
                            ))}
                        </span>
                      )}
                      {!t.failed && (
                        <span className="sbchat-bubble-meta">
                          <time>{formatTurnTime(t.createdAt, lang)}</time>
                          {t.role === 'user' && (
                            <button
                              type="button"
                              className="sbchat-rate-btn"
                              aria-label={x(IM.invest_chat_reuse)}
                              title={x(IM.invest_chat_reuse)}
                              onClick={() => reuse(t)}
                            >
                              <Pencil size={12} aria-hidden="true" />
                            </button>
                          )}
                          {t.role === 'assistant' && UUID_RE.test(t.id) && (
                            <span className="sbchat-rate">
                              <CopyTurnButton
                                text={t.content}
                                label={x(IM.invest_chat_copy)}
                                className="sbchat-rate-btn"
                              />
                              <button
                                type="button"
                                className="sbchat-rate-btn"
                                aria-label={x(IM.invest_chat_rate_up)}
                                aria-pressed={t.feedback === 1}
                                onClick={() => void rate(t.id, 1)}
                              >
                                <ThumbsUp size={12} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                className="sbchat-rate-btn"
                                aria-label={x(IM.invest_chat_rate_down)}
                                aria-pressed={t.feedback === -1}
                                onClick={() => void rate(t.id, -1)}
                              >
                                <ThumbsDown size={12} aria-hidden="true" />
                              </button>
                              {isLastAssistant && !sending && (
                                <button
                                  type="button"
                                  className="sbchat-rate-btn"
                                  aria-label={x(IM.invest_chat_regenerate)}
                                  title={x(IM.invest_chat_regenerate)}
                                  onClick={() => void regenerate()}
                                >
                                  <RefreshCw size={12} aria-hidden="true" />
                                </button>
                              )}
                            </span>
                          )}
                        </span>
                      )}
                      {/* One-tap reason chips after a downvote — the rating
                          alone learns nothing; these say why. */}
                      {reasonFor === t.id && !t.feedbackReason && (
                        <ReasonChips
                          label={x(IM.invest_chat_reason_label)}
                          reasons={reasonChips}
                          className="sbchat-reasons"
                          chipClass="sbchat-reason"
                          onPick={(r) => void pickReason(t.id, r)}
                        />
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
                    <ChatMarkdown widgetSurface="invest" streaming>
                      {streamed}
                    </ChatMarkdown>
                  </Suspense>
                ) : (
                  <span className="sbchat-typing">
                    <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                    {x(IM.invest_chat_typing)}
                  </span>
                )}
                <span className="sbchat-bubble-meta">
                  <button
                    type="button"
                    className="sbchat-rate-btn"
                    aria-label={x(IM.invest_chat_stop)}
                    title={x(IM.invest_chat_stop)}
                    onClick={() => abortRef.current?.abort()}
                  >
                    <Square size={11} aria-hidden="true" />
                  </button>
                </span>
              </div>
            )}
            {/* Follow-up chips — the reply's own suggested next asks. */}
            {!sending && suggests.length > 0 && (
              <ChipRow
                chips={suggests}
                label={x(IM.invest_chat_followup_label)}
                className="sbchat-starters"
                chipClass="sbchat-starter"
                onPick={(s) => void sendText(s)}
              />
            )}
          </div>
          {farUp && (
            <JumpToLatest
              label={x(IM.invest_chat_jump)}
              hasNew={hasNew}
              className="sbchat-jump"
              dotClass="sbchat-jump-dot"
              onJump={stickToBottom}
            />
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
            placeholder={x(IM.invest_chat_placeholder)}
            maxLength={1200}
            rows={1}
            aria-label={x(IM.invest_chat_placeholder)}
          />
          <button
            type="button"
            className="sbchat-send"
            onClick={send}
            disabled={sending || !draft.trim()}
            aria-label={x(IM.invest_chat_send)}
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="sbchat-compose-meta">
          <span>{x(IM.invest_chat_enter_hint)}</span>
          {draft.length > COUNT_FROM && <span>{draft.length}/1200</span>}
        </div>
      </section>
    </div>
  )
}
