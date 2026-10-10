import '@/features/invest/portal/strategies.css'
import './health.css'
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
import { healthMessages as HM } from '@/i18n/messages/health'
import { useAuth } from '@/features/app/auth/authContext'
import { isInternalDutivaAccount } from '@/lib/billing/adminAccess'
import { useHealthData } from '@/features/health/data/HealthDataContext'
import {
  clearHealthChat,
  listHealthChatThreads,
  loadHealthChatHistory,
  newHealthChatThread,
  rateHealthChatTurn,
  regenerateHealthChat,
  sendHealthChat,
  undoHealthChatAction,
  type HealthChatAction,
  type HealthChatThread,
  type HealthChatTurn,
} from '@/features/health/data/api'
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
import { companionGreeting } from './healthUi'
import { useHealthHead } from './useHealthHead'

/* Markdown + widget-fence rendering is a lazy chunk (react-markdown,
   remark-gfm, the widget spec parser) — the bubble falls back to verbatim
   text while it loads. */
const ChatMarkdown = lazy(() =>
  import('@/components/advisor/ChatMarkdown').then((m) => ({
    default: m.ChatMarkdown,
  })),
)

/** What the assistant did during a turn, as a confirmation chip. The label
    keys mirror the action grammar in health-ai/handlers.ts. */
function actionLabel(
  action: HealthChatAction,
  x: (m: { en: string; fr: string }) => string,
): string {
  const slots = { name: action.detail }
  switch (action.type) {
    case 'mark_habit_done':
      return x(HM.health_chat_did_mark).replace('{name}', slots.name)
    case 'unmark_habit_done':
      return x(HM.health_chat_did_unmark).replace('{name}', slots.name)
    case 'add_habit':
      return x(HM.health_chat_did_habit).replace('{name}', slots.name)
    case 'add_checkin':
      return x(HM.health_chat_did_checkin).replace('{name}', slots.name)
    case 'add_journal_entry':
      return x(HM.health_chat_did_journal)
    default:
      return ''
  }
}

/** The portal page the action's write lands on — the chip's "View" link. */
function actionRoute(action: HealthChatAction): string | null {
  switch (action.type) {
    case 'mark_habit_done':
    case 'unmark_habit_done':
    case 'add_habit':
      return '/health/habits'
    case 'add_checkin':
      return '/health/check-in'
    case 'add_journal_entry':
      return '/health/journal'
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
 * Mira — the portal's emotional companion. She keeps company over the user's
 * own context (numbers, notes, journal excerpts, this conversation) and can
 * also act: mark a habit done, add a habit, log a check-in, save a journal
 * entry. History persists server-side (health_chat_messages), so the
 * conversation follows the account across sessions. Actions refresh the
 * shared HealthDataContext, so every other page reflects them immediately.
 */
export function HealthChatPage() {
  const { x, lang } = useI18n()
  const { session } = useAuth()
  const { state, refresh } = useHealthData()
  const { showToast } = useToasts()
  useHealthHead(HM.health_seo_title_chat, HM.health_seo_desc_chat)

  const [turns, setTurns] = useState<HealthChatTurn[] | null>(null)
  const [sending, setSending] = useState(false)
  const [streamed, setStreamed] = useState('')
  const [undoing, setUndoing] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  /* Follow-up chips from the latest reply — ephemeral, cleared on send. */
  const [suggests, setSuggests] = useState<string[]>([])
  /* Named conversations — null threadId is the default ("main") one. */
  const [threads, setThreads] = useState<HealthChatThread[] | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  /* Turn id whose downvote is waiting on a reason chip pick. */
  const [reasonFor, setReasonFor] = useState<string | null>(null)
  /* The running send's abort handle — the Stop pill cancels the stream. */
  const abortRef = useRef<AbortController | null>(null)
  const [draft, setDraft] = usePortalChatDraft(`dutiva:health-chat:${threadId ?? 'main'}`)
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
    loadHealthChatHistory(HISTORY_PAGE, undefined, threadId)
      .then((rows) => {
        setTurns(rows)
        /* A full page back means older turns probably exist. */
        setHasMore(rows.length === HISTORY_PAGE)
      })
      .catch(() => setTurns([]))
  }, [threadId])

  useEffect(() => {
    listHealthChatThreads()
      .then(setThreads)
      .catch(() => setThreads([]))
  }, [])

  /* While the tab sits open, pick up turns another writer added — a
     reaction line from elsewhere in the portal lands in the default
     conversation without a send. Append-only merge on row ids. */
  useEffect(() => {
    const poll = async () => {
      if (document.hidden || sending) return
      try {
        const rows = await loadHealthChatHistory(20, undefined, threadId)
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
      const rows = await loadHealthChatHistory(HISTORY_PAGE, oldest, threadId)
      capturePrepend()
      setTurns((prev) => [...rows, ...(prev ?? [])])
      setHasMore(rows.length === HISTORY_PAGE)
    } catch {
      showToast(HM.health_chat_error)
    } finally {
      setLoadingMore(false)
    }
  }

  /* Shared tail of send + regenerate — appends the assistant turn, adopts
     its suggestions, and refreshes a named thread's freshly-set title. */
  const adoptReply = (result: {
    reply: string
    action: HealthChatAction | null
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
      void listHealthChatThreads()
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
    const userTurn: HealthChatTurn = {
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
      const result = await sendHealthChat(message, lang, setStreamed, {
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
        showToast(HM.health_chat_error)
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
  const retry = (turn: HealthChatTurn) => {
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
    /* The pair leaves the log — it's deleted server-side either way; the
       re-asked question re-appears as a fresh optimistic turn. */
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
      const result = await regenerateHealthChat(lang, setStreamed, {
        threadId,
        signal: ctrl.signal,
      })
      await adoptReply(result)
    } catch (err) {
      if (!(isAbort(err) || ctrl.signal.aborted)) showToast(HM.health_chat_error)
    } finally {
      abortRef.current = null
      setSending(false)
      setStreamed('')
    }
  }

  /* Reuse — copies a sent turn back into the composer for editing; the
     original history row is untouched. */
  const reuse = (turn: HealthChatTurn) => {
    setDraft(turn.content)
    inputRef.current?.focus()
  }

  /* Undo on an action chip — the server reverses the write and marks the
     action undone, so the chip doesn't offer it again after a reload. */
  const undo = async (turnId: string) => {
    if (undoing) return
    setUndoing(turnId)
    try {
      await undoHealthChatAction(turnId)
      setTurns((prev) =>
        (prev ?? []).map((t) =>
          t.id === turnId && t.action ? { ...t, action: { ...t.action, undone: true } } : t,
        ),
      )
      await refresh()
    } catch {
      showToast(HM.health_chat_undo_failed)
    } finally {
      setUndoing(null)
    }
  }

  const clear = async () => {
    if (clearing) return
    setClearing(true)
    try {
      await clearHealthChat(threadId)
      setTurns([])
      setHasMore(false)
      setSuggests([])
    } catch {
      showToast(HM.health_chat_error)
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
      await rateHealthChatTurn(turnId, next)
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
      await rateHealthChatTurn(turnId, -1, reason)
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
      const t = await newHealthChatThread()
      setThreads((prev) => [...(prev ?? []), t])
      setThreadId(t.id)
    } catch {
      showToast(HM.health_chat_error)
    }
  }

  /* Empty-state starters — the third slot differs by tier so staff see an
     advice-shaped ask instead of a teaching one. */
  const starters = [
    x(HM.health_chat_starter_1),
    x(HM.health_chat_starter_2),
    x(isInternal ? HM.health_chat_starter_int : HM.health_chat_starter_ext),
  ]
  const reasonChips = [
    x(HM.health_chat_reason_wrong),
    x(HM.health_chat_reason_vague),
    x(HM.health_chat_reason_tone),
  ]
  const activeThread = threads?.find((t) => t.id === threadId)
  const threadName = threadId
    ? (activeThread?.title ?? x(HM.health_chat_thread_untitled))
    : x(HM.health_chat_thread_default)

  return (
    <div className="sb hb sb-page">
      <div className="sb-head-row">
        <h1>{x(HM.health_chat_title)}</h1>
        <div className="sbchat-head-actions">
          <ThreadSwitcher
            activeName={threadName}
            threads={threads ?? []}
            activeId={threadId}
            disabled={sending}
            labels={{
              defaultThread: x(HM.health_chat_thread_default),
              untitled: x(HM.health_chat_thread_untitled),
              newThread: x(HM.health_chat_thread_new),
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
              {x(HM.health_chat_clear)}
            </button>
          )}
        </div>
      </div>
      {/* Internal-staff tier — the edge function advises @dutiva.ca accounts
          directly, so the not-a-therapist subtitle is joined by a badge that
          makes the active register scannable. */}
      <p className="sb-sub">
        {x(isInternal ? HM.health_chat_sub_internal : HM.health_chat_sub)}
        {isInternal && <span className="sbchat-tier">{x(HM.health_chat_internal_badge)}</span>}
      </p>
      {/* Data-source disclosure — she says what she reads. */}
      <details className="sbchat-sees">
        <summary>{x(HM.health_chat_sees)}</summary>
        <p>{x(HM.health_chat_sees_list)}</p>
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
                  x(HM.health_chat_load_earlier)
                )}
              </button>
            )}
            {turns === null ? (
              <>
                <div className="sbchat-bubble assistant sbchat-ghost sbchat-g-a" aria-hidden="true" />
                <div className="sbchat-bubble user sbchat-ghost sbchat-g-b" aria-hidden="true" />
              </>
            ) : turns.length === 0 ? (
              /* She speaks first — a greeting built locally from HealthState,
                 not a stored turn, so clearing history brings it back. The
                 chips are tappable sends — they teach the surface without
                 typing. */
              <>
                <div className="sbchat-bubble assistant">{companionGreeting(state, lang)}</div>
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
                          <ChatMarkdown widgetSurface="health">{t.content}</ChatMarkdown>
                        </Suspense>
                      ) : (
                        t.content
                      )}
                      {t.failed && (
                        <span className="sbchat-bubble-meta">
                          {x(HM.health_chat_error)}
                          <button
                            type="button"
                            className="sbchat-retry"
                            onClick={() => retry(t)}
                          >
                            <RotateCcw size={10} aria-hidden="true" /> {x(HM.health_chat_retry)}
                          </button>
                        </span>
                      )}
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
                                onClick={() => void undo(t.id)}
                              >
                                {x(HM.health_chat_undo)}
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
                              aria-label={x(HM.health_chat_reuse)}
                              title={x(HM.health_chat_reuse)}
                              onClick={() => reuse(t)}
                            >
                              <Pencil size={12} aria-hidden="true" />
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
                                onClick={() => void rate(t.id, 1)}
                              >
                                <ThumbsUp size={12} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                className="sbchat-rate-btn"
                                aria-label={x(HM.health_chat_rate_down)}
                                aria-pressed={t.feedback === -1}
                                onClick={() => void rate(t.id, -1)}
                              >
                                <ThumbsDown size={12} aria-hidden="true" />
                              </button>
                              {isLastAssistant && !sending && (
                                <button
                                  type="button"
                                  className="sbchat-rate-btn"
                                  aria-label={x(HM.health_chat_regenerate)}
                                  title={x(HM.health_chat_regenerate)}
                                  onClick={() => void regenerate()}
                                >
                                  <RefreshCw size={12} aria-hidden="true" />
                                </button>
                              )}
                            </span>
                          )}
                        </span>
                      )}
                      {reasonFor === t.id && !t.feedbackReason && (
                        <ReasonChips
                          label={x(HM.health_chat_reason_label)}
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
                    <ChatMarkdown widgetSurface="health" streaming>
                      {streamed}
                    </ChatMarkdown>
                  </Suspense>
                ) : (
                  <span className="sbchat-typing">
                    <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                    {x(HM.health_chat_typing)}
                  </span>
                )}
                <span className="sbchat-bubble-meta">
                  <button
                    type="button"
                    className="sbchat-rate-btn"
                    aria-label={x(HM.health_chat_stop)}
                    title={x(HM.health_chat_stop)}
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
                label={x(HM.health_chat_followup_label)}
                className="sbchat-starters"
                chipClass="sbchat-starter"
                onPick={(s) => void sendText(s)}
              />
            )}
          </div>
          {farUp && (
            <JumpToLatest
              label={x(HM.health_chat_jump)}
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
            placeholder={x(HM.health_chat_placeholder)}
            maxLength={1200}
            rows={1}
            aria-label={x(HM.health_chat_placeholder)}
          />
          <button
            type="button"
            className="sbchat-send"
            onClick={send}
            disabled={sending || !draft.trim()}
            aria-label={x(HM.health_chat_send)}
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="sbchat-compose-meta">
          <span>{x(HM.health_chat_enter_hint)}</span>
          {draft.length > COUNT_FROM && <span>{draft.length}/1200</span>}
        </div>
        <p className="sbchat-note">{x(HM.health_crisis_note)}</p>
      </section>
    </div>
  )
}
